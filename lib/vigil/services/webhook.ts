import "server-only";

import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingEvent, BillingProvider } from "@/lib/vigil/providers/types";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { applySubscriptionSnapshot } from "./billing";
import { completeCheckout } from "./orders";
import { findEntityByExternalId, providerEnum } from "./provider-links";

export type ReceiveOutcome = { duplicate: true } | { duplicate: false; outcome: string };

/**
 * A billing event, already verified and normalized by the provider. It
 * lands in webhook_events first (idempotent on the provider's event id), so
 * a redelivery is acknowledged without re-running anything; then it is
 * handled. A handler failure marks the inbox row failed and rethrows so the
 * route answers 500 and the provider retries.
 */
export async function receiveBillingEvent(admin: DbClient, event: BillingEvent, provider: BillingProvider = getBillingProvider()): Promise<ReceiveOutcome> {
  const providerName = providerEnum(provider.name);

  const { data: inserted, error: insertError } = await admin
    .from("webhook_events")
    .insert({ provider: providerName, event_id: event.externalEventId, event_type: event.rawType, payload: event.raw as Json })
    .select("id")
    .maybeSingle();
  if (insertError && insertError.code !== "23505") throw insertError;
  if (!inserted) return { duplicate: true };

  try {
    const outcome = await handleBillingEvent(admin, event, provider);
    await admin.from("webhook_events").update({ status: outcome === "ignored" ? "ignored" : "processed", processed_at: new Date().toISOString() }).eq("id", inserted.id);
    return { duplicate: false, outcome };
  } catch (err) {
    await admin.from("webhook_events").update({ status: "failed", error: { message: err instanceof Error ? err.message : String(err) } as unknown as Json }).eq("id", inserted.id);
    throw err;
  }
}

/** The handling itself, idempotent per event type. Returns a short outcome for the inbox row and the response. */
export async function handleBillingEvent(admin: DbClient, event: BillingEvent, provider: BillingProvider = getBillingProvider()): Promise<string> {
  const providerName = providerEnum(provider.name);
  switch (event.type) {
    case "checkout.completed": {
      const orderId = event.reference?.order_id ?? (await orderIdForSession(admin, providerName, event.checkout?.externalId));
      if (!orderId || !event.checkout) return "ignored";
      const order = await completeCheckout(admin, orderId, event.checkout, provider);
      if (order.status !== "paid") return `order ${order.status}`;
      // A failed earlier attempt (say, from the success page) must not block this one.
      await enqueueJob(admin, { kind: JOB_KINDS.orderProvision, idempotencyKey: `order.provision:${orderId}`, payload: { order_id: orderId }, maxAttempts: 8, requeueFailed: true });
      // Provision now in the common case; the job stays as the retry path.
      await runDueJobs(admin, { worker: "webhook", limit: 3 });
      return "provisioning";
    }
    case "subscription.created":
    case "subscription.updated":
    case "subscription.deleted": {
      if (!event.subscription) return "ignored";
      const result = await applySubscriptionSnapshot(admin, event.subscription, provider);
      return result.subscriptionId ? `subscription ${event.type}` : "subscription unattributed";
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      if (!event.subscriptionExternalId) return "ignored";
      const snapshot = await provider.getSubscription(event.subscriptionExternalId);
      if (!snapshot) return "ignored";
      const result = await applySubscriptionSnapshot(admin, snapshot, provider);
      return result.subscriptionId ? event.type : "subscription unattributed";
    }
    default:
      return "ignored";
  }
}

async function orderIdForSession(admin: DbClient, providerName: ReturnType<typeof providerEnum>, sessionId: string | undefined): Promise<string | null> {
  if (!sessionId) return null;
  const link = await findEntityByExternalId(admin, { provider: providerName, resourceKind: "checkout_session", externalId: sessionId });
  return link?.entityType === "order" ? link.entityId : null;
}
