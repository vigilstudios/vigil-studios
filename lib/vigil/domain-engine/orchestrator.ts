import "server-only";
import { RegistrationNotSubmittedError } from "./errors";
import type {
  RegistrarAdapter,
  RegistrarDomain,
  RegistrarOrder,
  RegistrantContact,
  RegistrarName,
  RegistrarQuote,
} from "./contracts";

export type RegistrationState =
  | "awaiting_payment"
  | "ready"
  | "submitting"
  | "pending"
  | "registered"
  | "failed"
  | "unknown"
  | "manual_review";
export type PaymentState =
  | "awaiting_payment"
  | "authorized"
  | "paid"
  | "capture_failed"
  | "failed"
  | "refund_pending"
  | "refunded"
  | "canceled";
export type OrderContext = {
  id: string;
  organizationId: string;
  fqdn: string;
  years: number;
  autoRenew: boolean;
  acceptanceId: string;
  registrar: RegistrarName;
  environment: "test" | "live";
  registrarAmountMinor: number;
  totalMinor: number;
  currency: string;
  quoteExpiresAt: string;
  registrationState: RegistrationState;
  paymentState: PaymentState;
  connectionState?: DomainOrderPatch["connectionState"];
  reason?: DomainOrderPatch["reason"];
  paymentRef: string | null;
  paymentCaptureBefore?: string | null;
  registrarOrderRef: string | null;
  contact: RegistrantContact;
};
export type DomainOrderPatch = {
  registrationState?: RegistrationState;
  paymentState?: PaymentState;
  connectionState?:
    | "not_started"
    | "ready_for_launch"
    | "attaching"
    | "dns_pending"
    | "ssl_pending"
    | "live"
    | "assisted"
    | "failed";
  reason?:
    | "quote_expired"
    | "price_changed"
    | "unavailable"
    | "payment_failed"
    | "capture_failed"
    | "refund_pending"
    | "provider_unknown"
    | "provider_failed"
    | "contact_required"
    | "attachment_failed"
    | "dns_authorization_required"
    | "dns_unsupported"
    | "ssl_pending"
    | "transfer_required"
    | null;
};
export interface DomainOrderStore {
  load(id: string): Promise<OrderContext>;
  claimRegistration(id: string): Promise<boolean>;
  update(id: string, patch: DomainOrderPatch): Promise<void>;
  linkRegistrarOrder(id: string, order: RegistrarOrder): Promise<void>;
  registered(id: string, domain: RegistrarDomain): Promise<void>;
}
export interface DomainPaymentOperations {
  readonly environment: "test" | "live";
  capture(order: OrderContext): Promise<void>;
  cancel(order: OrderContext): Promise<void>;
  refund(order: OrderContext): Promise<void>;
  releaseFailedPayment(order: OrderContext): Promise<"canceled" | "refunded">;
}

/** No automatic repeat of submitting/unknown purchases, including after process death. */
export async function processDomainOrder(
  store: DomainOrderStore,
  registrar: RegistrarAdapter,
  payments: DomainPaymentOperations,
  id: string,
  now = new Date(),
): Promise<void> {
  const order = await store.load(id);
  if (
    order.environment !== registrar.environment ||
    order.environment !== payments.environment ||
    order.registrar !== registrar.name
  )
    throw new Error("Domain provider environment mismatch.");
  if (order.registrationState === "manual_review") return;
  if (order.registrationState === "failed") {
    if (["authorized", "paid", "refund_pending"].includes(order.paymentState))
      await recoverFailedPayment(store, payments, order);
    return;
  }
  if (order.registrationState === "registered") {
    await finishPayment(store, payments, order);
    return;
  }
  if (["submitting", "unknown", "pending"].includes(order.registrationState)) {
    if (!order.registrarOrderRef) {
      await store.update(id, {
        registrationState: "unknown",
        reason: "provider_unknown",
      });
      return;
    }
    let external: RegistrarOrder | null;
    try {
      external = await registrar.getOrderStatus(order.registrarOrderRef);
    } catch {
      await store.update(id, {
        registrationState: "unknown",
        reason: "provider_unknown",
      });
      return;
    }
    if (!external) {
      await store.update(id, {
        registrationState: "unknown",
        reason: "provider_unknown",
      });
      return;
    }
    await applyRegistrarResult(store, registrar, payments, order, external);
    return;
  }
  if (!["authorized", "paid"].includes(order.paymentState)) return;
  // Claim before checking availability: a second worker must never interpret
  // the first worker’s successful registration as a sold-domain failure.
  if (!(await store.claimRegistration(id))) return;
  if (
    order.paymentState === "authorized" &&
    order.paymentCaptureBefore &&
    (!Number.isFinite(Date.parse(order.paymentCaptureBefore)) ||
      Date.parse(order.paymentCaptureBefore) <= now.getTime())
  ) {
    await failBeforeRegistration(store, payments, order, "payment_failed");
    return;
  }
  if (new Date(order.quoteExpiresAt).getTime() <= now.getTime()) {
    await failBeforeRegistration(store, payments, order, "quote_expired");
    return;
  }
  let fresh: RegistrarQuote | undefined;
  try {
    [fresh] = await registrar.searchAndPrice([order.fqdn], order.years);
  } catch {
    // Only discovery has run. A failed lookup cannot have registered the name.
    await failBeforeRegistration(store, payments, order, "provider_failed");
    return;
  }
  if (
    !fresh ||
    fresh.fqdn !== order.fqdn ||
    fresh.availability !== "available"
  ) {
    await failBeforeRegistration(store, payments, order, "unavailable");
    return;
  }
  if (
    !Number.isFinite(Date.parse(fresh.expiresAt)) ||
    Date.parse(fresh.expiresAt) <= now.getTime() ||
    fresh.years !== order.years ||
    fresh.registration?.amountMinor !== order.registrarAmountMinor ||
    fresh.registration.currency !== order.currency
  ) {
    await failBeforeRegistration(store, payments, order, "price_changed");
    return;
  }
  let result: RegistrarOrder;
  try {
    result = await registrar.register({
      intentId: id,
      organizationId: order.organizationId,
      fqdn: order.fqdn,
      years: order.years,
      autoRenew: order.autoRenew,
      expectedRegistrarPrice: {
        amountMinor: order.registrarAmountMinor,
        currency: order.currency,
      },
      contact: order.contact,
      acceptanceId: order.acceptanceId,
    });
  } catch (error) {
    if (error instanceof RegistrationNotSubmittedError) {
      await failBeforeRegistration(store, payments, order, "provider_failed");
      return;
    }
    // The request may have reached the registrar; neither refunds nor rebuys
    // are safe until reconciliation establishes the authoritative outcome.
    await store.update(id, {
      registrationState: "unknown",
      reason: "provider_unknown",
    });
    return;
  }
  await store.linkRegistrarOrder(id, result);
  await applyRegistrarResult(store, registrar, payments, order, result);
}

