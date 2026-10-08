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

// Longer than the Stripe route's 300-second invocation limit. A killed handler
// leaves a received row, which a later delivery must be able to reclaim.
const WEBHOOK_LEASE_MS = 10 * 60_000;

/**
 * A billing event, already verified and normalized by the provider. It
 * lands in webhook_events first (idempotent on the provider's event id), so
 * completed redeliveries are acknowledged without re-running anything.
 * Failed or abandoned deliveries are reclaimed atomically. A handler failure marks the inbox row failed and rethrows so the
 * route answers 500 and the provider retries.
 */
export async function receiveBillingEvent(admin: DbClient, event: BillingEvent, provider: BillingProvider = getBillingProvider()): Promise<ReceiveOutcome> {
  const providerName = providerEnum(provider.name);
  const receivedAt = new Date().toISOString();

  const { data: inserted, error: insertError } = await admin
    .from("webhook_events")
    .insert({ provider: providerName, event_id: event.externalEventId, event_type: event.rawType, payload: event.raw as Json, received_at: receivedAt })
    .select("id")
    .maybeSingle();
  if (insertError && insertError.code !== "23505") throw insertError;
  let eventId = inserted?.id;
  if (!eventId) {
    // Claim failed records atomically; concurrent deliveries cannot both handle it.
    const { data: retried, error: retryError } = await admin.from("webhook_events")
      .update({ status: "received", error: null, received_at: receivedAt, processed_at: null }).eq("provider", providerName)
      .eq("event_id", event.externalEventId).eq("status", "failed").select("id").maybeSingle();
    if (retryError) throw retryError;
    eventId = retried?.id;
    if (!eventId) {
      const { data: existing, error } = await admin.from("webhook_events")
        .select("id, status, received_at").eq("provider", providerName).eq("event_id", event.externalEventId).maybeSingle();
      if (error) throw error;
      if (existing?.status === "processed" || existing?.status === "ignored") return { duplicate: true };
      if (existing?.status === "received") {
        const { data: reclaimed, error: reclaimError } = await admin.from("webhook_events")
          .update({ received_at: receivedAt, error: null, processed_at: null })
          .eq("id", existing.id).eq("status", "received").eq("received_at", existing.received_at)
          .lt("received_at", new Date(Date.now() - WEBHOOK_LEASE_MS).toISOString()).select("id").maybeSingle();
        if (reclaimError) throw reclaimError;
        eventId = reclaimed?.id;
      }
      // Acknowledge only completed work. Returning 200 for an in-flight duplicate
      // can stop Stripe retries even if the original handler crashes afterwards.
      if (!eventId) throw new Error("Webhook handling is in progress; retry this delivery.");
    }
  }

  try {
    const outcome = await handleBillingEvent(admin, event, provider);
    const { data, error } = await admin.from("webhook_events")
      .update({ status: outcome === "ignored" ? "ignored" : "processed", processed_at: new Date().toISOString() })
      .eq("id", eventId).eq("status", "received").eq("received_at", receivedAt).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Webhook lease was reclaimed by another delivery.");
    return { duplicate: false, outcome };
  } catch (err) {
    await admin.from("webhook_events").update({ status: "failed", error: { message: err instanceof Error ? err.message : String(err) } as unknown as Json })
      .eq("id", eventId).eq("status", "received").eq("received_at", receivedAt);
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
      // Leave downstream repository/model work to the background runner.
      await runDueJobs(admin, { worker: "webhook", limit: 1 });
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
