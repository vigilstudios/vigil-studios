import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/vigil/auth/redirects";
import { isSameOriginRequest, requestOrigin } from "@/lib/vigil/auth/origin";

/**
 * POST-only, same-origin sign-out: a crafted image tag or cross-site form
 * cannot log someone out.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  const login = new URL("/login", requestOrigin(request));
  const next = request.nextUrl.searchParams.get("next");
  if (next) login.searchParams.set("next", safeNextPath(next));
  return NextResponse.redirect(login, { status: 303 });
}
