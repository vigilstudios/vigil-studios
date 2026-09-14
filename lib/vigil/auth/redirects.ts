/**
 * Only same-origin, path-style targets are honoured for post-login redirects.
 * Anything else (absolute URLs, protocol-relative, backslashes) falls back to
 * the dashboard so a crafted link cannot bounce a user off-site.
 */
export function safeNextPath(candidate: string | null | undefined, fallback = "/dashboard"): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(candidate)) return fallback;
  // Never send someone back into the auth routes.
  if (candidate.startsWith("/auth") || candidate.startsWith("/login")) return fallback;
  return candidate;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
