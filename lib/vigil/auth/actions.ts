"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./errors";
import { NEXT_COOKIE, nextCookieOptions } from "./next-cookie";
import { MIN_PASSWORD_LENGTH } from "./password";
import { isPlausibleEmail, normalizeEmail, safeNextPath } from "./redirects";
import { RateLimitedError } from "./errors";
import { clientIp, enforceRateLimit, limitKey, RATE_LIMITS } from "@/lib/vigil/rate-limit";
import { ONBOARDING_WELCOME_HREF } from "@/lib/vigil/onboarding/constants";

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export type SignInState = ActionResult<{ email: string }> | null;

/**
 * Send a magic link. Deliberately does not reveal whether the address is
 * known; the message is the same either way.
 */
export async function signInWithEmail(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const requestedNext = safeNextPath(String(formData.get("next") ?? ""));
  // A replacement sign-in link should recreate the intended first-arrival
  // experience. The welcome entry only clears the temporary skip cookie;
  // completed customers continue straight to their normal dashboard.
  const next = requestedNext === "/dashboard" ? ONBOARDING_WELCOME_HREF : requestedNext;

  if (!isPlausibleEmail(email)) {
    return { ok: false, error: "Enter the email address you use with Vigil Studios.", code: "validation" };
  }
  try {
    await enforceRateLimit(limitKey("login:email", email), RATE_LIMITS.signInEmail);
    await enforceRateLimit(limitKey("login:ip", await clientIp()), RATE_LIMITS.signInIp);
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, error: "Too many sign-in emails requested. Check your inbox for one that already arrived, or try again in a few minutes.", code: "rate_limited" };
    throw error;
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  // The email template (supabase/templates/magic_link.html) appends
  // ?token_hash=…&type=magiclink to this URL; /auth/confirm verifies it on a
  // POST, so the link works in any browser and survives inbox prefetching.
  // The destination after sign-in travels in a cookie so the redirect URL
  // stays a clean allow-list match. /auth/callback remains for the PKCE code
  // flow (OAuth providers, or the default template) and reads the same cookie.
  const cookieStore = await cookies();
  cookieStore.set(NEXT_COOKIE, next, nextCookieOptions());

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      // An invited address is new to Auth until its first sign-in, so user
      // creation stays on. A stranger who signs in gets a profile with no
      // organization and sees only the welcome screen; nothing is exposed.
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("signInWithOtp failed:", error.message);
    return { ok: false, error: "We could not send a sign-in link right now. Please try again in a minute.", code: "auth" };
  }

  return { ok: true, data: { email } };
}

export type PasswordSignInState = ActionResult<undefined> | null;

/**
 * Password sign-in for people who set one. Wrong credentials and "no
 * password yet" look the same to a caller (Supabase does not distinguish),
 * so the message points to the link as the way in either way.
 */
export async function signInWithPassword(_prev: PasswordSignInState, formData: FormData): Promise<PasswordSignInState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  if (!isPlausibleEmail(email)) return { ok: false, error: "Enter the email address you use with Vigil Studios.", code: "validation" };
  if (!password) return { ok: false, error: "Enter your password, or email yourself a sign-in link.", code: "validation" };
  try {
    await enforceRateLimit(limitKey("password:email", email), RATE_LIMITS.passwordEmail);
    await enforceRateLimit(limitKey("password:ip", await clientIp()), RATE_LIMITS.passwordIp);
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, error: "Too many attempts. Wait a few minutes, or email yourself a sign-in link instead.", code: "rate_limited" };
    throw error;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: "That email and password do not match. If you have not set a password yet, email yourself a sign-in link and set one in Settings.", code: "auth" };
  }
  await supabase.rpc("accept_pending_invites").then(({ error: e }) => e && console.error("accept_pending_invites failed:", e.message));
  redirect(next);
}

export type PasswordState = ActionResult<undefined> | null;

/** Set or change the signed-in user's password. Marks the account so prompts stop. */
export async function setPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Use at least ${MIN_PASSWORD_LENGTH} characters.`, code: "validation", issues: { password: ["Too short"] } };
  if (password !== confirm) return { ok: false, error: "The two passwords do not match.", code: "validation", issues: { confirm: ["Does not match"] } };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
  if (error) {
    console.error("updateUser(password) failed:", error.message);
    return { ok: false, error: error.message.includes("different") ? "Choose a password you have not used here before." : "We could not save that password. Please try again.", code: "auth" };
  }
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
