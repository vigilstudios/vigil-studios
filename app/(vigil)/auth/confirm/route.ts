import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/vigil/auth/redirects";

const allowedTypes: EmailOtpType[] = ["magiclink", "email", "signup", "invite", "recovery", "email_change"];

/**
 * token_hash verification. Works when the Supabase email template links to
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=...
 * which, unlike the PKCE code flow, does not require the link to be opened in
 * the browser that requested it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (!tokenHash || !type || !allowedTypes.includes(type)) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    console.error("verifyOtp failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  const { error: inviteError } = await supabase.rpc("accept_pending_invites");
  if (inviteError) console.error("accept_pending_invites failed:", inviteError.message);

  return NextResponse.redirect(`${origin}${next}`);
}
