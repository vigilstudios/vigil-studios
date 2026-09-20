import { GitHubRefMovedError, type GitHubBranchHead } from "@/lib/vigil/providers/github";
import { CREATIVE_WORKSPACE_ROOT } from "./config";
import { gitBlobSha, type WorkspaceFile } from "./workspace";

/**
 * Publishing a workspace into the customer repository: one commit, only
 * the files that changed, nothing a person wrote touched.
 *
 * Decision per generated file, from what the branch holds now and the
 * blob sha Vigil recorded the last time it wrote that path:
 *   absent                       → write
 *   identical                    → nothing (a retry commits nothing)
 *   changed, last written by us  → write (regeneration)
 *   changed by someone else      → keep theirs, write ours beside it as
 *                                  <name>.v<n>.<ext>, and say so
 *   under outputs/               → never written once present
 */
export interface WorkspaceRepository {
  getBranchHead(fullName: string, branch: string): Promise<GitHubBranchHead>;
  listTree(fullName: string, treeSha: string, prefix: string): Promise<Map<string, string>>;
  commitFiles(fullName: string, input: { branch: string; parentSha: string; baseTreeSha: string; message: string; files: { path: string; content: Buffer | string }[] }): Promise<{ commitSha: string; treeSha: string }>;
}

export type PublishInput = {
  fullName: string;
  branch: string;
  message: string;
  files: WorkspaceFile[];
  /** path → blob sha Vigil wrote last time; anything else at that path is a human edit. */
  previouslyGenerated: Record<string, string>;
};

export type PublishResult = {
  commitSha: string | null;
  headSha: string;
  written: string[];
  unchanged: string[];
  preserved: { path: string; writtenAs: string }[];
  /** path → blob sha of every generated file as it now exists on the branch (including versioned copies). */
  generated: Record<string, string>;
};

const OUTPUTS_PREFIX = `${CREATIVE_WORKSPACE_ROOT}/outputs/`;

export function planPublish(files: WorkspaceFile[], existing: Map<string, string>, previouslyGenerated: Record<string, string>): Omit<PublishResult, "commitSha" | "headSha"> & { toWrite: { path: string; content: Buffer | string }[] } {
  const toWrite: { path: string; content: Buffer | string }[] = [];
  const written: string[] = [];
  const unchanged: string[] = [];
  const preserved: { path: string; writtenAs: string }[] = [];
  const generated: Record<string, string> = {};

  for (const file of files) {
    const sha = gitBlobSha(file.content);
    const current = existing.get(file.path);
    if (current === undefined) {
      toWrite.push({ path: file.path, content: file.content });
      written.push(file.path);
      if (!file.onlyIfMissing) generated[file.path] = sha;
      continue;
    }
    if (file.onlyIfMissing || file.path.startsWith(OUTPUTS_PREFIX)) continue;
    if (current === sha) {
      unchanged.push(file.path);
      generated[file.path] = sha;
      continue;
    }
    if (previouslyGenerated[file.path] === current) {
      toWrite.push({ path: file.path, content: file.content });
      written.push(file.path);
      generated[file.path] = sha;
      continue;
    }
    // Someone changed this file after Vigil wrote it (or Vigil never wrote it). Keep it.
    const versioned = versionedPath(file.path, sha, existing, previouslyGenerated);
    preserved.push({ path: file.path, writtenAs: versioned.path });
    if (versioned.write) {
      toWrite.push({ path: versioned.path, content: file.content });
      written.push(versioned.path);
    } else {
      unchanged.push(versioned.path);
    }
    generated[versioned.path] = sha;
  }
  return { toWrite, written, unchanged, preserved, generated };
}

/** `<dir>/<stem>.v<n>.<ext>`: the first n whose slot is free, or already holds exactly this content. */
function versionedPath(path: string, sha: string, existing: Map<string, string>, previouslyGenerated: Record<string, string>): { path: string; write: boolean } {
  const slash = path.lastIndexOf("/");
  const dir = path.slice(0, slash + 1), name = path.slice(slash + 1);
  const dot = name.startsWith(".") ? -1 : name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; n < 1000; n++) {
    const candidate = `${dir}${stem}.v${n}${ext}`;
    const current = existing.get(candidate);
    if (current === undefined) return { path: candidate, write: true };
    if (current === sha) return { path: candidate, write: false };
    if (previouslyGenerated[candidate] === current) return { path: candidate, write: true };
  }
  throw new Error(`Too many versions of ${path}.`);
}

export async function publishWorkspace(repo: WorkspaceRepository, input: PublishInput): Promise<PublishResult> {
  for (let attempt = 1; ; attempt++) {
    const head = await repo.getBranchHead(input.fullName, input.branch);
    const existing = await repo.listTree(input.fullName, head.treeSha, `${CREATIVE_WORKSPACE_ROOT}/`);
    const plan = planPublish(input.files, existing, input.previouslyGenerated);
    if (plan.toWrite.length === 0) {
      return { commitSha: null, headSha: head.commitSha, written: [], unchanged: plan.unchanged, preserved: plan.preserved, generated: plan.generated };
    }
    try {
      const commit = await repo.commitFiles(input.fullName, { branch: input.branch, parentSha: head.commitSha, baseTreeSha: head.treeSha, message: input.message, files: plan.toWrite });
      return { commitSha: commit.commitSha, headSha: commit.commitSha, written: plan.written, unchanged: plan.unchanged, preserved: plan.preserved, generated: plan.generated };
    } catch (error) {
      if (error instanceof GitHubRefMovedError && attempt < 3) continue;
      throw error;
    }
  }
}
