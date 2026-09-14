import "server-only";

import type { NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "./redirects";

/**
 * Where to send someone after they finish signing in. Carried in a short-lived
 * cookie rather than on the magic link, because Supabase validates the
 * redirect URL exactly against its allow-list and a query string is enough to
 * fall back to the site URL.
 */
export const NEXT_COOKIE = "vigil-next";
const MAX_AGE_SECONDS = 15 * 60;

export function nextCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

/** Resolve the post-login path from the cookie, then the query, then the default. */
export function resolveNext(request: NextRequest, fallback = "/dashboard"): string {
  const fromCookie = request.cookies.get(NEXT_COOKIE)?.value;
  const fromQuery = request.nextUrl.searchParams.get("next");
  return safeNextPath(fromCookie || fromQuery, fallback);
}

export function clearNextCookie(response: NextResponse): void {
  response.cookies.set(NEXT_COOKIE, "", { ...nextCookieOptions(), maxAge: 0 });
}
