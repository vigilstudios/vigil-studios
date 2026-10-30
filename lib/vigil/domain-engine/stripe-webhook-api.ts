import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertDomainTestDatabase,
  domainTestPayments,
} from "@/lib/vigil/domain-engine/runtime";
import { assertDomainLiveRuntime } from "@/lib/vigil/domain-engine/live-policy";
import { StripeProductionDomainPayments } from "@/lib/vigil/domain-engine/stripe-production";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
import type { Json } from "@/types/database.types";

export async function handleDomainStripeWebhook(
  request: NextRequest,
  environment: "test" | "live",
) {
  if (environment === "test") {
    try {
      assertDomainTestDatabase();
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  let receiptId: string | undefined;
  let claimedAt: string | undefined;
  try {
    if (environment === "test") assertDomainTestDatabase();
    else assertDomainLiveRuntime();
    const raw = await boundedDomainBody(request, 1000000);
    if (Buffer.byteLength(raw) > 1_000_000)
      throw new DomainEngineError("webhook_too_large", "Invalid webhook.", 413);
    const verifier =
      environment === "test"
        ? domainTestPayments()
        : new StripeProductionDomainPayments(
            process.env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? "",
            undefined,
            process.env.VIGIL_DOMAIN_STRIPE_LIVE_WEBHOOK_SECRET,
          );
    const event = verifier.verifyWebhook(
      raw,
      request.headers.get("stripe-signature"),
    );
    if (
      ![
        "checkout.session.completed",
        "checkout.session.expired",
        "checkout.session.async_payment_succeeded",
        "payment_intent.amount_capturable_updated",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
        "charge.refunded",
      ].includes(event.type)
    )
      return NextResponse.json({ received: true, ignored: true });
    const object = event.data.object as unknown as {
      metadata?: Record<string, string>;
    };
    if (environment === "live" && object.metadata?.domain_engine !== "v2-live")
      return NextResponse.json({ received: true, ignored: true });
    const orderId = object.metadata?.domain_order_id;
    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId))
      return NextResponse.json({ received: true, ignored: true });
    const admin = createAdminClient();
    claimedAt = new Date().toISOString();
    // Separate consumer namespace: the existing website-billing inbox may see the same Stripe event.
    const eventKey = `domain:${event.id}`;
    const { data: inserted, error: insertError } = await admin
      .from("webhook_events")
      .insert({
        provider: "stripe",
        event_id: eventKey,
        event_type: event.type,
        payload: (environment === "test"
          ? event
          : {
              id: event.id,
              type: event.type,
              livemode: event.livemode,
              created: event.created,
              domain_order_id: orderId,
            }) as unknown as Json,
        received_at: claimedAt,
      })
      .select("id")
      .maybeSingle();
    if (insertError && insertError.code !== "23505") throw new Error();
    receiptId = inserted?.id;
    if (!receiptId) {
      const { data: prior, error } = await admin
        .from("webhook_events")
        .select("id,status,received_at")
        .eq("provider", "stripe")
        .eq("event_id", eventKey)
        .single();
      if (error || !prior) throw new Error();
      if (prior.status === "processed" || prior.status === "ignored")
        return NextResponse.json({ received: true, duplicate: true });
      if (
        prior.status === "received" &&
        Date.parse(prior.received_at) > Date.now() - 600_000
      )
        throw new Error();
      const { data: claim, error: claimError } = await admin
        .from("webhook_events")
        .update({
          status: "received",
          received_at: claimedAt,
          error: null,
          processed_at: null,
        })
        .eq("id", prior.id)
        .eq("status", prior.status)
        .eq("received_at", prior.received_at)
        .select("id")
        .maybeSingle();
      if (claimError || !claim) throw new Error();
      receiptId = claim.id;
    }
    const { data: order, error: orderError } = await admin
      .from("domain_orders")
      .select("organization_id,environment")
      .eq("id", orderId)
      .single();
    if (orderError || !order || order.environment !== environment)
      throw new Error();
    await enqueueJob(admin, {
      kind: JOB_KINDS.domainPurchase,
      idempotencyKey: `domain.purchase:${orderId}:stripe:${event.id}`,
      organizationId: order.organization_id,
      payload: { domain_order_id: orderId },
      maxAttempts: 200,
      requeueFailed: true,
    });
    const { data: finished, error: finishError } = await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", receiptId)
      .eq("received_at", claimedAt)
      .eq("status", "received")
      .select("id")
      .maybeSingle();
    if (finishError || !finished) throw new Error();
    return NextResponse.json({ received: true });
  } catch (error) {
    if (receiptId && claimedAt) {
      await createAdminClient()
        .from("webhook_events")
        .update({ status: "failed", error: { code: "domain_webhook_failed" } })
        .eq("id", receiptId)
        .eq("received_at", claimedAt)
        .eq("status", "received");
    }
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError
            ? error.message
            : "Domain webhook needs retry.",
      },
      { status: error instanceof DomainEngineError ? error.status : 500 },
    );
  }
}
