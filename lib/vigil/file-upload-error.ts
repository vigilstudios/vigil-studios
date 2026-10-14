/** Customer-facing reasons without leaking signed URLs or raw provider responses. */
export function fileUploadError(error: unknown): string {
  const details = error && typeof error === 'object' ? error as { message?: unknown; status?: unknown; statusCode?: unknown; originalResponse?: { getStatus?: () => number } | null } : {};
  const message = typeof details.message === 'string' ? details.message : '';
  const status = details.originalResponse?.getStatus?.() ?? Number(details.statusCode ?? details.status ?? 0);
  if (status === 413 || /maximum size exceeded|payload too large|exceeded.*maximum allowed size/i.test(message)) return 'The upload service rejected this file’s size. Ask Vigil to check the upload limit; your original file is unchanged.';
  if (status === 401 || /session.*expired|jwt.*expired/i.test(message)) return 'Your upload session expired. Sign in again, then retry.';
  if (status === 403) return 'You don’t have permission to upload here. Refresh the page or contact Vigil.';
  if (status === 415 || /mime.*not supported|invalid.*mime/i.test(message)) return 'The upload service rejected this file type. Choose a supported photo, video or PDF.';
  if (status === 429) return 'Too many uploads at once. Wait a moment, then retry.';
  if (/network|failed to fetch|connection|offline|timeout|timed out/i.test(message)) return 'The connection was interrupted. Check your connection, then retry.';
  return 'This file could not be uploaded. Try again; if it keeps failing, contact Vigil.';
}
