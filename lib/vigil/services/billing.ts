import type { DbClient } from "@/lib/vigil/types";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider, BillingSubscriptionSnapshot } from "@/lib/vigil/providers/types";
import { providerEnum } from "./provider-links";

/** Provisioning and billing webhooks share one locked provider subscription upsert. */
export async function applySubscriptionSnapshot(
  admin: DbClient,
  snapshot: BillingSubscriptionSnapshot,
  provider: BillingProvider = getBillingProvider(),
): Promise<{ subscriptionId: string | null; created: boolean }> {
  const { data, error } = await admin.rpc("apply_provider_subscription", {
    p_provider: providerEnum(provider.name),
    p_external_id: snapshot.externalId,
    p_customer_ref: snapshot.customerExternalId,
    p_price_ref: snapshot.priceExternalId ?? "",
    p_snapshot: {
      status: snapshot.status,
      current_period_start: snapshot.currentPeriodStart,
      current_period_end: snapshot.currentPeriodEnd,
      cancel_at_period_end: snapshot.cancelAtPeriodEnd,
      canceled_at: snapshot.canceledAt,
      trial_end: snapshot.trialEnd,
    },
  });
  if (error) throw error;
  return data as { subscriptionId: string | null; created: boolean };
}