async function applyRegistrarResult(
  store: DomainOrderStore,
  registrar: RegistrarAdapter,
  payments: DomainPaymentOperations,
  order: OrderContext,
  result: RegistrarOrder,
): Promise<void> {
  if (result.fqdn !== order.fqdn) {
    await store.update(order.id, {
      registrationState: "manual_review",
      reason: "provider_unknown",
    });
    return;
  }
  if (result.status === "failed") {
    await failBeforeRegistration(store, payments, order, "provider_failed");
    return;
  }
  if (result.status === "unknown") {
    await store.update(order.id, {
      registrationState: "unknown",
      reason: "provider_unknown",
    });
    return;
  }
  if (result.status !== "succeeded") {
    await store.update(order.id, {
      registrationState: "pending",
      reason: result.status === "action_required" ? "contact_required" : null,
    });
    return;
  }
  let domain: RegistrarDomain | null;
  try {
    domain = await registrar.getDomainStatus(order.fqdn, {
      registrarOrderRef: result.externalId,
      intentId: order.id,
      organizationId: order.organizationId,
      fqdn: order.fqdn,
      years: order.years,
      autoRenew: order.autoRenew,
      expectedRegistrarPrice: {
        amountMinor: order.registrarAmountMinor,
        currency: order.currency,
      },
      contact: order.contact,
      acceptanceId: order.acceptanceId,
    });
  } catch {
    await store.update(order.id, {
      registrationState: "unknown",
      reason: "provider_unknown",
    });
    return;
  }
  if (
    !domain ||
    domain.fqdn !== order.fqdn ||
    !["registered", "contact_hold"].includes(domain.status) ||
    (registrar.name === "openprovider" &&
      domain.externalId !== result.externalId)
  ) {
    await store.update(order.id, {
      registrationState: "unknown",
      reason: "provider_unknown",
    });
    return;
  }
  await store.registered(order.id, domain);
  await store.update(order.id, {
    registrationState: "registered",
    connectionState: "ready_for_launch",
    reason:
      domain.contactVerification === "pending" ? "contact_required" : null,
  });
  await finishPayment(store, payments, {
    ...order,
    registrationState: "registered",
  });
}
async function finishPayment(
  store: DomainOrderStore,
  payments: DomainPaymentOperations,
  order: OrderContext,
): Promise<void> {
  if (
    order.paymentState !== "authorized" &&
    order.paymentState !== "capture_failed"
  )
    return;
  try {
    await payments.capture(order);
    await store.update(order.id, { paymentState: "paid" });
  } catch {
    await store.update(order.id, {
      paymentState: "capture_failed",
      reason: "capture_failed",
    });
  }
}
async function failBeforeRegistration(
  store: DomainOrderStore,
  payments: DomainPaymentOperations,
  order: OrderContext,
  reason: DomainOrderPatch["reason"],
): Promise<void> {
  // Record the definitive failure first; recovery must reconcile payment separately.
  await store.update(order.id, { registrationState: "failed", reason });
  await recoverFailedPayment(store, payments, order);
}
async function recoverFailedPayment(
  store: DomainOrderStore,
  payments: DomainPaymentOperations,
  order: OrderContext,
) {
  if (!["authorized", "paid", "refund_pending"].includes(order.paymentState))
    return;
  await store.update(order.id, { paymentState: "refund_pending" });
  try {
    const state = await payments.releaseFailedPayment(order);
    await store.update(order.id, { paymentState: state });
  } catch {
    await store.update(order.id, {
      paymentState: "refund_pending",
      reason: "refund_pending",
    });
  }
}
