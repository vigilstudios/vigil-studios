import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { StripeBillingProvider } from "../providers/stripe";

/**
 * The normalizers are module-private; exercise them through parseWebhook
 * with events signed by Stripe's own test-header helper. No network.
 */
const SECRET = "whsec_test_secret";
const provider = new StripeBillingProvider("sk_test_placeholder", SECRET);
const stripe = new Stripe("sk_test_placeholder", { apiVersion: "2025-08-27.basil" });

function signed(payload: object): { body: string; sig: string } {
  const body = JSON.stringify(payload);
  return { body, sig: stripe.webhooks.generateTestHeaderString({ payload: body, secret: SECRET }) };
}

const subscription = {
  id: "sub_123",
  object: "subscription",
  customer: "cus_123",
  status: "active",
  cancel_at_period_end: false,
  canceled_at: null,
  trial_end: null,
  metadata: { order_id: "ord_1" },
  items: { object: "list", data: [{ id: "si_1", object: "subscription_item", price: { id: "price_care", object: "price" }, current_period_start: 1_757_808_000, current_period_end: 1_760_400_000 }] },
};

describe("StripeBillingProvider.parseWebhook", () => {
  it("rejects a bad signature and a missing header", async () => {
    const { body } = signed({ id: "evt_1", type: "ping" });
    await expect(provider.parseWebhook(body, "t=1,v1=bad")).rejects.toThrow(/signature/i);
    await expect(provider.parseWebhook(body, null)).rejects.toThrow(/Missing/);
  });

  it("normalizes a completed checkout session", async () => {
    const { body, sig } = signed({
      id: "evt_cs",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          object: "checkout.session",
          status: "complete",
          payment_status: "paid",
          customer: "cus_123",
          customer_details: { email: "Owner@Lounge.com" },
          subscription: "sub_123",
          amount_total: 64800,
          currency: "usd",
          metadata: { order_id: "ord_1", plan_code: "care" },
        },
      },
    });
    const ev = await provider.parseWebhook(body, sig);
    expect(ev.type).toBe("checkout.completed");
    expect(ev.externalEventId).toBe("evt_cs");
    expect(ev.checkout).toEqual({
      externalId: "cs_123",
      status: "complete",
      paymentStatus: "paid",
      customerExternalId: "cus_123",
      customerEmail: "Owner@Lounge.com",
      subscriptionExternalId: "sub_123",
      amountTotalCents: 64800,
      currency: "usd",
      reference: { order_id: "ord_1", plan_code: "care" },
    });
    expect(ev.reference).toEqual({ order_id: "ord_1", plan_code: "care" });
  });

  it("normalizes subscription lifecycle events, reading the period from the item (Basil)", async () => {
    const { body, sig } = signed({ id: "evt_sub", object: "event", type: "customer.subscription.updated", data: { object: subscription } });
    const ev = await provider.parseWebhook(body, sig);
    expect(ev.type).toBe("subscription.updated");
    expect(ev.subscription).toEqual({
      externalId: "sub_123",
      customerExternalId: "cus_123",
      priceExternalId: "price_care",
      status: "active",
      currentPeriodStart: new Date(1_757_808_000 * 1000).toISOString(),
      currentPeriodEnd: new Date(1_760_400_000 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEnd: null,
    });

    const deleted = signed({ id: "evt_del", object: "event", type: "customer.subscription.deleted", data: { object: { ...subscription, status: "canceled", canceled_at: 1_760_000_000 } } });
    const del = await provider.parseWebhook(deleted.body, deleted.sig);
    expect(del.type).toBe("subscription.deleted");
    expect(del.subscription?.status).toBe("canceled");
    expect(del.subscription?.canceledAt).toBe(new Date(1_760_000_000 * 1000).toISOString());

    const weird = signed({ id: "evt_inc", object: "event", type: "customer.subscription.created", data: { object: { ...subscription, status: "incomplete_expired" } } });
    expect((await provider.parseWebhook(weird.body, weird.sig)).subscription?.status).toBe("incomplete");
  });

  it("finds the subscription on invoices under parent.subscription_details and ignores the rest", async () => {
    const paid = signed({ id: "evt_inv", object: "event", type: "invoice.paid", data: { object: { id: "in_1", object: "invoice", parent: { subscription_details: { subscription: "sub_123" } } } } });
    const ev = await provider.parseWebhook(paid.body, paid.sig);
    expect(ev).toMatchObject({ type: "invoice.paid", subscriptionExternalId: "sub_123" });

    const failed = signed({ id: "evt_fail", object: "event", type: "invoice.payment_failed", data: { object: { id: "in_2", object: "invoice", parent: { subscription_details: { subscription: { id: "sub_9" } } } } } });
    expect((await provider.parseWebhook(failed.body, failed.sig)).subscriptionExternalId).toBe("sub_9");

    const other = signed({ id: "evt_x", object: "event", type: "payment_intent.created", data: { object: { id: "pi_1", object: "payment_intent" } } });
    expect((await provider.parseWebhook(other.body, other.sig)).type).toBe("ignored");
  });
});
