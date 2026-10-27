import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearNextCookie, resolveNext } from "@/lib/vigil/auth/next-cookie";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { resolveLoginDestination } from "@/lib/vigil/auth/login-destination";

/**
 * PKCE code exchange. Used by the default Supabase magic-link template and by
 * any OAuth provider enabled later.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = requestOrigin(request);
  const code = searchParams.get("code");
  const next = resolveNext(request);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("exchangeCodeForSession failed:", error?.message ?? "No authenticated user returned");
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  // Turn any pending invitations for this email into memberships.
  const { error: inviteError } = await supabase.rpc("accept_pending_invites");
  if (inviteError) console.error("accept_pending_invites failed:", inviteError.message);

  const destination = await resolveLoginDestination(supabase, data.user.id, next);
  const response = NextResponse.redirect(`${origin}${destination}`);
  clearNextCookie(response);
  return response;
}
