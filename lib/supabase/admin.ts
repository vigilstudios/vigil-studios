import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requirePublicSupabaseEnv } from "./env";

/**
 * Service-role client. Bypasses RLS. Only for server-side system work:
 * webhook handlers, the job runner, staff bootstrap. Never pass its results
 * to a customer without re-checking tenancy in code.
 */
/**
 * A Vercel preview deployment must never act on the production database
 * with the service role: previews are built from any branch, and copying the
 * production variables into the Preview environment would otherwise let one
 * provision customers, run jobs and answer webhooks against live data.
 * VIGIL_PREVIEW_SERVICE_ROLE=allow opts a preview in on purpose (for a
 * preview that points at its own Supabase project).
 */
function previewBlocksServiceRole(): boolean {
  return process.env.VERCEL_ENV === "preview" && process.env.VIGIL_PREVIEW_SERVICE_ROLE !== "allow";
}

export function createAdminClient() {
  const { url } = requirePublicSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set; the service-role client is unavailable.");
  }
  if (previewBlocksServiceRole()) {
    throw new Error("The service-role client is disabled on preview deployments (set VIGIL_PREVIEW_SERVICE_ROLE=allow for a preview with its own database).");
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
  return Boolean(process.env.SUPABASE_SECRET_KEY) && !previewBlocksServiceRole();
}

export type AdminSupabaseClient = ReturnType<typeof createAdminClient>;
