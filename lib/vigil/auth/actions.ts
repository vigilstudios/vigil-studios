"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./errors";
import { NEXT_COOKIE, nextCookieOptions } from "./next-cookie";
import { isPlausibleEmail, normalizeEmail, safeNextPath } from "./redirects";

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
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!isPlausibleEmail(email)) {
    return { ok: false, error: "Enter the email address you use with Vigil Studios.", code: "validation" };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  // The destination after sign-in travels in a cookie so the redirect URL
  // stays a clean allow-list match. With Supabase's default email template
  // the link completes through the PKCE code flow at /auth/callback; with the
  // custom template (supabase/templates/magic_link.html, paid tier or custom
  // SMTP) it would land on /auth/confirm instead — both read the cookie.
  const cookieStore = await cookies();
  cookieStore.set(NEXT_COOKIE, next, nextCookieOptions());

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
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

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
