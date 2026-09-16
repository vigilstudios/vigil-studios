import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { button, escapeHtml, layout, sendEmail } from "@/lib/vigil/email";

/** Generate a one-click sign-in link and email an organization invitation. */
export async function sendOrganizationInvitation(args: {
  email: string;
  organizationName: string;
  role: "owner" | "manager" | "member";
  appUrl?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const appUrl = (args.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co").replace(/\/$/, "");
  const redirectTo = `${appUrl}/auth/confirm`;
  const auth = createAdminClient().auth.admin;
  let generated = await auth.generateLink({ type: "magiclink", email: args.email, options: { redirectTo } });
  if (generated.error) generated = await auth.generateLink({ type: "invite", email: args.email, options: { redirectTo } });
  const token = generated.data?.properties?.hashed_token;
  const type = generated.data?.properties?.verification_type === "invite" ? "invite" : "magiclink";
  const signInUrl = token
    ? `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=${type}&next=${encodeURIComponent("/dashboard")}`
    : `${appUrl}/login?email=${encodeURIComponent(args.email)}&next=${encodeURIComponent("/dashboard")}`;
  const role = args.role === "owner" ? "an owner" : args.role === "manager" ? "a manager" : "a member";
  return sendEmail({
    to: args.email,
    subject: `You're invited to ${args.organizationName} on Vigil`,
    text: `You've been invited to join ${args.organizationName} as ${role}.\n\nOpen the dashboard: ${signInUrl}\n\nThe link signs you in directly.`,
    html: layout(
      `Join ${escapeHtml(args.organizationName)} on Vigil`,
      `<p>You have been invited to join <b>${escapeHtml(args.organizationName)}</b> as ${escapeHtml(role)}.</p>${button(signInUrl, "Open the dashboard")}<p style="color:#666;font-size:13px">The button signs you in directly. You can set a password from the dashboard afterward.</p>`
    ),
  });
}
