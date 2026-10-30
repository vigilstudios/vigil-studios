import "server-only";
import type { OrderContext } from "./orchestrator";

/** A checkout must replace prior asset state without exposing private evidence. */
export function checkoutOrderView(order: OrderContext) {
  return {
    order: {
      id: order.id,
      fqdn: order.fqdn,
      totalMinor: order.totalMinor,
      ...(order.billingBreakdown ? { priceBreakdown: order.billingBreakdown } : {}),
      currency: order.currency,
      registrationState: order.registrationState,
      paymentState: order.paymentState,
      connectionState: order.connectionState ?? "not_started",
      reason: order.reason ?? null,
    },
    registration: null,
    registrationId: null,
    transferRequested: false,
  };
}
