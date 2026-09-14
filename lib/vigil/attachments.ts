/**
 * Rules for change-request attachments. Mirrors the bucket's limits in
 * migration 0007 so a bad file is refused before it leaves the browser.
 */
export const ATTACHMENTS_BUCKET = "request-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_REQUEST = 5;
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};
export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",");

export type AttachmentProblem = { name: string; reason: string };

/** Validate a set of files; returns the problems (empty means all good). */
export function validateAttachments(files: { name: string; type: string; size: number }[]): AttachmentProblem[] {
  const problems: AttachmentProblem[] = [];
  if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
    problems.push({ name: "*", reason: `Attach up to ${MAX_ATTACHMENTS_PER_REQUEST} files per request.` });
  }
  for (const f of files) {
    if (!ALLOWED_ATTACHMENT_TYPES[f.type]) problems.push({ name: f.name, reason: "Images (PNG, JPEG, WebP, GIF) or PDF only." });
    else if (f.size > MAX_ATTACHMENT_BYTES) problems.push({ name: f.name, reason: "Larger than 10 MB." });
    else if (f.size === 0) problems.push({ name: f.name, reason: "Empty file." });
  }
  return problems;
}

/** Object path inside the bucket: <org>/<request>/<random>.<ext>. The organization prefix is what storage RLS reads. */
export function attachmentPath(organizationId: string, requestId: string, contentType: string, random: string): string {
  const ext = ALLOWED_ATTACHMENT_TYPES[contentType] ?? "bin";
  return `${organizationId}/${requestId}/${random}.${ext}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
