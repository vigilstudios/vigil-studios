import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clearNextCookie, resolveNext } from "@/lib/vigil/auth/next-cookie";
import { requestOrigin } from "@/lib/vigil/auth/origin";

const allowedTypes: EmailOtpType[] = ["magiclink", "email", "signup", "invite", "recovery", "email_change"];

/**
 * Magic-link landing. The email (supabase/templates/magic_link.html) links to
 *   /auth/confirm?token_hash=…&type=magiclink
 *
 * GET renders a tiny page whose form submits itself; POST does the one-time
 * verification. Inbox link scanners fetch the GET and consume nothing, so the
 * person who actually clicks still gets a valid token. Unlike the PKCE code
 * flow this also works in a different browser from the one that asked.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = requestOrigin(request);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type || !allowedTypes.includes(type as EmailOtpType)) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Signing you in | Vigil</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#f5f5f3;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
  main{max-width:24rem;padding:2rem;text-align:center}
  button{margin-top:1rem;padding:.75rem 1.5rem;border:0;border-radius:.5rem;background:#10d45a;color:#0a0a0a;font-weight:600;cursor:pointer}
</style>
</head>
<body>
<main>
  <h1 style="font-size:1.25rem">Signing you in…</h1>
  <p style="color:#a1a1aa">One moment. If nothing happens, use the button.</p>
  <form method="post" action="/auth/confirm" id="confirm">
    <input type="hidden" name="token_hash" value="${escapeAttr(tokenHash)}">
    <input type="hidden" name="type" value="${escapeAttr(type)}">
    <button type="submit">Continue</button>
  </form>
</main>
<script>document.getElementById("confirm").submit();</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "") as EmailOtpType;
  const next = resolveNext(request);

  if (!tokenHash || !allowedTypes.includes(type)) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`, { status: 303 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    console.error("verifyOtp failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=link_expired`, { status: 303 });
  }

  const { error: inviteError } = await supabase.rpc("accept_pending_invites");
  if (inviteError) console.error("accept_pending_invites failed:", inviteError.message);

  const response = NextResponse.redirect(`${origin}${next}`, { status: 303 });
  clearNextCookie(response);
  return response;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
