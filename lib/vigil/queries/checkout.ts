import "server-only";

import { cache } from "react";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BILLING_PERIODS, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { FEATURES } from "@/lib/vigil/entitlements";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import { buildPriceExternalId, planPriceExternalId } from "@/lib/vigil/services/catalog";

/**
 * What the public checkout page needs. Runs as anon under the catalog
 * read policies; nothing tenant-specific is touched.
 */
export type CheckoutPlan = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string | null;
  tierRank: number;
  /** Approved and synced prices, one per billing period. */
  prices: CheckoutPrice[];
  /** The monthly amount, for "save X%" maths; null when not approved. */
  monthlyCents: number | null;
  currency: string;
  /** At least one period can be bought online. */
  purchasable: boolean;
  includes: string[];
};

export type CheckoutPrice = { id: string; period: BillingPeriodKey; amountCents: number; purchasable: boolean };

const includeLabels: [string, string][] = [
  [FEATURES.hostingManaged, "Managed hosting, SSL and security"],
  [FEATURES.domainManaged, "Domain status and management"],
  [FEATURES.requests, "Website updates and content changes"],
  [FEATURES.leads, "Lead Hub"],
  [FEATURES.insights, "Vigil Insights"],
  [FEATURES.virtue, "Virtue, your AI employee"],
];

export const getCheckoutCatalog = cache(async () => {
  const supabase = await createClient();
  const [plans, prices, planFeatures, builds] = await Promise.all([
    supabase.from("plans").select("id, code, name, tagline, description, tier_rank").eq("is_active", true).order("tier_rank"),
    supabase.from("plan_prices").select("id, plan_id, amount_cents, currency, interval, interval_count").eq("is_active", true),
    supabase.from("plan_features").select("plan_id, feature_code, value"),
    supabase.from("build_prices").select("id, kind, name, description, amount_cents, currency").eq("is_active", true),
  ]);
  for (const r of [plans, prices, planFeatures, builds]) if (r.error) throw r.error;

  // A plan is purchasable online only when its price is approved and synced to the provider.
  const provider = getBillingProvider();
  const syncChecks = hasAdminClient()
    ? await Promise.all((prices.data ?? []).map(async (p) => [p.id, Boolean(await planPriceExternalId(createAdminClient(), p.id, provider).catch(() => null))] as const))
    : [];
  const synced = new Map(syncChecks);

  const catalogPlans: CheckoutPlan[] = (plans.data ?? []).map((p) => {
    const rows = (prices.data ?? []).filter((x) => x.plan_id === p.id && x.currency === "usd");
    const planPrices: CheckoutPrice[] = [];
    for (const period of BILLING_PERIODS) {
      const row = rows.find((x) => x.interval === period.interval && x.interval_count === period.intervalCount);
      if (!row || row.amount_cents === null) continue;
      planPrices.push({ id: row.id, period: period.key, amountCents: row.amount_cents, purchasable: Boolean(synced.get(row.id)) });
    }
    const features = (planFeatures.data ?? []).filter((f) => f.plan_id === p.id);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      tierRank: p.tier_rank,
      prices: planPrices,
      monthlyCents: planPrices.find((x) => x.period === "month")?.amountCents ?? null,
      currency: rows[0]?.currency ?? "usd",
      purchasable: planPrices.some((x) => x.purchasable),
      includes: includeLabels.filter(([code]) => features.some((f) => f.feature_code === code && f.value === true)).map(([, label]) => label),
    };
  });

  const buildList = await Promise.all(
    (builds.data ?? []).map(async (b) => ({
      ...b,
      synced: b.amount_cents !== null && hasAdminClient() ? Boolean(await buildPriceExternalId(createAdminClient(), b.id, provider).catch(() => null)) : false,
    }))
  );

  return { plans: catalogPlans, builds: buildList };
});
