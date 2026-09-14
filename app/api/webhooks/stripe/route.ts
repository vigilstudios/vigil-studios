import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { ProviderError } from "@/lib/vigil/auth/errors";
import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingEvent } from "@/lib/vigil/providers/types";
import { applySubscriptionSnapshot } from "@/lib/vigil/services/billing";
import { completeCheckout } from "@/lib/vigil/services/orders";
import { findEntityByExternalId, providerEnum } from "@/lib/vigil/services/provider-links";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";

export const dynamic = "force-dynamic";

/**
 * Billing webhook. The provider verifies the signature and normalizes the
 * event; every event lands in webhook_events first (idempotent on the
 * provider's event id), then is handled. Handlers are idempotent too, so a
 * redelivery is harmless. A failure returns 500 so the provider retries.
 */
export async function POST(request: NextRequest) {
  if (!hasAdminClient()) return NextResponse.json({ error: "service role not configured" }, { status: 503 });
  const provider = getBillingProvider();
  const rawBody = await request.text();

  let event: BillingEvent;
  try {
    event = await provider.parseWebhook(rawBody, request.headers.get("stripe-signature"));
  } catch (err) {
    const status = err instanceof ProviderError ? err.status : 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "bad webhook" }, { status });
  }

  const admin = createAdminClient();
  const providerName = providerEnum(provider.name);

  // Inbox: first delivery wins; a repeat is acknowledged without re-running.
  const { data: inserted, error: insertError } = await admin
    .from("webhook_events")
    .insert({ provider: providerName, event_id: event.externalEventId, event_type: event.rawType, payload: event.raw as Json })
    .select("id")
    .maybeSingle();
  if (insertError && insertError.code !== "23505") {
    console.error("webhook inbox insert failed:", insertError.message);
    return NextResponse.json({ error: "inbox" }, { status: 500 });
  }
  if (!inserted) return NextResponse.json({ received: true, duplicate: true });

  try {
    const outcome = await handle(admin, event, providerName);
    await admin.from("webhook_events").update({ status: outcome === "ignored" ? "ignored" : "processed", processed_at: new Date().toISOString() }).eq("id", inserted.id);
    return NextResponse.json({ received: true, outcome });
  } catch (err) {
    console.error("webhook handling failed:", err);
    await admin.from("webhook_events").update({ status: "failed", error: { message: err instanceof Error ? err.message : String(err) } }).eq("id", inserted.id);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}

async function handle(admin: DbClient, event: BillingEvent, providerName: ReturnType<typeof providerEnum>): Promise<string> {
  switch (event.type) {
    case "checkout.completed": {
      const orderId = event.reference?.order_id ?? (await orderIdForSession(admin, providerName, event.checkout?.externalId));
      if (!orderId || !event.checkout) return "ignored";
      const order = await completeCheckout(admin, orderId, event.checkout);
      if (order.status !== "paid") return `order ${order.status}`;
      await enqueueJob(admin, { kind: JOB_KINDS.orderProvision, idempotencyKey: `order.provision:${orderId}`, payload: { order_id: orderId }, maxAttempts: 8 });
      // Provision now in the common case; the job stays as the retry path.
      await runDueJobs(admin, { worker: "webhook", limit: 3 });
      return "provisioning";
    }
    case "subscription.created":
    case "subscription.updated":
    case "subscription.deleted": {
      if (!event.subscription) return "ignored";
      const result = await applySubscriptionSnapshot(admin, event.subscription);
      return result.subscriptionId ? `subscription ${event.type}` : "subscription unattributed";
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      if (!event.subscriptionExternalId) return "ignored";
      const snapshot = await getBillingProvider().getSubscription(event.subscriptionExternalId);
      if (!snapshot) return "ignored";
      await applySubscriptionSnapshot(admin, snapshot);
      return event.type;
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
