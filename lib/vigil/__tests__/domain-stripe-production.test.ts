import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeProductionDomainPayments } from "../domain-engine/stripe-production";
import { StripeTestDomainPayments } from "../domain-engine/stripe-test";
import type { OrderContext } from "../domain-engine/orchestrator";
const sdk = vi.hoisted(() => ({ checkout: { sessions: { create: vi.fn(), retrieve: vi.fn(), expire: vi.fn() } }, paymentIntents: { capture: vi.fn(), cancel: vi.fn() }, refunds: { list: vi.fn(), create: vi.fn() }, webhooks: { constructEvent: vi.fn() } }));
vi.mock("stripe", () => ({ default: class { constructor() { return sdk; } } }));
const order = { id: "order", organizationId: "org", fqdn: "fixture.com", years: 1, autoRenew: false, acceptanceId: "consent", registrar: "namecom", environment: "live", registrarAmountMinor: 1200, totalMinor: 1700, billingBreakdown: {registrationMinor:1200,serviceFeeMinor:500,taxMinor:0}, currency: "usd", quoteExpiresAt: new Date(Date.now() + 300_000).toISOString(), registrationState: "registered", paymentState: "authorized", paymentRef: "cs_live_fixture", registrarOrderRef: "receipt", contact: {} } as OrderContext;
const session = () => ({ livemode: true, mode: "payment", amount_total: 1700, currency: "usd", metadata: { domain_order_id: order.id, organization_id: order.organizationId }, payment_intent: { id: "pi_fixture", livemode: true, amount: 1700, amount_received: 1700, status: "succeeded", currency: "usd", metadata: { domain_order_id: order.id, organization_id: order.organizationId }, latest_charge: { refunded: false, amount_refunded: 0 } } });
beforeEach(() => vi.resetAllMocks());
describe("prepared production domain billing", () => {
  it("rejects test keys in production and live keys in the sandbox", () => {
    expect(() => new StripeProductionDomainPayments("sk_test_fixture")).toThrow("separate Stripe live");
    expect(() => new StripeTestDomainPayments("sk_live_fixture")).toThrow("isolated Stripe test");
  });
  it("denies all money-moving operations before any SDK request without authority", async () => {
    const payments = new StripeProductionDomainPayments("sk_live_fake");
    for (const work of [() => payments.createCheckout({ ...order, paymentRef: null }, "https://vigil.example.com/dashboard/domain"), () => payments.capture(order), () => payments.cancel(order), () => payments.refund(order), () => payments.expireUnpaidCheckout(order)]) await expect(work()).rejects.toThrow("approved billing policy");
    for (const mock of [sdk.checkout.sessions.create, sdk.checkout.sessions.retrieve, sdk.checkout.sessions.expire, sdk.paymentIntents.capture, sdk.paymentIntents.cancel, sdk.refunds.list, sdk.refunds.create]) expect(mock).not.toHaveBeenCalled();
  });
  it("rejects a sandbox order or session before trusting payment state", async () => {
    const payments = new StripeProductionDomainPayments("sk_live_fake");
    await expect(payments.snapshot({ ...order, environment: "test" })).rejects.toThrow();
    expect(sdk.checkout.sessions.retrieve).not.toHaveBeenCalled();
    sdk.checkout.sessions.retrieve.mockResolvedValue({ ...session(), livemode: false });
    await expect(payments.snapshot(order)).rejects.toThrow("does not match");
  });
  it("requires confirmed registration even when a caller supplies financial authority", async () => {
    const authority = vi.fn(async () => {});
    await expect(new StripeProductionDomainPayments("sk_live_fake", authority).capture({ ...order, registrationState: "unknown" })).rejects.toThrow("Confirm registration");
    expect(authority).not.toHaveBeenCalled();
    expect(sdk.paymentIntents.capture).not.toHaveBeenCalled();
  });
  it("reconciles the exact live captured total from mocked Stripe truth", async () => {
    sdk.checkout.sessions.retrieve.mockResolvedValue(session());
    expect((await new StripeProductionDomainPayments("sk_live_fake").snapshot(order)).state).toBe("paid");
    const short = session(); short.payment_intent.amount_received = 1600;
    sdk.checkout.sessions.retrieve.mockResolvedValue(short);
    await expect(new StripeProductionDomainPayments("sk_live_fake").snapshot(order)).rejects.toThrow("captured amount");
  });
  it("keeps customer metadata, stable checkout idempotency and manual capture in a mocked live checkout", async () => {
    sdk.checkout.sessions.create.mockResolvedValue({ id: "cs_live_fixture", client_secret: "fake_secret", livemode: true });
    const authority = vi.fn(async () => {});
    const awaiting = { ...order, paymentRef: null, registrationState: "awaiting_payment" as const };
    await new StripeProductionDomainPayments("sk_live_fake", authority).createCheckout(awaiting, "https://vigil.example.com/dashboard/domain");
    expect(authority).toHaveBeenCalledWith(awaiting, "checkout");
    const [input, options] = sdk.checkout.sessions.create.mock.calls[0];
    expect(input.payment_intent_data.capture_method).toBe("manual");
    expect(input.metadata).toMatchObject({ domain_engine: "v2-live", domain_order_id: order.id, organization_id: order.organizationId });
    expect(input.line_items.map((line: {price_data:{unit_amount:number}})=>line.price_data.unit_amount)).toEqual([1200,500]);
    expect(input.line_items[1].price_data.product_data.name).toBe("Vigil domain automation service fee");
    expect(input.automatic_tax.enabled).toBe(false);
    expect(input.line_items[0].price_data.product_data.name).not.toContain("test");
    expect(options.idempotencyKey).toBe(`domain-checkout:${order.id}`);
  });
  it("separately states the approved tax on checkout and receipts without recalculating it", async () => {
    sdk.checkout.sessions.create.mockResolvedValue({ id: "cs_live_fixture", client_secret: "fake_secret", livemode: true });
    await new StripeProductionDomainPayments("sk_live_fake", async () => {}).createCheckout({ ...order, paymentRef: null, totalMinor: 1840, billingBreakdown: { registrationMinor: 1200, serviceFeeMinor: 500, taxMinor: 140 } }, "https://vigil.example.com/dashboard/domain");
    const input = sdk.checkout.sessions.create.mock.calls[0][0];
    expect(input.line_items.map((line: {price_data:{unit_amount:number}})=>line.price_data.unit_amount)).toEqual([1200,500,140]);
    expect(input.line_items[2].price_data.product_data.name).toBe("Sales tax");
    expect(input.automatic_tax).toEqual({enabled:false});
  });
  it("rejects missing or inconsistent live itemization before sending Stripe a request", async () => {
    const payments = new StripeProductionDomainPayments("sk_live_fake", async () => {});
    for (const billingBreakdown of [undefined, { registrationMinor: 1200, serviceFeeMinor: 500, taxMinor: 1 }, { registrationMinor: 1000, serviceFeeMinor: 700, taxMinor: 0 }, { registrationMinor: 1200, serviceFeeMinor: 600, taxMinor: -100 }])
      await expect(payments.createCheckout({ ...order, paymentRef: null, billingBreakdown }, "https://vigil.example.com/dashboard/domain")).rejects.toThrow("itemized domain price");
    expect(sdk.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it("refuses plain HTTP return URLs in production", async () => {
    await expect(new StripeProductionDomainPayments("sk_live_fake", async () => {}).createCheckout({ ...order, paymentRef: null }, "http://localhost:3187/domain-engine-test")).rejects.toThrow("return address");
    expect(sdk.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it("does not accept a test-mode event at the production verifier", () => {
    sdk.webhooks.constructEvent.mockReturnValue({ livemode: false });
    expect(() => new StripeProductionDomainPayments("sk_live_fake", undefined, "whsec_fake").verifyWebhook("{}", "fake-signature")).toThrow("signature verification");
  });
});
