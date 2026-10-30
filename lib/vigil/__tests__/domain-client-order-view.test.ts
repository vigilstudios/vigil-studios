import { describe, expect, it } from "vitest";
import { checkoutOrderView } from "../domain-engine/client-order-view";
import type { OrderContext } from "../domain-engine/orchestrator";

const order: OrderContext = {
  id: "new-order", organizationId: "private-organization", fqdn: "new-client.example.com",
  years: 1, autoRenew: false, acceptanceId: "private-acceptance", registrar: "namecom", environment: "live",
  registrarAmountMinor: 1200, totalMinor: 1800, currency: "usd", quoteExpiresAt: "2099-01-01T00:00:00Z",
  registrationState: "awaiting_payment", paymentState: "awaiting_payment", connectionState: "not_started", reason: null,
  paymentRef: "private-checkout-reference", registrarOrderRef: "private-receipt-reference",
  contact: { firstName: "Private", lastName: "Owner", email: "private-owner@example.test", phone: "+12125550100", address: { line1: "1 Private Street", city: "Private City", region: "NY", postalCode: "10001", country: "US" } },
};

describe("checkout order view boundary", () => {
  it("replaces a prior domain and asset when a new checkout is returned", () => {
    const prior = { order: { id: "old-order", fqdn: "old-client.example.com" }, registration: { contactVerification: "verified" }, registrationId: "old-asset", transferRequested: true };
    const next = { ...prior, ...checkoutOrderView(order) };
    expect(next.order.id).toBe("new-order");
    expect(next.order.fqdn).toBe("new-client.example.com");
    expect(next.registration).toBeNull();
    expect(next.registrationId).toBeNull();
    expect(next.transferRequested).toBe(false);
  });
  it("exposes the customer total and progress without private order evidence", () => {
    const view = checkoutOrderView(order);
    expect(view.order.totalMinor).toBe(1800);
    expect(view.order.paymentState).toBe("awaiting_payment");
    const encoded = JSON.stringify(view);
    for (const privateValue of [order.organizationId, order.acceptanceId, order.paymentRef!, order.registrarOrderRef!, order.contact.email, order.contact.address.line1]) expect(encoded).not.toContain(privateValue);
    expect(view.order).not.toHaveProperty("registrarAmountMinor");
  });
  it("keeps authoritative saved failure and connection states", () => {
    expect(checkoutOrderView({ ...order, registrationState: "registered", paymentState: "capture_failed", connectionState: "ready_for_launch", reason: "capture_failed" }).order).toMatchObject({ registrationState: "registered", paymentState: "capture_failed", connectionState: "ready_for_launch", reason: "capture_failed" });
  });
});
