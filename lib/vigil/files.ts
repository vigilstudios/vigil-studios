/**
 * The customer's project library: what may go in and how much. The limits
 * are entitlement rows (files.*), overridable per organization; this module
 * is the shared vocabulary for the uploader, the server action and the page.
 * The database trigger project_assets_enforce_quota is the backstop.
 */
import type { AssetKind } from "@/lib/vigil/onboarding/assets";

export const FILE_FEATURES = {
  maxCount: "files.max_count",
  maxFileMb: "files.max_file_mb",
  maxTotalMb: "files.max_total_mb",
  video: "files.video_enabled",
} as const;

export type FileLimits = {
  maxCount: number | null;
  maxFileBytes: number | null;
  maxTotalBytes: number | null;
  videoEnabled: boolean;
};

export type FileUsage = { count: number; bytes: number };

export const MB = 1024 * 1024;

/** Type → extension and library kind. Anything else is refused before upload. */
export const FILE_TYPES: Record<string, { ext: string; kind: AssetKind }> = {
  "image/png": { ext: "png", kind: "photo" },
  "image/jpeg": { ext: "jpg", kind: "photo" },
  "image/webp": { ext: "webp", kind: "photo" },
  "image/gif": { ext: "gif", kind: "photo" },
  "image/heic": { ext: "heic", kind: "photo" },
  "image/heif": { ext: "heif", kind: "photo" },
  "image/svg+xml": { ext: "svg", kind: "logo" },
  "application/pdf": { ext: "pdf", kind: "document" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/x-m4v": { ext: "m4v", kind: "video" },
};

export const FILE_ACCEPT = Object.keys(FILE_TYPES).join(",");

/** Above this, uploads go through the resumable endpoint in 6 MB chunks. */
export const RESUMABLE_THRESHOLD_BYTES = 6 * MB;

export function kindForType(contentType: string): AssetKind | null {
  return FILE_TYPES[contentType]?.kind ?? null;
}

export function isVideo(contentType: string): boolean {
  return contentType.startsWith("video/");
}

export type FileProblem = { name: string; reason: string };

/**
 * Check a batch against the limits and current usage. The batch is judged as
 * a whole for count and size, so a customer at 58 of 60 who drops five files
 * hears it before anything uploads.
 */
export function validateFileBatch(
  files: { name: string; type: string; size: number }[],
  limits: FileLimits,
  usage: FileUsage,
): FileProblem[] {
  const problems: FileProblem[] = [];
  if (files.length === 0) return problems;
  if (limits.maxCount !== null && usage.count + files.length > limits.maxCount) {
    const room = Math.max(0, limits.maxCount - usage.count);
    problems.push({ name: "*", reason: room === 0 ? `Your library is full (${limits.maxCount} files). Remove something first, or ask Vigil for more room.` : `Room for ${room} more file${room === 1 ? "" : "s"} (${limits.maxCount} in total). Choose fewer, or ask Vigil for more room.` });
  }
  const batchBytes = files.reduce((n, f) => n + f.size, 0);
  if (limits.maxTotalBytes !== null && usage.bytes + batchBytes > limits.maxTotalBytes) {
    problems.push({ name: "*", reason: `That would go past your library's ${formatMb(limits.maxTotalBytes)} of space.` });
  }
  for (const f of files) {
    const type = FILE_TYPES[f.type];
    if (!type) problems.push({ name: f.name, reason: "Photos (PNG, JPEG, WebP, GIF, HEIC), PDF or video (MP4, MOV, WebM) only." });
    else if (type.kind === "video" && !limits.videoEnabled) problems.push({ name: f.name, reason: "Video is not enabled for this account." });
    else if (f.size === 0) problems.push({ name: f.name, reason: "Empty file." });
    else if (limits.maxFileBytes !== null && f.size > limits.maxFileBytes) problems.push({ name: f.name, reason: `Larger than ${formatMb(limits.maxFileBytes)}.` });
  }
  return problems;
}

export function formatMb(bytes: number): string {
  const mb = bytes / MB;
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${Math.round(mb)} MB`;
}

/** <org>/<project>/<random>.<ext>: the organization prefix is what storage RLS reads. */
export function filePath(organizationId: string, projectId: string, contentType: string, random: string): string {
  return `${organizationId}/${projectId}/${random}.${FILE_TYPES[contentType]?.ext ?? "bin"}`;
}
