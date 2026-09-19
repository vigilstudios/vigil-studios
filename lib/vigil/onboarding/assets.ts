/**
 * Rules for onboarding uploads (logo, photos, documents). Mirrors the
 * project-assets bucket in migration 0008 so a bad file is refused before it
 * leaves the browser.
 */
export const PROJECT_ASSETS_BUCKET = "project-assets";
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;
export const MAX_PHOTOS = 30;
export const ALLOWED_ASSET_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf";

export type AssetKind = "logo" | "photo" | "document" | "other" | "video";
export type AssetProblem = { name: string; reason: string };

export function validateAssets(files: { name: string; type: string; size: number }[], kind: AssetKind, existingCount = 0): AssetProblem[] {
  const problems: AssetProblem[] = [];
  if (kind === "photo" && files.length + existingCount > MAX_PHOTOS) {
    problems.push({ name: "*", reason: `Up to ${MAX_PHOTOS} photos for now; you can send more later.` });
  }
  for (const f of files) {
    if (!ALLOWED_ASSET_TYPES[f.type] || f.type.startsWith("video/")) problems.push({ name: f.name, reason: "Images (PNG, JPEG, WebP, GIF, SVG) or PDF here; videos go in Files once your dashboard is set up." });
    else if (kind === "photo" && !f.type.startsWith("image/")) problems.push({ name: f.name, reason: "Photos must be images." });
    else if (f.size > MAX_ASSET_BYTES) problems.push({ name: f.name, reason: "Larger than 20 MB." });
    else if (f.size === 0) problems.push({ name: f.name, reason: "Empty file." });
  }
  return problems;
}

/** <org>/<project>/<random>.<ext>: the organization prefix is what storage RLS reads. */
export function assetPath(organizationId: string, projectId: string, contentType: string, random: string): string {
  const ext = ALLOWED_ASSET_TYPES[contentType] ?? "bin";
  return `${organizationId}/${projectId}/${random}.${ext}`;
}
