import "server-only";
import Stripe from "stripe";
import { DomainEngineError } from "./errors";
import type {
  DomainPaymentOperations,
  OrderContext,
  PaymentState,
} from "./orchestrator";

export type DomainPaymentAction = "checkout" | "capture" | "cancel" | "refund" | "expire_checkout";
export type LiveDomainPaymentAuthority = (order: OrderContext, action: DomainPaymentAction) => Promise<void>;
const denyLivePayments: LiveDomainPaymentAuthority = async () => {
  throw new DomainEngineError("domain_live_payment_disabled", "Live domain payment operations require approved billing policy and release.", 403);
};

/** Shared reconciliation; production mutations require authority for each operation. */
class StripeDomainPayments<E extends "test" | "live"> implements DomainPaymentOperations {
  private readonly stripe: Stripe;
  constructor(
    key: string,
    readonly environment: E,
    private readonly webhookSecret?: string,
    private readonly authority: LiveDomainPaymentAuthority = denyLivePayments,
  ) {
    if (!(environment === "test" ? /^(sk|rk)_test_/ : /^(sk|rk)_live_/).test(key))
      throw new DomainEngineError(
        "domain_live_payment_disabled",
        environment === "test" ? "Domain payments require an isolated Stripe test key." : "Production domain payments require a separate Stripe live key.",
        403,
      );
    this.stripe = new Stripe(key, { apiVersion: "2025-08-27.basil", timeout:10000, maxNetworkRetries:1 });
  }
  async createCheckout(order: OrderContext, returnUrl: string) {
    this.assertOrder(order);
    if (order.paymentRef) return this.resumeCheckout(order);
    await this.authorize(order, "checkout");
    const url = new URL(returnUrl);
    if (
      url.protocol !== "https:" &&
      !(
        this.environment === "test" && url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      throw new DomainEngineError(
        "invalid_return",
        "The payment return address is invalid.",
      );
    url.searchParams.set("order", order.id);
    const b = order.billingBreakdown;
    if ((this.environment === "live" && !b) || (b && (
      ![b.registrationMinor, b.serviceFeeMinor, b.taxMinor].every(n => Number.isSafeInteger(n) && n >= 0) || b.registrationMinor <= 0 ||
      b.registrationMinor !== order.registrarAmountMinor || b.registrationMinor + b.serviceFeeMinor + b.taxMinor !== order.totalMinor
    ))) throw new DomainEngineError("domain_price_mismatch", "The itemized domain price needs reconciliation before checkout.", 503);
    const item = (name: string, amount: number) => ({ quantity: 1, price_data: { currency: order.currency, unit_amount: amount, product_data: { name } } });
    const registrationLabel = `${order.fqdn} — ${order.years} year domain registration${this.environment === "test" ? " (test)" : ""}`;
    const lineItems = b ? [item(registrationLabel, b.registrationMinor), ...(b.serviceFeeMinor > 0 ? [item("Vigil domain automation service fee", b.serviceFeeMinor)] : []), ...(b.taxMinor > 0 ? [item("Sales tax", b.taxMinor)] : [])] : [item(registrationLabel, order.totalMinor)];
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "payment",
        ui_mode: "embedded",
        payment_method_types: ["card"],
        wallet_options: { link: { display: "never" } },
        return_url: url.toString(),
        redirect_on_completion: "if_required",
        // Tax was already calculated and consented to. Do not calculate it twice.
        automatic_tax: { enabled: false },
        line_items: lineItems,
        metadata: {
          domain_order_id: order.id,
          organization_id: order.organizationId,
          domain_engine: `v2-${this.environment}`,
        },
        payment_intent_data: {
          capture_method: "manual",
          metadata: {
            domain_order_id: order.id,
            organization_id: order.organizationId,
            domain_engine: `v2-${this.environment}`,
          },
        },
        // Stable across retries: Stripe rejects reused keys with changed parameters.
        expires_at:
          Math.floor(Date.parse(order.quoteExpiresAt) / 1000) + 30 * 60,
      },
      { idempotencyKey: `domain-checkout:${order.id}` },
    );
    if (!session.client_secret || session.livemode !== (this.environment === "live"))
      throw new DomainEngineError(
        "domain_payment_unavailable",
        "Test payment could not be prepared.",
        503,
      );
    return { sessionId: session.id, clientSecret: session.client_secret };
  }
  async snapshot(
    order: OrderContext,
  ): Promise<{ state: PaymentState; captureBefore: string | null }> {
    const session = await this.checkout(order);
    const intent = session.payment_intent;
    if (!intent)
      return {
        state: session.status === "expired" ? "canceled" : "awaiting_payment",
        captureBefore: null,
      };
    if (typeof intent === "string")
      throw new DomainEngineError(
        "payment_unconfirmed",
        "The payment status needs reconciliation.",
        503,
      );
    this.assertIntent(intent, order);
    if (intent.status === "succeeded" && intent.amount_received !== order.totalMinor)
      throw new DomainEngineError("capture_mismatch", "The captured amount needs reconciliation.", 503);
    const charge =
      typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    if (charge?.refunded) return { state: "refunded", captureBefore: null };
    if (charge?.amount_refunded)
      return { state: "refund_pending", captureBefore: null };
    const state: PaymentState =
      intent.status === "succeeded"
        ? "paid"
        : intent.status === "requires_capture"
          ? "authorized"
          : intent.status === "canceled"
            ? "canceled"
            : intent.status === "requires_payment_method" &&
                intent.last_payment_error
              ? "failed"
              : "awaiting_payment";
    const deadline = charge?.payment_method_details?.card?.capture_before;
    return {
      state,
      captureBefore: deadline ? new Date(deadline * 1000).toISOString() : null,
    };
  }
  async capture(order: OrderContext) {
    await this.authorize(order, "capture");
    const intent = await this.intent(order);
    if (intent.status === "succeeded") {
      if (intent.amount_received !== order.totalMinor)
        throw new DomainEngineError(
          "capture_mismatch",
          "The captured amount needs reconciliation.",
        );
      return;
    }
    if (intent.status !== "requires_capture")
      throw new DomainEngineError(
        "capture_unavailable",
        "The authorized payment could not be captured.",
      );
    if (intent.amount_capturable !== order.totalMinor)
      throw new DomainEngineError(
        "capture_mismatch",
        "The authorized amount needs reconciliation.",
      );
    const charge =
      typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    const captureBefore = charge?.payment_method_details?.card?.capture_before;
    if (captureBefore && captureBefore * 1000 <= Date.now())
      throw new DomainEngineError(
        "capture_expired",
        "The payment authorization expired.",
      );
    await this.authorize(order, "capture");
    const captured = await this.stripe.paymentIntents.capture(
      intent.id,
      { amount_to_capture: order.totalMinor },
      { idempotencyKey: `domain-capture:${order.id}` },
    );
    if (!captured || captured.status !== "succeeded" || captured.amount_received !== order.totalMinor)
      throw new DomainEngineError("capture_unconfirmed", "The capture result needs reconciliation before confirming payment.", 503);
    this.assertIntent(captured, order);
  }
  async cancel(order: OrderContext) {
    await this.authorize(order, "cancel");
    const intent = await this.intent(order);
    if (intent.status === "canceled") return;
    if (intent.status === "succeeded")
      throw new DomainEngineError(
        "payment_already_captured",
        "This payment needs refund reconciliation.",
      );
    await this.authorize(order, "cancel");
    const canceled = await this.stripe.paymentIntents.cancel(
      intent.id,
      {},
      { idempotencyKey: `domain-cancel:${order.id}` },
    );
    if (!canceled || canceled.status !== "canceled")
      throw new DomainEngineError("cancellation_unconfirmed", "The payment authorization needs reconciliation before confirming its release.", 503);
    this.assertIntent(canceled, order);
  }
  async refund(order: OrderContext) {
    await this.authorize(order, "refund");
    const intent = await this.intent(order);
    const charge =
      typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    if (charge?.refunded) return;
    const refunds = await this.stripe.refunds.list({
      payment_intent: intent.id,
      limit: 100,
    });
    const existing = refunds.data.find(
      (refund) =>
        refund.metadata?.domain_order_id === order.id &&
        refund.status !== "failed" &&
        refund.status !== "canceled",
    );
    if (existing) {
      if (
        existing.status === "succeeded" &&
        existing.amount === order.totalMinor &&
        existing.currency === order.currency
      )
        return;
      throw new DomainEngineError(
        "refund_pending",
        "The refund is still processing.",
      );
    }
    if (charge?.amount_refunded)
      throw new DomainEngineError(
        "partial_refund_review",
        "This payment needs refund reconciliation.",
      );
    await this.authorize(order, "refund");
    const refund = await this.stripe.refunds.create(
      {
        payment_intent: intent.id,
        amount: order.totalMinor,
        metadata: { domain_order_id: order.id },
      },
      { idempotencyKey: `domain-refund:${order.id}` },
    );
    if (
      refund.status !== "succeeded" ||
      refund.amount !== order.totalMinor ||
      refund.currency !== order.currency
    )
      throw new DomainEngineError(
        "refund_pending",
        "The refund is still processing.",
      );
  }
  async releaseFailedPayment(order: OrderContext) {
    const intent = await this.intent(order);
    if (intent.status === "succeeded") {
      await this.refund(order);
      return "refunded" as const;
    }
    await this.cancel(order);
    return "canceled" as const;
  }
  verifyWebhook(body: string, signature: string | null): Stripe.Event {
    if (!this.webhookSecret || !signature)
      throw new DomainEngineError(
        "invalid_domain_webhook",
        "Payment signature verification failed.",
        400,
      );
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      );
      if (event.livemode !== (this.environment === "live")) throw new Error();
      return event;
    } catch {
      throw new DomainEngineError(
        "invalid_domain_webhook",
        "Payment signature verification failed.",
        400,
      );
    }
  }
  async resumeCheckout(order: OrderContext) {
    const session = await this.checkout(order);
    if (
      session.status !== "open" ||
      !session.client_secret ||
      Date.parse(order.quoteExpiresAt) <= Date.now()
    )
      throw new DomainEngineError(
        "checkout_unavailable",
        "This checkout needs reconciliation. Recheck the existing order before choosing another quote.",
        409,
      );
    return { sessionId: session.id, clientSecret: session.client_secret };
  }
  async expireUnpaidCheckout(order: OrderContext) {
    await this.authorize(order, "expire_checkout");
    const session = await this.checkout(order);
    if (session.status === "open") {
      const expired = await this.stripe.checkout.sessions.expire(session.id);
      if (expired.status !== "expired" || expired.livemode !== (this.environment === "live"))
        throw new DomainEngineError(
          "checkout_unconfirmed",
          "The expired checkout needs reconciliation.",
          503,
        );
      return;
    }
    if (session.status !== "expired")
      throw new DomainEngineError(
        "checkout_completed",
        "Reconcile the payment before expiring this checkout.",
        409,
      );
  }
  private async checkout(
    order: OrderContext,
  ): Promise<Stripe.Checkout.Session> {
    this.assertOrder(order);
    if (!order.paymentRef?.startsWith(this.environment === "test" ? "cs_test_" : "cs_live_"))
      throw new DomainEngineError(
        "payment_reference_missing",
        "The test payment reference is missing.",
      );
    const session = await this.stripe.checkout.sessions.retrieve(
      order.paymentRef,
      { expand: ["payment_intent.latest_charge"] },
    );
    if (
      session.livemode !== (this.environment === "live") ||
      session.mode !== "payment" ||
      session.metadata?.domain_order_id !== order.id ||
      session.metadata?.organization_id !== order.organizationId ||
      session.amount_total !== order.totalMinor ||
      session.currency !== order.currency
    )
      throw new DomainEngineError(
        "payment_mismatch",
        "The payment does not match this domain order.",
      );
    return session;
  }
  private async intent(order: OrderContext): Promise<Stripe.PaymentIntent> {
    const session = await this.checkout(order);
    const intent = session.payment_intent;
    if (!intent || typeof intent === "string")
      throw new DomainEngineError(
        "payment_unconfirmed",
        "The payment status needs reconciliation.",
        503,
      );
    this.assertIntent(intent, order);
    return intent;
  }
  private assertIntent(intent: Stripe.PaymentIntent, order: OrderContext) {
    if (
      intent.livemode !== (this.environment === "live") ||
      intent.amount !== order.totalMinor ||
      intent.currency !== order.currency ||
      intent.metadata.domain_order_id !== order.id ||
      intent.metadata.organization_id !== order.organizationId
    )
      throw new DomainEngineError(
        "payment_mismatch",
        "The payment does not match this domain order.",
      );
  }
  private async authorize(order: OrderContext, action: DomainPaymentAction) {
    this.assertOrder(order);
    if (this.environment === "live") {
      if (action === "capture" && order.registrationState !== "registered")
        throw new DomainEngineError("registration_unconfirmed", "Confirm registration before capturing the domain payment.", 409);
      await this.authority(order, action);
    }
  }
  private assertOrder(order: OrderContext) {
    assertPaymentOrder(order, this.environment);
  }

}
function assertPaymentOrder(order: OrderContext, environment: "test" | "live") {
  if (
    order.environment !== environment ||
    !Number.isSafeInteger(order.totalMinor) ||
    order.totalMinor <= 0 ||
    order.currency !== "usd"
  )
    throw new DomainEngineError(
      "payment_mismatch",
      "This test payment does not match a valid domain quote.",
    );
}

/** Existing sandbox API and isolated-key guarantee remain unchanged. */
export class StripeTestDomainPayments extends StripeDomainPayments<"test"> {
  constructor(key: string, webhookSecret?: string) { super(key, "test", webhookSecret); }
}

/** Prepared production adapter, with no production runtime factory or route enabled. */
export class StripeProductionDomainPayments extends StripeDomainPayments<"live"> {
  constructor(key: string, authority: LiveDomainPaymentAuthority = denyLivePayments, webhookSecret?: string) {
    super(key, "live", webhookSecret, authority);
  }
}
