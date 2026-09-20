import "server-only";

import { ProviderError, ProviderNotConfiguredError } from "@/lib/vigil/auth/errors";

export type GitHubRepository = {
  id: number;
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
};

export type GitHubBranchHead = { branch: string; commitSha: string; treeSha: string };

/** The branch moved between reading its head and updating it; read again and decide again. */
export class GitHubRefMovedError extends ProviderError {
  constructor(branch: string) {
    super("github", `The ${branch} branch changed while the commit was being prepared.`, { retryable: true, status: 422 });
    this.name = "GitHubRefMovedError";
  }
}

/** Repository-relative, forward-slash, no traversal, no absolute or hidden-escape segments. */
export function assertRepositoryPath(filePath: string): void {
  const ok = filePath.length > 0 && filePath.length <= 400 && !filePath.startsWith("/") && !filePath.includes("\\") && !filePath.includes("\0") && filePath.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
  if (!ok) throw new ProviderError("github", `Refusing to write an unsafe repository path: ${JSON.stringify(filePath.slice(0, 80))}`);
}

type GitHubRepoResponse = {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
};

export class GitHubRepositoryProvider {
  constructor(
    private readonly token = process.env.GITHUB_TOKEN ?? "",
    private readonly owner = process.env.GITHUB_OWNER ?? "",
    private readonly ownerType = process.env.GITHUB_OWNER_TYPE ?? "organization",
    private readonly request: typeof fetch = fetch
  ) {}

  async ensureRepository(input: { name: string; description: string; files: { path: string; content: Buffer | string }[] }): Promise<GitHubRepository> {
    if (!this.token || !this.owner) throw new ProviderNotConfiguredError("GitHub repository provisioning");
    const existing = await this.getRepository(input.name);
    let repository = existing;
    if (!repository) {
      try {
        repository = await this.createRepository(input.name, input.description);
      } catch (error) {
        // Recover when another worker won the create race or the provider
        // succeeded but our request lost its response.
        repository = await this.getRepository(input.name);
        if (!repository) throw error;
      }
    }

    // The contents endpoint creates the default branch on the first file and
    // GitHub requires serial writes to avoid conflicting commits.
    for (const file of input.files) await this.createFileIfMissing(repository.fullName, file.path, file.content);
    return repository;
  }

