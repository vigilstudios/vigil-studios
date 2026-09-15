import { beforeEach, describe, expect, it, vi } from "vitest";
import { NullBillingProvider } from "../providers/null";
import { completeCheckout, provisionOrder, startCheckout } from "../services/orders";
import { FakeAdmin } from "./fake-admin";

// No Supabase secret in tests: the welcome email falls back to /login and
// logs a dry run. Keep the console quiet.
vi.spyOn(console, "info").mockImplementation(() => undefined);
vi.spyOn(console, "error").mockImplementation(() => undefined);

const PLAN = "plan_care";
const PRICE = "price_care_month";
const BUILD = "build_express";

function seed() {
  return new FakeAdmin({
    plans: [{ id: PLAN, code: "care", name: "Vigil Care", is_active: true }],
    plan_prices: [
      { id: PRICE, plan_id: PLAN, amount_cents: 4900, currency: "usd", interval: "month", interval_count: 1, is_active: true },
      { id: "price_care_year3", plan_id: PLAN, amount_cents: 132300, currency: "usd", interval: "year", interval_count: 3, is_active: true },
    ],
    build_prices: [
      { id: BUILD, kind: "express", name: "Express Site", amount_cents: 59900, currency: "usd", is_active: true },
      { id: "build_custom", kind: "custom", name: "Custom Build", amount_cents: null, currency: "usd", is_active: true },
    ],
    provider_links: [
      { provider: "other", resource_kind: "price", external_id: "price_ext_care", entity_type: "plan_price", entity_id: PRICE, metadata: { mode: "test" } },
      { provider: "other", resource_kind: "price", external_id: "price_ext_build", entity_type: "build_price", entity_id: BUILD },
      { provider: "other", resource_kind: "price", external_id: "price_ext_care_3y", entity_type: "plan_price", entity_id: "price_care_year3" },
    ],
  });
}

describe("startCheckout", () => {
  let fake: FakeAdmin;
  beforeEach(() => {
    fake = seed();
  });

  it("creates a pending order, both line items, and links the checkout session", async () => {
    const provider = new NullBillingProvider();
    const spy = vi.spyOn(provider, "createCheckoutSession");
    const res = await startCheckout(fake.asClient(), { email: "Buyer@Example.com", businessName: "  Marlow & Fen ", projectKind: "express", templateSlug: "restaurant", planCode: "care", appUrl: "https://app.test" }, provider);

    const order = fake.rows("orders")[0];
    expect(order.status).toBe("pending");
    expect(order.email).toBe("buyer@example.com");
    expect(order.business_name).toBe("Marlow & Fen");
    expect(order.plan_amount_cents).toBe(4900);
    expect(order.plan_price_id).toBe(PRICE);
    expect(order.build_amount_cents).toBe(59900);
    expect(res.orderId).toBe(order.id);

    const input = spy.mock.calls[0][0];
    expect(input.mode).toBe("subscription");
    expect(input.lineItems).toEqual([{ priceExternalId: "price_ext_care" }, { priceExternalId: "price_ext_build" }]);
    expect(input.successUrl).toBe(`https://app.test/checkout/success?order=${order.id}`);
    expect(input.reference).toMatchObject({ order_id: order.id, plan_code: "care", project_kind: "express", template_slug: "restaurant" });

    const link = fake.rows("provider_links").find((l) => l.resource_kind === "checkout_session");
    expect(link).toMatchObject({ entity_type: "order", entity_id: order.id });
    expect((order.metadata as { checkout_session: string }).checkout_session).toBe(link?.external_id);
  });

  it("bills the chosen period and records which price row was bought", async () => {
    const provider = new NullBillingProvider();
    const spy = vi.spyOn(provider, "createCheckoutSession");
    await startCheckout(fake.asClient(), { email: "a@b.c", businessName: "X", projectKind: "express", planCode: "care", billingPeriod: "year3", appUrl: "https://app.test" }, provider);
    expect(fake.rows("orders")[0]).toMatchObject({ plan_price_id: "price_care_year3", plan_amount_cents: 132300 });
    expect(spy.mock.calls[0][0].lineItems[0]).toEqual({ priceExternalId: "price_ext_care_3y" });
    expect(spy.mock.calls[0][0].reference.billing_period).toBe("year3");
    await expect(startCheckout(fake.asClient(), { email: "a@b.c", businessName: "X", projectKind: "express", planCode: "care", billingPeriod: "year", appUrl: "https://app.test" }, provider)).rejects.toThrow(/annual price/);
  });

  it("marks a self-serve order failed when the provider refuses to open a payment page", async () => {
    const provider = new NullBillingProvider();
    vi.spyOn(provider, "createCheckoutSession").mockRejectedValue(new Error("customer_update can only be used with customer"));
    await expect(startCheckout(fake.asClient(), { email: "a@b.c", businessName: "X", projectKind: "express", planCode: "care", appUrl: "https://app.test" }, provider)).rejects.toThrow(/customer_update/);
    expect(fake.rows("orders")[0]).toMatchObject({ status: "failed" });
  });

  it("quotes a custom build as an ad-hoc line and reuses a staff-created order", async () => {
    fake.rows("orders").push({ id: "ord_staff", status: "pending", checkout_token: "tok", email: "c@x.com", business_name: "Cigar Lounge", project_kind: "custom", metadata: {} });
    const provider = new NullBillingProvider();
    const spy = vi.spyOn(provider, "createCheckoutSession");
    const res = await startCheckout(fake.asClient(), { email: "c@x.com", businessName: "Cigar Lounge", projectKind: "custom", planCode: "care", existingOrderId: "ord_staff", buildAmountOverrideCents: 350000, appUrl: "https://app.test" }, provider);
    expect(res.orderId).toBe("ord_staff");
    expect(fake.rows("orders")).toHaveLength(1);
    const items = spy.mock.calls[0][0].lineItems;
    expect(items[0]).toEqual({ priceExternalId: "price_ext_care" });
    expect(items[1]).toMatchObject({ adHoc: { amountCents: 350000, currency: "usd" } });
    expect(spy.mock.calls[0][0].cancelUrl).toBe("https://app.test/checkout/tok?canceled=1");
  });

  it("refuses a plan without an approved price and a plan that was never synced", async () => {
    fake.rows("plan_prices")[0].amount_cents = null;
    await expect(startCheckout(fake.asClient(), { email: "a@b.c", businessName: "X", projectKind: "express", planCode: "care", appUrl: "https://app.test" }, new NullBillingProvider())).rejects.toThrow(/approved monthly price/);
    fake.rows("plan_prices")[0].amount_cents = 4900;
    fake.rows("provider_links").splice(0, 1);
    await expect(startCheckout(fake.asClient(), { email: "a@b.c", businessName: "X", projectKind: "express", planCode: "care", appUrl: "https://app.test" }, new NullBillingProvider())).rejects.toThrow(/not been synced/);
    expect(fake.rows("orders")).toHaveLength(0);
  });
});

