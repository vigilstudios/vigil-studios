import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBillingProvider } from "../providers/registry";
import type { BillingEvent, BillingSubscriptionSnapshot } from "../providers/types";
import { startCheckout } from "../services/orders";
import { receiveBillingEvent } from "../services/webhook";
import { FakeAdmin } from "./fake-admin";

vi.spyOn(console, "info").mockImplementation(() => undefined);
vi.spyOn(console, "error").mockImplementation(() => undefined);

const PLAN = "plan_care";
const PRICE = "price_care_month";
const BUILD = "build_express";

function seed() {
  return new FakeAdmin({
    plans: [{ id: PLAN, code: "care", name: "Vigil Care", is_active: true }],
    plan_prices: [{ id: PRICE, plan_id: PLAN, amount_cents: 9900, currency: "usd", interval: "month", interval_count: 1, is_active: true }],
    build_prices: [{ id: BUILD, kind: "express", name: "Vigil Express", amount_cents: 59900, currency: "usd", is_active: true }],
    provider_links: [
      { provider: "other", resource_kind: "price", external_id: "price_ext_care", entity_type: "plan_price", entity_id: PRICE },
      { provider: "other", resource_kind: "price", external_id: "price_ext_build", entity_type: "build_price", entity_id: BUILD },
    ],
  });
}

let events = 0;
function checkoutCompleted(orderId: string | null, sessionId: string, snapshot: Awaited<ReturnType<ReturnType<typeof getBillingProvider>["getCheckoutSession"]>>, eventId = `evt_${++events}`): BillingEvent {
  return { externalEventId: eventId, type: "checkout.completed", rawType: "checkout.session.completed", checkout: snapshot!, reference: orderId ? { order_id: orderId } : undefined, raw: { id: eventId, session: sessionId } };
}

