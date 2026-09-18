import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { RateLimitedError } from "@/lib/vigil/auth/errors";

/**
 * Fixed-window rate limits kept in the database (vigil.rate_limits), so they
 * hold across serverless instances without another service. The function is
 * callable by the service role only; the key decides what is being counted.
 *
 * Limits are deliberately generous for real people and tight for scripts:
 * every one of these actions sends an email, creates a row at a provider,
 * or resolves DNS on the customer's behalf.
 */
export type RateLimitRule = { limit: number; windowSeconds: number };

const MINUTE = 60;
const HOUR = 60 * MINUTE;

export const RATE_LIMITS = {
  /** Magic-link requests for one address, then for one network. */
  signInEmail: { limit: 5, windowSeconds: 15 * MINUTE },
  signInIp: { limit: 30, windowSeconds: 15 * MINUTE },
  /** Password attempts: the address is what a guesser targets. */
  passwordEmail: { limit: 10, windowSeconds: 15 * MINUTE },
  passwordIp: { limit: 50, windowSeconds: 15 * MINUTE },
  /** Anonymous checkout starts (an order row plus a provider session each). */
  checkoutIp: { limit: 10, windowSeconds: HOUR },
  /** "Send my sign-in email again" from the success page. */
  resendWelcomeIp: { limit: 5, windowSeconds: HOUR },
  /** Invitations per organization. */
  inviteOrg: { limit: 20, windowSeconds: HOUR },
  /** Registrar lookups (a DNS query each). */
  dnsLookupUser: { limit: 30, windowSeconds: 10 * MINUTE },
  /** Domain connections started per organization. */
  domainStartOrg: { limit: 10, windowSeconds: HOUR },
  /** Onboarding autosave per person; the client debounces, this is the ceiling. */
  autosaveUser: { limit: 300, windowSeconds: 10 * MINUTE },
  /** Change requests per organization. */
  requestOrg: { limit: 30, windowSeconds: HOUR },
} as const satisfies Record<string, RateLimitRule>;

/** The caller's network address as the platform reports it. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

/** Keys never carry an address or email in clear. */
export function limitKey(scope: string, subject: string): string {
  return `${scope}:${createHash("sha256").update(subject.trim().toLowerCase()).digest("hex").slice(0, 32)}`;
}

let warnedOnce = false;

/**
 * Count one hit and throw RateLimitedError past the limit. Without a service
 * key (local development) the limiter is off; a database error is logged and
 * lets the request through rather than failing every sign-in on an outage.
 */
export async function enforceRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  if (!hasAdminClient()) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("[rate-limit] SUPABASE_SECRET_KEY is not set; rate limits are off.");
    }
    return;
  }
  const { data, error } = await createAdminClient().rpc("rate_limit", { p_key: key, p_limit: rule.limit, p_window_seconds: rule.windowSeconds });
  if (error) {
    console.error("[rate-limit] rate_limit failed:", error.message);
    return;
  }
  if (data === false) throw new RateLimitedError();
}
