import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBillingProvider } from "../providers/registry";
import { startCheckout } from "../services/orders";
import { settleOrder } from "../services/settle";
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

/** The success page's path: the buyer lands before (or instead of) the webhook. */
describe("settleOrder", () => {
  let fake: FakeAdmin;
  let orderId: string;
  beforeEach(async () => {
    fake = seed();
    // The job handlers use the registry's provider; the null provider's checkout is paid on creation.
    ({ orderId } = await startCheckout(fake.asClient(), { email: "owner@marlowandfen.test", businessName: "Marlow & Fen", projectKind: "express", templateSlug: "restaurant", planCode: "care", appUrl: "https://app.test" }, getBillingProvider()));
  });

  it("takes a pending order with a paid session all the way to provisioned", async () => {
    const res = await settleOrder(fake.asClient(), orderId, { worker: "test" });
    expect(res.status).toBe("provisioned");
    expect(res.actions).toEqual(["completed", "queued"]);
    expect(fake.rows("organizations")).toHaveLength(1);
    expect(fake.rows("provisioning_jobs")[0]).toMatchObject({ kind: "order.provision", status: "succeeded" });
    // Welcome email was attempted (dry run in tests) and its outcome recorded.
    expect(res.welcomeSent).toBe(false);
  });

  it("re-queues a permanently failed provision job and provisions on the second visit", async () => {
    // First visit: the order is paid but the job failed for good (the memoized-read bug of 15 Sep).
    fake.rows("orders")[0].status = "paid";
    fake.rows("provisioning_jobs").push({ id: "j_failed", kind: "order.provision", idempotency_key: `order.provision:${orderId}`, status: "failed", attempts: 1, max_attempts: 8, scheduled_for: new Date(0).toISOString(), payload: { order_id: orderId }, error: { message: "boom" } });

    const res = await settleOrder(fake.asClient(), orderId, { worker: "test" });
    expect(res.status).toBe("provisioned");
    expect(res.actions).toEqual(["queued"]);
    expect(fake.rows("provisioning_jobs")).toHaveLength(1);
    expect(fake.rows("provisioning_jobs")[0]).toMatchObject({ id: "j_failed", status: "succeeded", attempts: 2 });
  });

  it("is a no-op on an order that is already provisioned, and reports the state of anything else", async () => {
    await settleOrder(fake.asClient(), orderId, { worker: "test" });
    const orgs = fake.rows("organizations").length;
    const again = await settleOrder(fake.asClient(), orderId, { worker: "test" });
    expect(again.status).toBe("provisioned");
    expect(again.actions).toEqual([]);
    expect(fake.rows("organizations")).toHaveLength(orgs);

    fake.rows("orders").push({ id: "ord_expired", status: "expired", metadata: {} });
    expect((await settleOrder(fake.asClient(), "ord_expired")).status).toBe("expired");
    await expect(settleOrder(fake.asClient(), "ord_missing")).rejects.toThrow(/not found/);
  });

  it("leaves a pending order pending when the provider says it is unpaid", async () => {
    const provider = getBillingProvider();
    const sessionId = (fake.rows("orders")[0].metadata as { checkout_session: string }).checkout_session;
    const snapshot = (await provider.getCheckoutSession(sessionId))!;
    vi.spyOn(provider, "getCheckoutSession").mockResolvedValueOnce({ ...snapshot, paymentStatus: "unpaid", status: "open" });
    const res = await settleOrder(fake.asClient(), orderId, { worker: "test" });
    expect(res.status).toBe("pending");
    expect(res.actions).toEqual([]);
    expect(fake.rows("provisioning_jobs")).toHaveLength(0);
  });

  it("can queue without running, for callers that drain the queue themselves", async () => {
    const res = await settleOrder(fake.asClient(), orderId, { run: false });
    expect(res.status).toBe("paid");
    expect(fake.rows("provisioning_jobs")[0]).toMatchObject({ status: "queued" });
  });
});
