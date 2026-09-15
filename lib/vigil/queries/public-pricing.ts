import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { BILLING_PERIODS, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { FEATURES } from "@/lib/vigil/entitlements";
import type { Database } from "@/types/database.types";

/**
 * Prices for the marketing site, read from the same rows the checkout uses
 * so the two can never disagree. Anonymous client (the catalogue tables
 * allow anon reads), cached for five minutes, no cookies — so the marketing
 * pages stay static-ish.
 */
export type PublicPlan = {
  code: string;
  name: string;
  tagline: string | null;
  prices: Partial<Record<BillingPeriodKey, number>>;
  currency: string;
  includes: { code: string; label: string; on: boolean }[];
};

export type PublicBuild = { kind: "express" | "professional" | "custom"; name: string; description: string | null; amountCents: number | null; currency: string };

const includeLabels: [string, string][] = [
  [FEATURES.hostingManaged, "Managed hosting, SSL and security"],
  [FEATURES.domainManaged, "Domain status and management"],
  [FEATURES.requests, "Website updates and content changes"],
  [FEATURES.leads, "Lead Hub"],
  [FEATURES.insights, "Vigil Insights"],
  [FEATURES.virtue, "Virtue, your AI employee"],
];

async function load(): Promise<{ plans: PublicPlan[]; builds: PublicBuild[] }> {
  const env = getPublicSupabaseEnv();
  if (!env) return { plans: [], builds: [] };
  const db = createClient<Database>(env.url, env.publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const [plans, prices, planFeatures, builds] = await Promise.all([
    db.from("plans").select("id, code, name, tagline, tier_rank").eq("is_active", true).eq("is_public", true).order("tier_rank"),
    db.from("plan_prices").select("plan_id, amount_cents, currency, interval, interval_count").eq("is_active", true),
    db.from("plan_features").select("plan_id, feature_code, value"),
    db.from("build_prices").select("kind, name, description, amount_cents, currency").eq("is_active", true),
  ]);
  for (const r of [plans, prices, planFeatures, builds]) if (r.error) console.error("[public-pricing]", r.error.message);
  const out: PublicPlan[] = (plans.data ?? []).map((p) => {
    const rows = (prices.data ?? []).filter((x) => x.plan_id === p.id && x.currency === "usd");
    const priceMap: Partial<Record<BillingPeriodKey, number>> = {};
    for (const period of BILLING_PERIODS) {
      const row = rows.find((x) => x.interval === period.interval && x.interval_count === period.intervalCount);
      if (row && row.amount_cents !== null) priceMap[period.key] = row.amount_cents;
    }
    const features = (planFeatures.data ?? []).filter((f) => f.plan_id === p.id);
    return {
      code: p.code,
      name: p.name,
      tagline: p.tagline,
      prices: priceMap,
      currency: rows[0]?.currency ?? "usd",
      includes: includeLabels.map(([code, label]) => ({ code, label, on: features.some((f) => f.feature_code === code && f.value === true) })),
    };
  });
  const order: PublicBuild["kind"][] = ["express", "professional", "custom"];
  const buildList: PublicBuild[] = (builds.data ?? [])
    .map((b) => ({ kind: b.kind as PublicBuild["kind"], name: b.name, description: b.description, amountCents: b.amount_cents, currency: b.currency }))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return { plans: out, builds: buildList };
}

export const getPublicPricing = unstable_cache(load, ["public-pricing-v2"], { revalidate: 300, tags: ["pricing"] });