describe("receiveBillingEvent", () => {
  let fake: FakeAdmin;
  let orderId: string;
  let sessionId: string;
  beforeEach(async () => {
    fake = seed();
    ({ orderId } = await startCheckout(fake.asClient(), { email: "owner@marlowandfen.test", businessName: "Marlow & Fen", projectKind: "express", templateSlug: "restaurant", planCode: "care", appUrl: "https://app.test" }, getBillingProvider()));
    sessionId = (fake.rows("orders")[0].metadata as { checkout_session: string }).checkout_session;
  });

  it("records the event, marks the order paid and provisions it in one delivery", async () => {
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    const res = await receiveBillingEvent(fake.asClient(), checkoutCompleted(orderId, sessionId, snapshot));
    expect(res).toEqual({ duplicate: false, outcome: "provisioning" });
    expect(fake.rows("orders")[0]).toMatchObject({ status: "provisioned" });
    expect(fake.rows("organizations")).toHaveLength(1);
    expect(fake.rows("webhook_events")[0]).toMatchObject({ event_type: "checkout.session.completed", status: "processed" });
    expect(fake.rows("webhook_events")[0].processed_at).toBeTruthy();
  });

  it("acknowledges a redelivered event without running anything again", async () => {
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    const event = checkoutCompleted(orderId, sessionId, snapshot, "evt_once");
    await receiveBillingEvent(fake.asClient(), event);
    const again = await receiveBillingEvent(fake.asClient(), event);
    expect(again).toEqual({ duplicate: true });
    expect(fake.rows("webhook_events")).toHaveLength(1);
    expect(fake.rows("organizations")).toHaveLength(1);
    expect(fake.rows("provisioning_jobs")).toHaveLength(2);
    expect(fake.rows("provisioning_jobs").map((job) => job.kind)).toEqual(["order.provision", "website.repository"]);
  });

  it("finds the order through the session link when the reference is missing, and ignores unknown sessions", async () => {
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    const res = await receiveBillingEvent(fake.asClient(), checkoutCompleted(null, sessionId, snapshot));
    expect(res).toEqual({ duplicate: false, outcome: "provisioning" });

    const stranger = await receiveBillingEvent(fake.asClient(), checkoutCompleted(null, "cs_unknown", { ...snapshot!, externalId: "cs_unknown" }));
    expect(stranger).toEqual({ duplicate: false, outcome: "ignored" });
    expect(fake.rows("webhook_events").at(-1)).toMatchObject({ status: "ignored" });
  });

  it("recovers a provision job that failed earlier: the webhook re-queues it", async () => {
    fake.rows("orders")[0].status = "paid";
    fake.rows("provisioning_jobs").push({ id: "j_failed", kind: "order.provision", idempotency_key: `order.provision:${orderId}`, status: "failed", attempts: 3, max_attempts: 8, scheduled_for: new Date(0).toISOString(), payload: { order_id: orderId } });
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    const res = await receiveBillingEvent(fake.asClient(), checkoutCompleted(orderId, sessionId, snapshot));
    expect(res).toEqual({ duplicate: false, outcome: "provisioning" });
    expect(fake.rows("orders")[0].status).toBe("provisioned");
    expect(fake.rows("provisioning_jobs")[0]).toMatchObject({ id: "j_failed", status: "succeeded", attempts: 4 });
  });

  it("does not provision when the session is not paid", async () => {
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    const res = await receiveBillingEvent(fake.asClient(), checkoutCompleted(orderId, sessionId, { ...snapshot!, paymentStatus: "unpaid" }));
    expect(res).toEqual({ duplicate: false, outcome: "order pending" });
    expect(fake.rows("organizations")).toHaveLength(0);
  });

  it("applies subscription events to the linked row and flags ones it cannot attribute", async () => {
    // Provision first so the subscription and its provider link exist.
    const snapshot = await getBillingProvider().getCheckoutSession(sessionId);
    await receiveBillingEvent(fake.asClient(), checkoutCompleted(orderId, sessionId, snapshot));
    const sub = fake.rows("subscriptions")[0];
    const link = fake.rows("provider_links").find((l) => l.resource_kind === "subscription" && l.entity_id === sub.id)!;

    const updated: BillingSubscriptionSnapshot = {
      externalId: String(link.external_id),
      customerExternalId: "cus_x",
      priceExternalId: "price_ext_care",
      status: "past_due",
      currentPeriodStart: "2026-09-01T00:00:00.000Z",
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      canceledAt: null,
      trialEnd: null,
    };
    const res = await receiveBillingEvent(fake.asClient(), { externalEventId: "evt_sub_1", type: "subscription.updated", rawType: "customer.subscription.updated", subscription: updated, raw: {} });
    expect(res).toEqual({ duplicate: false, outcome: "subscription subscription.updated" });
    expect(sub).toMatchObject({ status: "past_due", cancel_at_period_end: true, current_period_end: "2026-10-01T00:00:00.000Z" });

    const unknown = await receiveBillingEvent(fake.asClient(), { externalEventId: "evt_sub_2", type: "subscription.updated", rawType: "customer.subscription.updated", subscription: { ...updated, externalId: "sub_stranger", customerExternalId: "cus_stranger" }, raw: {} });
    expect(unknown).toEqual({ duplicate: false, outcome: "subscription unattributed" });
    expect(fake.rows("subscriptions")).toHaveLength(1);
  });

  it("marks the inbox row failed and rethrows when handling blows up, so the provider retries", async () => {
    const provider = getBillingProvider();
    const snapshot = await provider.getCheckoutSession(sessionId);
    // Make completing the checkout impossible: the order row vanishes between insert and handling.
    fake.rows("orders").length = 0;
    await expect(receiveBillingEvent(fake.asClient(), checkoutCompleted(orderId, sessionId, snapshot, "evt_boom"), provider)).rejects.toThrow(/not found/);
    expect(fake.rows("webhook_events")[0]).toMatchObject({ event_id: "evt_boom", status: "failed" });
    expect((fake.rows("webhook_events")[0].error as { message: string }).message).toMatch(/not found/);
  });
});