  async collectSiteFiles(fullName: string): Promise<{ path: string; content: Buffer }[]> {
    if (!this.token) throw new ProviderNotConfiguredError("GitHub repository access");
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) throw new ProviderError("github", "The repository reference is invalid.");
    const repoPath = fullName.split("/").map(encodeURIComponent).join("/");
    const repository = await this.api(`/repos/${repoPath}`) as GitHubRepoResponse;
    const tree = await this.api(`/repos/${repoPath}/git/trees/${encodeURIComponent(repository.default_branch || "main")}?recursive=1`) as {
      truncated?: boolean;
      tree?: { path: string; type: string; url: string; size?: number }[];
    };
    if (tree.truncated) throw new ProviderError("github", "The repository is too large to export safely.");
    const entries = (tree.tree ?? []).filter((entry) => entry.type === "blob" && (entry.path.startsWith("site/") || entry.path.startsWith("content/") || /^readme\.md$/i.test(entry.path)));
    if (entries.reduce((sum, entry) => sum + (entry.size ?? 0), 0) > 50 * 1024 * 1024) throw new ProviderError("github", "The site export is larger than 50 MB.");
    return Promise.all(entries.map(async (entry) => {
      const blob = await this.api(new URL(entry.url).pathname) as { content?: string; encoding?: string };
      if (blob.encoding !== "base64" || !blob.content) throw new ProviderError("github", `GitHub could not return ${entry.path}.`);
      return { path: /^readme\.md$/i.test(entry.path) ? "PROJECT-README.md" : entry.path, content: Buffer.from(blob.content.replace(/\n/g, ""), "base64") };
    }));
  }

  /** The branch tip and its tree, read together so a commit can be built on exactly what was seen. */
  async getBranchHead(fullName: string, branch: string): Promise<GitHubBranchHead> {
    const repoPath = this.repoPath(fullName);
    const response = await this.api(`/repos/${repoPath}/branches/${encodeURIComponent(branch)}`) as { name?: string; commit?: { sha?: string; commit?: { tree?: { sha?: string } } } };
    if (!response.commit?.sha || !response.commit.commit?.tree?.sha) throw new ProviderError("github", `GitHub returned an incomplete branch for ${branch}.`);
    return { branch, commitSha: response.commit.sha, treeSha: response.commit.commit.tree.sha };
  }

  /** Blob paths and shas under a prefix. Refuses a truncated listing rather than guessing what is there. */
  async listTree(fullName: string, treeSha: string, prefix: string): Promise<Map<string, string>> {
    const repoPath = this.repoPath(fullName);
    const tree = await this.api(`/repos/${repoPath}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`) as { truncated?: boolean; tree?: { path: string; type: string; sha: string }[] };
    if (tree.truncated) throw new ProviderError("github", "The repository tree is too large to read safely.");
    const entries = new Map<string, string>();
    for (const entry of tree.tree ?? []) if (entry.type === "blob" && entry.path.startsWith(prefix)) entries.set(entry.path, entry.sha);
    return entries;
  }

  /**
   * One commit that adds or replaces the given files on top of `parent`,
   * touching nothing else. The ref update is not forced: if the branch moved
   * since `parent` was read, GitHub refuses and the caller re-reads and
   * decides again, so two workers cannot silently stack commits.
   */
  async commitFiles(fullName: string, input: { branch: string; parentSha: string; baseTreeSha: string; message: string; files: { path: string; content: Buffer | string }[] }): Promise<{ commitSha: string; treeSha: string }> {
    if (!this.token) throw new ProviderNotConfiguredError("GitHub repository access");
    const repoPath = this.repoPath(fullName);
    const tree: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
    for (const file of input.files) {
      assertRepositoryPath(file.path);
      const blob = await this.api(`/repos/${repoPath}/git/blobs`, { method: "POST", body: { content: Buffer.from(file.content).toString("base64"), encoding: "base64" } }) as { sha?: string };
      if (!blob.sha) throw new ProviderError("github", `GitHub did not return a blob for ${file.path}.`, { retryable: true });
      tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const created = await this.api(`/repos/${repoPath}/git/trees`, { method: "POST", body: { base_tree: input.baseTreeSha, tree } }) as { sha?: string };
    if (!created.sha) throw new ProviderError("github", "GitHub did not return a tree.", { retryable: true });
    const commit = await this.api(`/repos/${repoPath}/git/commits`, { method: "POST", body: { message: input.message, tree: created.sha, parents: [input.parentSha] } }) as { sha?: string };
    if (!commit.sha) throw new ProviderError("github", "GitHub did not return a commit.", { retryable: true });
    try {
      await this.api(`/repos/${repoPath}/git/refs/heads/${encodeURIComponent(input.branch)}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
    } catch (error) {
      if (error instanceof ProviderError && error.status === 422) throw new GitHubRefMovedError(input.branch);
      throw error;
    }
    return { commitSha: commit.sha, treeSha: created.sha };
  }

  private repoPath(fullName: string): string {
    if (!this.token) throw new ProviderNotConfiguredError("GitHub repository access");
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) throw new ProviderError("github", "The repository reference is invalid.");
    return fullName.split("/").map(encodeURIComponent).join("/");
  }

  async deleteRepository(fullName: string): Promise<void> {
    if (!this.token) throw new ProviderNotConfiguredError("GitHub repository access");
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(fullName)) throw new ProviderError("github", "The repository reference is invalid.");
    const repoPath = fullName.split("/").map(encodeURIComponent).join("/");
    await this.api(`/repos/${repoPath}`, { method: "DELETE", allowNotFound: true });
  }

  private async getRepository(name: string): Promise<GitHubRepository | null> {
    const response = await this.api(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(name)}`, { allowNotFound: true });
    if (!response) return null;
    return normalizeRepository(response as GitHubRepoResponse);
  }

  private async createRepository(name: string, description: string): Promise<GitHubRepository> {
    const path = this.ownerType === "user" ? "/user/repos" : `/orgs/${encodeURIComponent(this.owner)}/repos`;
    const response = await this.api(path, {
      method: "POST",
      body: { name, description, private: true, auto_init: false, has_issues: true, has_projects: false, has_wiki: false },
    });
    return normalizeRepository(response as GitHubRepoResponse);
  }

  private async createFileIfMissing(fullName: string, filePath: string, content: Buffer | string): Promise<void> {
    const path = `/repos/${fullName.split("/").map(encodeURIComponent).join("/")}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}`;
    if (await this.api(path, { allowNotFound: true })) return;
    await this.api(path, {
      method: "PUT",
      body: {
        message: `Initialize ${filePath}`,
        content: Buffer.from(content).toString("base64"),
      },
    });
  }

  private async api(path: string, options: { method?: string; body?: unknown; allowNotFound?: boolean } = {}): Promise<unknown | null> {
    let response: Response;
    try {
      response = await this.request(`https://api.github.com${path}`, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2026-03-10",
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      throw new ProviderError("github", `GitHub request failed: ${error instanceof Error ? error.message : String(error)}`, { retryable: true });
    }
    if (options.allowNotFound && response.status === 404) return null;
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) {
      throw new ProviderError("github", payload.message ?? `GitHub returned ${response.status}.`, {
        retryable: response.status === 408 || response.status === 429 || response.status >= 500,
        status: response.status,
      });
    }
    return payload;
  }
}

function normalizeRepository(repo: GitHubRepoResponse): GitHubRepository {
  if (!repo?.id || !repo.full_name || !repo.html_url) throw new ProviderError("github", "GitHub returned an incomplete repository.");
  return { id: repo.id, fullName: repo.full_name, htmlUrl: repo.html_url, defaultBranch: repo.default_branch || "main" };
}
