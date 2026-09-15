import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requirePublicSupabaseEnv } from "./env";

/**
 * Service-role client. Bypasses RLS. Only for server-side system work:
 * webhook handlers, the job runner, staff bootstrap. Never pass its results
 * to a customer without re-checking tenancy in code.
 */
export function createAdminClient() {
  const { url } = requirePublicSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set; the service-role client is unavailable.");
  }
  return createSupabaseClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Every read hits the database. Next.js memoizes identical GET fetches
    // within one server-component render, so a read → update → read of the
    // same row in a page (the checkout success fallback: completeCheckout
    // then provisionOrder) returned the stale row and provisioning failed
    // with "order is pending, not paid". A fresh AbortController signal per
    // call opts out of that memoization; no-store keeps the Data Cache out.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: new AbortController().signal }) },
  });
}

export function hasAdminClient(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export type AdminSupabaseClient = ReturnType<typeof createAdminClient>;
