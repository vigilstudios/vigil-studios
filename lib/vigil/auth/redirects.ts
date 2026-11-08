import type { StaffRole } from "@/lib/vigil/types";

/**
 * Only same-origin, path-style targets are honoured for post-login redirects.
 * Anything else (absolute URLs, protocol-relative, backslashes) falls back to
 * the dashboard so a crafted link cannot bounce a user off-site.
 */
export function safeNextPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate || typeof candidate !== "string" || candidate.length > 2048)
    return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.startsWith("/\\"))
    return fallback;
  if (/[\x00-\x1f\x7f]/.test(candidate)) return fallback;
  // Never send someone back into the auth routes.
  if (
    candidate.startsWith("/auth") ||
    candidate.startsWith("/login") ||
    candidate.startsWith("/signup")
  )
    return fallback;
  if (candidate.includes("\\")) return fallback;
  return candidate;
}

/** Login opens the staff console, even when an old link points at client view. */
export function loginDestination(
  candidate: string | null | undefined,
  staffRole: StaffRole | null,
): string {
  const next = safeNextPath(candidate, staffRole ? "/admin" : "/dashboard");
  const pathname = next.split(/[?#]/)[0];
  if (
    staffRole &&
    (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
  )
    return "/admin";
  return next;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
