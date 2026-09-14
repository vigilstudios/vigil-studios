import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/vigil/auth/origin";

/**
 * POST-only, same-origin sign-out: a crafted image tag or cross-site form
 * cannot log someone out.
 *
 * The check compares the Origin header's host with the Host the request
 * arrived on (honouring x-forwarded-host behind Vercel). `nextUrl.origin` is
 * not used: in development it reports the server's configured hostname
 * (localhost) even when the page was served on 127.0.0.1.
 */
function sameOrigin(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin form posts from older browsers omit it
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${requestOrigin(request)}/login`, { status: 303 });
}
