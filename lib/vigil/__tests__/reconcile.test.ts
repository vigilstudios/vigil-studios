import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "../email";
import { getBillingProvider } from "../providers/registry";
import { startCheckout } from "../services/orders";
import { reconcileOrders } from "../services/reconcile";
import { FakeAdmin } from "./fake-admin";

vi.mock("../email", async (importOriginal) => ({ ...(await importOriginal<typeof import("../email")>()), sendEmail: vi.fn(async () => ({ sent: true, id: "em" })) }));
const sent = vi.mocked(sendEmail);
vi.spyOn(console, "info").mockImplementation(() => undefined);
vi.spyOn(console, "error").mockImplementation(() => undefined);

const PLAN = "plan_care";
const PRICE = "price_care_month";
const BUILD = "build_express";
const NOW = new Date("2026-09-16T12:00:00.000Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

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

async function pendingOrder(fake: FakeAdmin, business: string, createdMinutesAgo: number) {
  const { orderId } = await startCheckout(fake.asClient(), { email: `${business.toLowerCase()}@test.co`, businessName: business, projectKind: "express", templateSlug: "restaurant", planCode: "care", appUrl: "https://app.test" }, getBillingProvider());
  const row = fake.rows("orders").find((o) => o.id === orderId)!;
  row.created_at = ago(createdMinutesAgo);
  return { orderId, row };
}

describe("reconcileOrders", () => {
  let fake: FakeAdmin;
  const providerSpies: { mockRestore: () => void }[] = [];
  const spyProvider = <K extends "getSubscription" | "getCheckoutSession">(method: K) => {
    const spy = vi.spyOn(getBillingProvider(), method);
    providerSpies.push(spy);
    return spy;
  };
  beforeEach(() => {
    fake = seed();
    sent.mockClear();
  });
  // The registry's provider is a singleton shared by every test in this file.
  afterEach(() => {
    for (const spy of providerSpies.splice(0)) spy.mockRestore();
  });

  it("provisions a paid order that was left behind, and alerts only if it still cannot", async () => {
    const { orderId, row } = await pendingOrder(fake, "Left", 30);
    row.status = "paid";
    row.paid_at = ago(20);
    const report = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(report.provisioned).toEqual([orderId]);
    expect(report.stillStuck).toEqual([]);
    expect(report.alerted).toBe(false);
    expect(fake.rows("orders")[0].status).toBe("provisioned");
    // Nothing needed a person: the only email is the customer's welcome and the staff "new customer" note.
    expect(sent.mock.calls.map((c) => c[0].subject).some((s) => s.startsWith("Needs attention"))).toBe(false);
  });

  it("ignores a paid order younger than the stuck window", async () => {
    const { row } = await pendingOrder(fake, "Fresh", 5);
    row.status = "paid";
    row.paid_at = ago(2);
    const report = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(report.provisioned).toEqual([]);
    expect(row.status).toBe("paid");
  });

  it("emails staff about an order that stays stuck, once a day, and remembers it on the order", async () => {
    const { orderId, row } = await pendingOrder(fake, "Stuck", 60);
    row.status = "paid";
    row.paid_at = ago(30);
    // Make provisioning impossible: the plan the order references is gone.
    row.plan_id = "plan_missing";
    fake.rows("plan_prices").length = 0;
    const provider = getBillingProvider();
    spyProvider("getSubscription").mockRejectedValue(new Error("provider down"));

    const first = await reconcileOrders(fake.asClient(), { now: NOW, provider });
    expect(first.stillStuck).toEqual([orderId]);
    expect(first.alerted).toBe(true);
    const alert = sent.mock.calls.map((c) => c[0]).find((m) => m.subject.startsWith("Needs attention"))!;
    expect(alert.text).toMatch(/Stuck <stuck@test.co>/);
    expect((row.metadata as { reconcile: { notified_at: string } }).reconcile.notified_at).toBe(NOW.toISOString());

    sent.mockClear();
    const second = await reconcileOrders(fake.asClient(), { now: new Date(NOW.getTime() + 3_600_000), provider });
    expect(second.stillStuck).toEqual([orderId]);
    expect(second.alerted).toBe(false);
    expect(sent.mock.calls.some((c) => c[0].subject.startsWith("Needs attention"))).toBe(false);

    const nextDay = await reconcileOrders(fake.asClient(), { now: new Date(NOW.getTime() + 25 * 3_600_000), provider });
    expect(nextDay.alerted).toBe(true);
  });

  it("completes and provisions a pending order whose session was paid but never reported", async () => {
    const { orderId } = await pendingOrder(fake, "Quiet", 90);
    const report = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(report.completed).toEqual([orderId]);
    expect(report.provisioned).toEqual([orderId]);
    expect(fake.rows("orders")[0]).toMatchObject({ status: "provisioned" });
  });

  it("expires a pending order whose session expired, and leaves young or unpaid-but-open ones alone", async () => {
    const provider = getBillingProvider();
    const expired = await pendingOrder(fake, "Expired", 120);
    const open = await pendingOrder(fake, "Open", 120);
    const young = await pendingOrder(fake, "Young", 10);
    const real = provider.getCheckoutSession.bind(provider);
    spyProvider("getCheckoutSession").mockImplementation(async (id) => {
      const snap = await real(id);
      if (!snap) return null;
      if (id === (expired.row.metadata as { checkout_session: string }).checkout_session) return { ...snap, status: "expired", paymentStatus: "unpaid" };
      if (id === (open.row.metadata as { checkout_session: string }).checkout_session) return { ...snap, status: "open", paymentStatus: "unpaid" };
      return snap;
    });
    const report = await reconcileOrders(fake.asClient(), { now: NOW, provider });
    expect(report.expired).toEqual([expired.orderId]);
    expect(expired.row.status).toBe("expired");
    expect(open.row.status).toBe("pending");
    expect(young.row.status).toBe("pending");
    expect(report.completed).toEqual([]);
  });

  it("sends the welcome email once more when the first attempt failed, then hands it to a person", async () => {
    fake.rows("orders").push({ id: "ord_w", status: "provisioned", provisioned_at: ago(30), email: "w@test.co", business_name: "Welcome", metadata: { welcome_email: { sent: false, error: "domain not verified" } } });
    const first = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(first.welcomeResent).toEqual(["ord_w"]);
    const meta = () => fake.rows("orders")[0].metadata as { welcome_email: { sent: boolean; retried: boolean } };
    expect(meta().welcome_email).toMatchObject({ sent: true, retried: true });

    // A retry that fails too becomes an alert; a third pass does not keep trying.
    fake.rows("orders")[0].metadata = { welcome_email: { sent: false, error: "still broken" } };
    sent.mockImplementationOnce(async () => ({ sent: false, error: "still broken" }));
    const second = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(second.welcomeResent).toEqual([]);
    expect(second.alerted).toBe(true);
    expect(meta().welcome_email.retried).toBe(true);
    sent.mockClear();
    await reconcileOrders(fake.asClient(), { now: NOW });
    expect(sent.mock.calls.some((c) => c[0].subject.startsWith("Welcome"))).toBe(false);
  });

  it("re-sends the onboarding-complete notification when the first one never went out", async () => {
    fake.rows("projects").push({ id: "proj_1", name: "Bakery website", organization_id: "org_1" });
    fake.rows("audit_events").push({ id: 1, action: "project.intake_completed", entity_type: "project", entity_id: "proj_1", organization_id: "org_1", created_at: ago(60) });
    // Briefs from before the notification record existed are not re-sent.
    fake.rows("projects").push({ id: "proj_old", name: "Old website", organization_id: "org_0" });
    fake.rows("audit_events").push({ id: 2, action: "project.intake_completed", entity_type: "project", entity_id: "proj_old", organization_id: "org_0", created_at: "2026-09-14T04:50:00.000Z" });
    const report = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(report.intakeNotified).toEqual(["proj_1"]);
    expect(sent.mock.calls.map((c) => c[0].subject)).toContain("Onboarding complete: Bakery website");
    expect(fake.rows("audit_events").some((e) => e.action === "project.intake_notified" && e.entity_id === "proj_1")).toBe(true);

    sent.mockClear();
    const again = await reconcileOrders(fake.asClient(), { now: NOW });
    expect(again.intakeNotified).toEqual([]);
    expect(sent).not.toHaveBeenCalled();
  });
});
