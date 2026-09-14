import { describe, expect, it } from "vitest";
import type { BillingProvider } from "../providers/types";
import { NullBillingProvider } from "../providers/null";
import { planPriceExternalId, syncCatalogToProvider } from "../services/catalog";
import { FakeAdmin } from "./fake-admin";

function stripeLike(mode: "live" | "test"): BillingProvider {
  const p = new NullBillingProvider() as unknown as BillingProvider & { name: string; mode: string };
  Object.assign(p, { name: "stripe", mode });
  return p;
}

describe("catalog sync and price links", () => {
  it("records the provider mode on each link and refuses ids from the other mode", async () => {
    const fake = new FakeAdmin({
      plans: [{ id: "plan_care", code: "care", name: "Vigil Care", tagline: null }],
      plan_prices: [{ id: "pp_month", plan_id: "plan_care", currency: "usd", interval: "month", interval_count: 1, amount_cents: 9900, is_active: true }],
      build_prices: [],
    });
    const test = stripeLike("test");
    const report = await syncCatalogToProvider(fake.asClient(), test);
    expect(report.synced).toHaveLength(1);
    const link = fake.rows("provider_links")[0];
    expect(link).toMatchObject({ provider: "stripe", entity_type: "plan_price", entity_id: "pp_month", metadata: { mode: "test" } });

    expect(await planPriceExternalId(fake.asClient(), "pp_month", test)).toBe(link.external_id);
    // The same database seen from a live key: the test price is not usable.
    expect(await planPriceExternalId(fake.asClient(), "pp_month", stripeLike("live"))).toBeNull();

    // A live sync adds the live link; both modes keep working, each with its own id.
    await syncCatalogToProvider(fake.asClient(), stripeLike("live"));
    expect(fake.rows("provider_links").filter((l) => l.entity_id === "pp_month")).toHaveLength(2);
    const live = await planPriceExternalId(fake.asClient(), "pp_month", stripeLike("live"));
    expect(live).not.toBeNull();
    expect(live).not.toBe(link.external_id);
    expect(await planPriceExternalId(fake.asClient(), "pp_month", test)).toBe(link.external_id);

    // Re-syncing test mode after a price change (new provider id) replaces only the test link.
    const test2 = stripeLike("test");
    await syncCatalogToProvider(fake.asClient(), test2);
    const links = fake.rows("provider_links").filter((l) => l.entity_id === "pp_month");
    expect(links).toHaveLength(2);
    const testNow = await planPriceExternalId(fake.asClient(), "pp_month", test2);
    expect(testNow).not.toBe(link.external_id);
    expect(await planPriceExternalId(fake.asClient(), "pp_month", stripeLike("live"))).toBe(live);
  });
});
