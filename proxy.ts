import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

/**
 * Optimistic gate for the product routes. Redirects a visitor with no session
 * to /login and keeps the Supabase session cookie fresh. Every page and
 * action still verifies the session and tenancy itself (lib/vigil/auth).
 */
const protectedPrefixes = ["/dashboard", "/admin"];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let session: Awaited<ReturnType<typeof refreshSession>>;
  try {
    session = await refreshSession(request);
  } catch (error) {
    console.error("Supabase session refresh failed:", error);
    session = { response: NextResponse.next({ request }), userId: null };
  }

  if (isProtected(pathname) && !session.userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login" && session.userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return session.response;
}

export const config = {
  matcher: [
    // Skip static assets and metadata files; everything else refreshes the session.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|express-templates/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
