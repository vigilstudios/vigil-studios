import "server-only";

import type { DbClient } from "@/lib/vigil/types";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider } from "@/lib/vigil/providers/types";
import { findExternalId, providerEnum, upsertProviderLink } from "./provider-links";

/**
 * Catalog sync: every priced plan and build price gets a provider price,
 * recorded in provider_links. Idempotent (lookup keys); safe to re-run after
 * a price change — a new provider price is created and the link updated.
 */
export type SyncReport = { synced: { label: string; externalId: string; created: boolean }[]; skipped: string[] };

export async function syncCatalogToProvider(db: DbClient, provider: BillingProvider = getBillingProvider()): Promise<SyncReport> {
  const providerName = providerEnum(provider.name);
  const report: SyncReport = { synced: [], skipped: [] };

  const [{ data: plans, error: planError }, { data: prices, error: priceError }, { data: builds, error: buildError }] = await Promise.all([
    db.from("plans").select("id, code, name, tagline"),
    db.from("plan_prices").select("id, plan_id, currency, interval, amount_cents, is_active"),
    db.from("build_prices").select("id, kind, name, description, currency, amount_cents, is_active"),
  ]);
  if (planError) throw planError;
  if (priceError) throw priceError;
  if (buildError) throw buildError;

  for (const price of prices ?? []) {
    const plan = plans?.find((p) => p.id === price.plan_id);
    if (!plan) continue;
    const label = `${plan.name} · ${price.currency}/${price.interval}`;
    if (!price.is_active || price.amount_cents === null) {
      report.skipped.push(`${label} (no approved amount)`);
      continue;
    }
    const result = await provider.ensurePrice({
      lookupKey: `plan:${plan.code}:${price.currency}:${price.interval}`,
      productName: plan.name,
      productDescription: plan.tagline,
      amountCents: price.amount_cents,
      currency: price.currency,
      interval: price.interval,
    });
    await upsertProviderLink(db, { provider: providerName, resourceKind: "price", externalId: result.externalId, entityType: "plan_price", entityId: price.id });
    report.synced.push({ label, externalId: result.externalId, created: result.created });
  }

  for (const build of builds ?? []) {
    const label = `${build.name} (one-time)`;
    if (!build.is_active || build.amount_cents === null) {
      report.skipped.push(`${label} (quoted separately)`);
      continue;
    }
    const result = await provider.ensurePrice({
      lookupKey: `build:${build.kind}:${build.currency}`,
      productName: build.name,
      productDescription: build.description,
      amountCents: build.amount_cents,
      currency: build.currency,
    });
    await upsertProviderLink(db, { provider: providerName, resourceKind: "price", externalId: result.externalId, entityType: "build_price", entityId: build.id });
    report.synced.push({ label, externalId: result.externalId, created: result.created });
  }

  return report;
}

/** Provider price id for a plan price, if it has been synced. */
export async function planPriceExternalId(db: DbClient, planPriceId: string, provider: BillingProvider = getBillingProvider()): Promise<string | null> {
  return findExternalId(db, { provider: providerEnum(provider.name), resourceKind: "price", entityType: "plan_price", entityId: planPriceId });
}

export async function buildPriceExternalId(db: DbClient, buildPriceId: string, provider: BillingProvider = getBillingProvider()): Promise<string | null> {
  return findExternalId(db, { provider: providerEnum(provider.name), resourceKind: "price", entityType: "build_price", entityId: buildPriceId });
}
