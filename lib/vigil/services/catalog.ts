import "server-only";

import { billingPeriod, planPriceLookupKey } from "@/lib/vigil/billing-periods";
import type { DbClient } from "@/lib/vigil/types";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider } from "@/lib/vigil/providers/types";
import type { Json } from "@/types/database.types";
import { providerEnum, upsertProviderLink } from "./provider-links";

/**
 * Catalog sync: every priced plan and build price gets a provider price,
 * recorded in provider_links. Idempotent (lookup keys); safe to re-run after
 * a price change — a new provider price is created and the link updated.
 */
export type SyncReport = { synced: { label: string; externalId: string; created: boolean }[]; skipped: string[] };

export async function syncCatalogToProvider(db: DbClient, provider: BillingProvider = getBillingProvider()): Promise<SyncReport> {
  const report: SyncReport = { synced: [], skipped: [] };

  const [{ data: plans, error: planError }, { data: prices, error: priceError }, { data: builds, error: buildError }] = await Promise.all([
    db.from("plans").select("id, code, name, tagline"),
    db.from("plan_prices").select("id, plan_id, currency, interval, interval_count, amount_cents, is_active"),
    db.from("build_prices").select("id, kind, name, description, currency, amount_cents, is_active"),
  ]);
  if (planError) throw planError;
  if (priceError) throw priceError;
  if (buildError) throw buildError;

  for (const price of prices ?? []) {
    const plan = plans?.find((p) => p.id === price.plan_id);
    if (!plan) continue;
    const label = `${plan.name} · ${price.currency}/${billingPeriod(price.interval, price.interval_count)?.key ?? price.interval}`;
    if (!price.is_active || price.amount_cents === null) {
      report.skipped.push(`${label} (no approved amount)`);
      continue;
    }
    const result = await provider.ensurePrice({
      lookupKey: planPriceLookupKey(plan.code, price.currency, price.interval, price.interval_count),
      productName: plan.name,
      productDescription: plan.tagline,
      amountCents: price.amount_cents,
      currency: price.currency,
      interval: price.interval,
      intervalCount: price.interval_count,
    });
    await recordPriceLink(db, provider, "plan_price", price.id, result.externalId);
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
    await recordPriceLink(db, provider, "build_price", build.id, result.externalId);
    report.synced.push({ label, externalId: result.externalId, created: result.created });
  }

  return report;
}

/**
 * Price links remember which mode (live/test) created them, and one link per
 * mode is kept, so a test key on a laptop and the live key in production
 * read the same database and each get their own provider ids. A price
 * synced in one mode is never handed to a checkout in the other.
 */
function modeMeta(provider: BillingProvider): Record<string, Json> {
  return provider.mode ? { mode: provider.mode } : {};
}

function linkMode(row: { metadata: unknown }): string | null {
  return (row.metadata as { mode?: string } | null)?.mode ?? null;
}

async function recordPriceLink(db: DbClient, provider: BillingProvider, entityType: "plan_price" | "build_price", entityId: string, externalId: string): Promise<void> {
  const providerName = providerEnum(provider.name);
  await upsertProviderLink(db, { provider: providerName, resourceKind: "price", externalId, entityType, entityId, metadata: modeMeta(provider) });
  // Drop this mode's previous id for the same row (a price change made a new
  // provider price), and links stamped with no mode at all (pre-mode syncs).
  const { data: others } = await db.from("provider_links").select("id, external_id, metadata").eq("provider", providerName).eq("resource_kind", "price").eq("entity_type", entityType).eq("entity_id", entityId);
  const stale = (others ?? []).filter((l) => l.external_id !== externalId && (linkMode(l) === null || linkMode(l) === (provider.mode ?? null)));
  for (const l of stale) await db.from("provider_links").delete().eq("id", l.id);
}

async function priceLinkFor(db: DbClient, provider: BillingProvider, entityType: "plan_price" | "build_price", entityId: string): Promise<string | null> {
  const { data, error } = await db
    .from("provider_links")
    .select("external_id, metadata, created_at")
    .eq("provider", providerEnum(provider.name))
    .eq("resource_kind", "price")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const match = (data ?? []).find((l) => (linkMode(l) ?? null) === (provider.mode ?? null));
  return match?.external_id ?? null;
}

/** Provider price id for a plan price, if it has been synced in this provider mode. */
export async function planPriceExternalId(db: DbClient, planPriceId: string, provider: BillingProvider = getBillingProvider()): Promise<string | null> {
  return priceLinkFor(db, provider, "plan_price", planPriceId);
}

export async function buildPriceExternalId(db: DbClient, buildPriceId: string, provider: BillingProvider = getBillingProvider()): Promise<string | null> {
  return priceLinkFor(db, provider, "build_price", buildPriceId);
}
