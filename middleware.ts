import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const devOnlyPrefixes = ["/admin", "/client-portal", "/supabase-test"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalDev = process.env.NODE_ENV === "development";
  const allowDevRoutes = process.env.NEXT_PUBLIC_ENABLE_DEV_ROUTES === "true";

  if (
    !isLocalDev &&
    !allowDevRoutes &&
    devOnlyPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (!hasSupabaseEnv) {
    return NextResponse.next({ request });
  }

  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Supabase middleware failed:", error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};