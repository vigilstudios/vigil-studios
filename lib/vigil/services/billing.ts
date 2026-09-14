import type { DbClient } from "@/lib/vigil/types";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider, BillingSubscriptionSnapshot } from "@/lib/vigil/providers/types";
import { findEntityByExternalId, providerEnum, upsertProviderLink } from "./provider-links";

/**
 * BillingService: Vigil Subscription -> BillingProvider.
 *
 * Webhooks and reconciliation both end up here with a normalized snapshot.
 * The provider's subscription id maps to a Vigil subscription through
 * provider_links; the Vigil row is what the dashboard and entitlements read.
 */
export async function applySubscriptionSnapshot(
  admin: DbClient,
  snapshot: BillingSubscriptionSnapshot,
  provider: BillingProvider = getBillingProvider()
): Promise<{ subscriptionId: string | null; created: boolean }> {
  const providerName = providerEnum(provider.name);

  const link = await findEntityByExternalId(admin, {
    provider: providerName,
    resourceKind: "subscription",
    externalId: snapshot.externalId,
  });

  const patch = {
    status: snapshot.status,
    current_period_start: snapshot.currentPeriodStart,
    current_period_end: snapshot.currentPeriodEnd,
    cancel_at_period_end: snapshot.cancelAtPeriodEnd,
    canceled_at: snapshot.canceledAt,
    trial_end: snapshot.trialEnd,
  };

  if (link?.entityType === "subscription") {
    const { error } = await admin.from("subscriptions").update(patch).eq("id", link.entityId);
    if (error) throw error;
    return { subscriptionId: link.entityId, created: false };
  }

  // Unknown subscription: find the organization through the customer link
  // and the plan through the price link. Without both we cannot attribute
  // it, and the caller records the webhook as failed for reconciliation.
  const customer = await findEntityByExternalId(admin, {
    provider: providerName,
    resourceKind: "customer",
    externalId: snapshot.customerExternalId,
  });
  const price = snapshot.priceExternalId
    ? await findEntityByExternalId(admin, { provider: providerName, resourceKind: "price", externalId: snapshot.priceExternalId })
    : null;
  if (customer?.entityType !== "organization" || price?.entityType !== "plan_price") {
    return { subscriptionId: null, created: false };
  }

  const { data: planPrice, error: priceError } = await admin
    .from("plan_prices")
    .select("id, plan_id")
    .eq("id", price.entityId)
    .single();
  if (priceError) throw priceError;

  const { data: created, error } = await admin
    .from("subscriptions")
    .insert({ organization_id: customer.entityId, plan_id: planPrice.plan_id, plan_price_id: planPrice.id, ...patch })
    .select("id")
    .single();
  if (error) throw error;

  await upsertProviderLink(admin, {
    provider: providerName,
    resourceKind: "subscription",
    externalId: snapshot.externalId,
    entityType: "subscription",
    entityId: created.id,
  });

  return { subscriptionId: created.id, created: true };
}
