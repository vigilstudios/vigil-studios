import { describe, it, expect, vi } from "vitest";
import { readDomainEngineConfig } from "../domain-engine/config";
import {
  DemoDomainStore,
  DemoDomainPayments,
} from "../domain-engine/demo-store";
import { MockRegistrarAdapter } from "../domain-engine/mock";
import {
  processDomainOrder,
  type OrderContext,
} from "../domain-engine/orchestrator";
import { renewalNoticeKind } from "../domain-engine/lifecycle";
import { RegistrationNotSubmittedError } from "../domain-engine/errors";
const config = readDomainEngineConfig({
  NODE_ENV: "test",
  VIGIL_DOMAIN_ENGINE_ENABLED: "true",
  VIGIL_DOMAIN_MOCK_ENABLED: "true",
  VIGIL_DOMAIN_REGISTRAR: "mock",
});
function setup(
  outcome: "succeeded" | "pending" | "unknown" = "succeeded",
  failCapture = false,
) {
  const store = new DemoDomainStore(config);
  const payments = new DemoDomainPayments(config, failCapture);
  const registrar = new MockRegistrarAdapter(
    { "vigil-fixture.com": { amountMinor: 1200, renewalMinor: 1400, outcome } },
    config,
  );
  const order: OrderContext = {
    id: "order",
    organizationId: "organization",
    fqdn: "vigil-fixture.com",
    years: 1,
    autoRenew: false,
    acceptanceId: "approval",
    registrar: "mock",
    environment: "test",
    registrarAmountMinor: 1200,
    totalMinor: 1500,
    currency: "usd",
    quoteExpiresAt: new Date(Date.now() + 300_000).toISOString(),
    registrationState: "ready",
    paymentState: "authorized",
    paymentRef: "mock-payment",
    registrarOrderRef: null,
    contact: {
      firstName: "Test",
      lastName: "Owner",
      email: "test@example.test",
      phone: "+12125550100",
      address: {
        line1: "1 Example Street",
        city: "Test",
        region: "NY",
        postalCode: "10001",
        country: "US",
      },
    },
  };
  store.orders.set(order.id, {
    ...order,
    connectionState: "not_started",
    reason: null,
  });
  return { store, payments, registrar, order };
}
describe("domain transaction orchestration", () => {
  it("registers once under concurrency, captures only after confirmation, and waits for approved launch", async () => {
    const { store, payments, registrar } = setup();
    const buy = vi.spyOn(registrar, "register");
    await Promise.all([
      processDomainOrder(store, registrar, payments, "order"),
      processDomainOrder(store, registrar, payments, "order"),
    ]);
    expect(buy).toHaveBeenCalledTimes(1);
    expect(payments.captures.size).toBe(1);
    expect(store.orders.get("order")).toMatchObject({
      registrationState: "registered",
      paymentState: "paid",
      connectionState: "ready_for_launch",
    });
    expect(buy.mock.calls[0][0].expectedRegistrarPrice.amountMinor).toBe(1200); // Never pass the marked-up sale amount.
  });
  it("claims before preflight so a delayed worker cannot refund another worker’s successful purchase", async () => {
    const { store, payments, registrar } = setup();
    const search = vi.spyOn(registrar, "searchAndPrice");
    const buy = vi.spyOn(registrar, "register");
    await Promise.all([
      processDomainOrder(store, registrar, payments, "order"),
      processDomainOrder(store, registrar, payments, "order"),
    ]);
    expect(search).toHaveBeenCalledTimes(1);
    expect(buy).toHaveBeenCalledTimes(1);
    expect(payments.refunds.size).toBe(0);
    expect(payments.cancellations.size).toBe(0);
    expect(store.orders.get("order")?.registrationState).toBe("registered");
  });
  it("releases payment after failed discovery without submitting or abandoning an unknown purchase", async () => {
    const { store, payments, registrar } = setup();
    vi.spyOn(registrar, "searchAndPrice").mockRejectedValue(new Error("lookup timeout"));
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).not.toHaveBeenCalled();
    expect(payments.cancellations.size).toBe(1);
    expect(store.orders.get("order")).toMatchObject({ registrationState: "failed", paymentState: "canceled", reason: "provider_failed" });
  });
  it("refuses a stale final registrar quote", async () => {
    const { store, payments, registrar } = setup();
    const quotes = await registrar.searchAndPrice(["vigil-fixture.com"]);
    vi.spyOn(registrar, "searchAndPrice").mockResolvedValue([
      { ...quotes[0], expiresAt: "2000-01-01T00:00:00Z" },
    ]);
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).not.toHaveBeenCalled();
    expect(payments.cancellations.size).toBe(1);
  });
  it("releases an expired card authorization before a purchase", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.paymentCaptureBefore = "2000-01-01T00:00:00Z";
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).not.toHaveBeenCalled();
    expect(payments.cancellations.size).toBe(1);
    expect(store.orders.get("order")?.reason).toBe("payment_failed");
  });
  it("does not purchase without authoritative paid or authorized state", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.paymentState = "awaiting_payment";
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).not.toHaveBeenCalled();
  });
  it("does not retry an uncertain registrar call or refund before knowing its outcome", async () => {
    const { store, payments, registrar } = setup();
    const buy = vi
      .spyOn(registrar, "register")
      .mockRejectedValue(new Error("timeout"));
    await processDomainOrder(store, registrar, payments, "order");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).toHaveBeenCalledTimes(1);
    expect(store.orders.get("order")?.registrationState).toBe("unknown");
    expect(payments.refunds.size).toBe(0);
    expect(payments.cancellations.size).toBe(0);
  });
  it("releases authorization once when prepaid funding fails before any purchase submission", async () => {
    const { store, payments, registrar } = setup();
    const buy = vi.spyOn(registrar, "register").mockRejectedValue(new RegistrationNotSubmittedError());
    await processDomainOrder(store, registrar, payments, "order");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).toHaveBeenCalledTimes(1);
    expect(payments.cancellations.size).toBe(1);
    expect(payments.captures.size).toBe(0);
    expect(payments.refunds.size).toBe(0);
    expect(store.orders.get("order")).toMatchObject({ registrationState: "failed", paymentState: "canceled", reason: "provider_failed" });
  });
  it("polls a pending purchase instead of buying again", async () => {
    const { store, payments, registrar } = setup("pending");
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).toHaveBeenCalledTimes(1);
    expect(store.orders.get("order")?.registrationState).toBe("pending");
    expect(payments.captures.size).toBe(0);
  });
  it("persists a receipt read timeout and recovers without purchasing again", async () => {
    const { store, payments, registrar } = setup();
    const buy = vi.spyOn(registrar, "register");
    const verify = vi.spyOn(registrar, "getDomainStatus");
    verify.mockRejectedValueOnce(new Error("receipt read timeout"));
    await processDomainOrder(store, registrar, payments, "order");
    expect(store.orders.get("order")?.registrationState).toBe("unknown");
    expect(store.orders.get("order")?.registrarOrderRef).toBeTruthy();
    expect(payments.captures.size).toBe(0);
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).toHaveBeenCalledTimes(1);
    expect(store.orders.get("order")?.registrationState).toBe("registered");
    expect(payments.captures.size).toBe(1);
  });
  it("keeps an order reference when status reconciliation fails", async () => {
    const { store, payments, registrar } = setup("pending");
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    vi.spyOn(registrar, "getOrderStatus").mockRejectedValue(
      new Error("status timeout"),
    );
    await processDomainOrder(store, registrar, payments, "order");
    expect(store.orders.get("order")?.registrationState).toBe("unknown");
    expect(store.orders.get("order")?.registrarOrderRef).toBeTruthy();
    expect(buy).toHaveBeenCalledTimes(1);
    expect(payments.captures.size).toBe(0);
  });
  it("keeps a successful registration when capture fails", async () => {
    const { store, payments, registrar } = setup("succeeded", true);
    await processDomainOrder(store, registrar, payments, "order");
    expect(store.orders.get("order")).toMatchObject({
      registrationState: "registered",
      paymentState: "capture_failed",
    });
    expect(store.registrations.size).toBe(1);
    expect(payments.refunds.size).toBe(0);
  });
  it("releases authorization on quote expiry without submitting registration", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.quoteExpiresAt = "2000-01-01T00:00:00Z";
    const buy = vi.spyOn(registrar, "register");
    await processDomainOrder(store, registrar, payments, "order");
    expect(buy).not.toHaveBeenCalled();
    expect(payments.cancellations.size).toBe(1);
    expect(store.orders.get("order")?.reason).toBe("quote_expired");
  });
  it("refunds a collected payment after a definitive availability failure", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.paymentState = "paid";
    vi.spyOn(registrar, "searchAndPrice").mockResolvedValue([
      {
        fqdn: "vigil-fixture.com",
        availability: "unavailable",
        registration: null,
        renewal: null,
        years: 1,
        premium: false,
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      },
    ]);
    await processDomainOrder(store, registrar, payments, "order");
    expect(payments.refunds.size).toBe(1);
    expect(store.orders.get("order")?.paymentState).toBe("refunded");
  });
  it("stops on changed registrar cost instead of using the customer sale price", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.registrarAmountMinor = 1500;
    await processDomainOrder(store, registrar, payments, "order");
    expect(store.orders.get("order")?.reason).toBe("price_changed");
    expect(payments.cancellations.size).toBe(1);
  });
  it("rejects mixed provider environments before any operation", async () => {
    const { store, payments, registrar } = setup();
    store.orders.get("order")!.environment = "live";
    await expect(
      processDomainOrder(store, registrar, payments, "order"),
    ).rejects.toThrow("environment mismatch");
  });
});
describe("renewal notices", () => {
  it.each([
    [61, null],
    [60, "renewal_60"],
    [30, "renewal_30"],
    [14, "renewal_14"],
    [7, "renewal_7"],
    [0, "expired"],
    [-1, "expired"],
  ] as const)(
    "selects the most urgent reminder at %s days",
    (days, expected) => {
      const now = new Date("2026-10-24T00:00:00Z");
      expect(
        renewalNoticeKind(
          new Date(now.getTime() + days * 86_400_000).toISOString(),
          now,
        ),
      ).toBe(expected);
    },
  );
});
