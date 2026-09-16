import "server-only";

import { ProviderError, ProviderNotConfiguredError } from "@/lib/vigil/auth/errors";

export type GitHubRepository = {
  id: number;
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
};

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
