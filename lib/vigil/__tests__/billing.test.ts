import { describe, expect, it } from "vitest";
import { NullBillingProvider } from "../providers/null";
import type { BillingSubscriptionSnapshot } from "../providers/types";
import { applySubscriptionSnapshot } from "../services/billing";
import { FakeAdmin } from "./fake-admin";

const snapshot = (over: Partial<BillingSubscriptionSnapshot> = {}): BillingSubscriptionSnapshot => ({
  externalId: "sub_1",
  customerExternalId: "cus_1",
  priceExternalId: "price_ext",
  status: "active",
  currentPeriodStart: "2026-09-01T00:00:00.000Z",
  currentPeriodEnd: "2026-10-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEnd: null,
  ...over,
});

function seed() {
  return new FakeAdmin({
    plan_prices: [{ id: "pp_1", plan_id: "plan_1" }],
    provider_links: [
      { provider: "other", resource_kind: "customer", external_id: "cus_1", entity_type: "organization", entity_id: "org_1" },
      { provider: "other", resource_kind: "price", external_id: "price_ext", entity_type: "plan_price", entity_id: "pp_1" },
    ],
  });
}

/** Subscription events from the provider (webhook, invoice, provisioning) all land here. */
describe("applySubscriptionSnapshot", () => {
  it("creates the subscription for a known customer and price, and links it for next time", async () => {
    const fake = seed();
    const res = await applySubscriptionSnapshot(fake.asClient(), snapshot(), new NullBillingProvider());
    expect(res.created).toBe(true);
    const sub = fake.rows("subscriptions")[0];
    expect(sub).toMatchObject({ organization_id: "org_1", plan_id: "plan_1", plan_price_id: "pp_1", status: "active", current_period_end: "2026-10-01T00:00:00.000Z" });
    expect(fake.rows("provider_links").find((l) => l.resource_kind === "subscription")).toMatchObject({ external_id: "sub_1", entity_type: "subscription", entity_id: sub.id });
  });

  it("updates the linked row on later events instead of creating another", async () => {
    const fake = seed();
    await applySubscriptionSnapshot(fake.asClient(), snapshot(), new NullBillingProvider());
    const res = await applySubscriptionSnapshot(fake.asClient(), snapshot({ status: "canceled", canceledAt: "2026-09-20T00:00:00.000Z", cancelAtPeriodEnd: true }), new NullBillingProvider());
    expect(res.created).toBe(false);
    expect(fake.rows("subscriptions")).toHaveLength(1);
    expect(fake.rows("subscriptions")[0]).toMatchObject({ status: "canceled", canceled_at: "2026-09-20T00:00:00.000Z", cancel_at_period_end: true });
  });

  it("refuses to guess: an unknown customer or price is reported as unattributed, nothing is written", async () => {
    const fake = seed();
    expect(await applySubscriptionSnapshot(fake.asClient(), snapshot({ customerExternalId: "cus_stranger" }), new NullBillingProvider())).toEqual({ subscriptionId: null, created: false });
    expect(await applySubscriptionSnapshot(fake.asClient(), snapshot({ priceExternalId: "price_stranger" }), new NullBillingProvider())).toEqual({ subscriptionId: null, created: false });
    expect(await applySubscriptionSnapshot(fake.asClient(), snapshot({ priceExternalId: null }), new NullBillingProvider())).toEqual({ subscriptionId: null, created: false });
    expect(fake.rows("subscriptions")).toHaveLength(0);
  });
});
