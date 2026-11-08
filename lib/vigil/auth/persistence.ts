/** Storage preference only; authorization always comes from verified Auth and tenant RLS. */
export const SESSION_MODE_COOKIE = "vigil-session-mode";
export function sessionModeOptions(remember: boolean) {
  // The browser Auth client also reads this non-secret preference when refreshing its cookies.
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 365 * 86400 } : {}),
  };
}
export function sessionCookieOptions<
  T extends { maxAge?: number; expires?: Date },
>(options: T, mode?: string): T {
  if (mode !== "browser" || options.maxAge === 0) return options;
  const session = { ...options };
  delete session.maxAge;
  delete session.expires;
  return session;
}