describe("completeCheckout + provisionOrder", () => {
  it("turns a paid order into an organization, owner invite, project, website and subscription — once", async () => {
    const fake = seed();
    const provider = new NullBillingProvider();
    const { orderId } = await startCheckout(fake.asClient(), { email: "owner@lounge.com", businessName: "Cigar Lounge", projectKind: "express", templateSlug: "restaurant", planCode: "care", appUrl: "https://app.test" }, provider);
    const sessionId = (fake.rows("orders")[0].metadata as { checkout_session: string }).checkout_session;
    const checkout = (await provider.getCheckoutSession(sessionId))!;

    const paid = await completeCheckout(fake.asClient(), orderId, checkout, provider);
    expect(paid.status).toBe("paid");
    // A second delivery of the same event is a no-op.
    expect((await completeCheckout(fake.asClient(), orderId, checkout, provider)).status).toBe("paid");

    const first = await provisionOrder(fake.asClient(), orderId, provider, "https://app.test");
    expect(first.alreadyProvisioned).toBe(false);

    const org = fake.rows("organizations")[0];
    expect(org).toMatchObject({ name: "Cigar Lounge", slug: "cigar-lounge", billing_email: "owner@lounge.com" });
    expect(fake.rows("organization_invites")[0]).toMatchObject({ organization_id: org.id, email: "owner@lounge.com", role: "owner" });
    const project = fake.rows("projects")[0];
    expect(project).toMatchObject({ organization_id: org.id, kind: "express", status: "intake", template_slug: "restaurant", source_ref: `order:${orderId}` });
    expect(fake.rows("websites")[0]).toMatchObject({ organization_id: org.id, project_id: project.id, template_slug: "restaurant" });
    const sub = fake.rows("subscriptions")[0];
    expect(sub).toMatchObject({ organization_id: org.id, plan_id: PLAN, plan_price_id: PRICE, status: "active" });
    // From the provider's snapshot, not the manual fallback: it carries a period and a link.
    expect(sub.current_period_end).toBeTruthy();
    expect(fake.rows("provider_links").find((l) => l.resource_kind === "subscription")?.entity_id).toBe(sub.id);
    const customer = fake.rows("provider_links").find((l) => l.resource_kind === "customer" && l.entity_type === "organization");
    expect(customer?.entity_id).toBe(org.id);
    expect(fake.rows("orders")[0]).toMatchObject({ status: "provisioned", organization_id: org.id, project_id: project.id, subscription_id: sub.id });
    expect(fake.audit.find((a) => a.p_action === "order.provisioned")).toBeTruthy();

    // Provisioning re-asserts the price link it saw on the subscription; the sync's stamp must survive.
    const priceLink = fake.rows("provider_links").find((l) => l.resource_kind === "price" && l.entity_id === PRICE);
    expect(priceLink?.metadata).toEqual({ mode: "test" });

    const again = await provisionOrder(fake.asClient(), orderId, provider, "https://app.test");
    expect(again).toEqual({ organizationId: org.id, alreadyProvisioned: true });
    expect(fake.rows("organizations")).toHaveLength(1);
    expect(fake.rows("projects")).toHaveLength(1);
    expect(fake.rows("subscriptions")).toHaveLength(1);
  });

  it("refuses to provision an unpaid order and picks a free slug", async () => {
    const fake = seed();
    fake.rows("organizations").push({ id: "org_1", slug: "cigar-lounge", name: "Cigar Lounge" });
    fake.rows("orders").push({ id: "ord_1", status: "pending", email: "a@b.c", business_name: "Cigar Lounge", project_kind: "express", plan_id: PLAN, metadata: {} });
    await expect(provisionOrder(fake.asClient(), "ord_1", new NullBillingProvider(), "https://app.test")).rejects.toThrow(/not paid/);
    fake.rows("orders")[0].status = "paid";
    await provisionOrder(fake.asClient(), "ord_1", new NullBillingProvider(), "https://app.test");
    expect(fake.rows("organizations").map((o) => o.slug)).toEqual(["cigar-lounge", "cigar-lounge-2"]);
    // No checkout session on a staff-paid order: a manual active subscription is created.
    expect(fake.rows("subscriptions")[0]).toMatchObject({ plan_id: PLAN, status: "active" });
  });

  it("completeCheckout leaves unpaid, already-paid and unknown orders alone", async () => {
    const fake = seed();
    const provider = new NullBillingProvider();
    const { orderId } = await startCheckout(fake.asClient(), { email: "a@b.c", businessName: "Shop", projectKind: "express", planCode: "care", appUrl: "https://app.test" }, provider);
    const sessionId = (fake.rows("orders")[0].metadata as { checkout_session: string }).checkout_session;
    const checkout = (await provider.getCheckoutSession(sessionId))!;

    expect((await completeCheckout(fake.asClient(), orderId, { ...checkout, paymentStatus: "unpaid" }, provider)).status).toBe("pending");
    await expect(completeCheckout(fake.asClient(), "ord_ghost", checkout, provider)).rejects.toThrow(/not found/);

    const paid = await completeCheckout(fake.asClient(), orderId, checkout, provider);
    expect(paid.status).toBe("paid");
    expect(paid.paid_at).toBeTruthy();
    // A later "paid" for the same order changes nothing, and a refunded one is never revived.
    fake.rows("orders")[0].status = "refunded";
    expect((await completeCheckout(fake.asClient(), orderId, checkout, provider)).status).toBe("refunded");
  });

  it("resumes a half-finished provisioning without duplicating what already exists", async () => {
    const fake = seed();
    const provider = new NullBillingProvider();
    const { orderId } = await startCheckout(fake.asClient(), { email: "owner@bakery.test", businessName: "Bakery", projectKind: "express", planCode: "care", appUrl: "https://app.test" }, provider);
    const sessionId = (fake.rows("orders")[0].metadata as { checkout_session: string }).checkout_session;
    await completeCheckout(fake.asClient(), orderId, (await provider.getCheckoutSession(sessionId))!, provider);

    // A previous attempt got as far as the organization and the invite, then died.
    fake.rows("organizations").push({ id: "org_half", name: "Bakery", slug: "bakery", billing_email: "owner@bakery.test" });
    fake.rows("organization_invites").push({ id: "inv_half", organization_id: "org_half", email: "owner@bakery.test", role: "owner", revoked_at: null });
    fake.rows("orders")[0].organization_id = "org_half";

    const res = await provisionOrder(fake.asClient(), orderId, provider, "https://app.test");
    expect(res).toEqual({ organizationId: "org_half", alreadyProvisioned: false });
    expect(fake.rows("organizations")).toHaveLength(1);
    expect(fake.rows("organization_invites")).toHaveLength(1);
    expect(fake.rows("projects")).toHaveLength(1);
    expect(fake.rows("websites")).toHaveLength(1);
    expect(fake.rows("subscriptions")).toHaveLength(1);
    expect(fake.rows("orders")[0]).toMatchObject({ status: "provisioned", organization_id: "org_half" });
  });
});
