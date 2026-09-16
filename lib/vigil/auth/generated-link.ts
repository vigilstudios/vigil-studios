import type { EmailOtpType } from "@supabase/supabase-js";

type GeneratedLinkProperties = {
  hashed_token: string;
  verification_type: string;
};

/**
 * Supabase may return `signup` from generateLink({ type: "magiclink" }) when
 * the address is new. Verification must use the returned type exactly; using
 * `magiclink` for that token makes a fresh link look expired.
 */
export function generatedEmailOtpType(type: string): EmailOtpType | null {
  switch (type) {
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
      return type;
    case "email_change_current":
    case "email_change_new":
      return "email_change";
    default:
      return null;
  }
}

export function generatedConfirmationUrl(
  appUrl: string,
  properties: GeneratedLinkProperties,
  next = "/dashboard",
): string | null {
  const type = generatedEmailOtpType(properties.verification_type);
  if (!properties.hashed_token || !type) return null;

  const url = new URL("/auth/confirm", appUrl);
  url.searchParams.set("token_hash", properties.hashed_token);
  url.searchParams.set("type", type);
  url.searchParams.set("next", next);
  return url.toString();
}
