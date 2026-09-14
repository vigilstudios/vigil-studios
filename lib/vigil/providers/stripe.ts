import Stripe from "stripe";
import { ProviderError } from "@/lib/vigil/auth/errors";
import type {
  BillingCheckoutInput,
  BillingCheckoutSnapshot,
  BillingCustomerInput,
  BillingEvent,
  BillingProvider,
  BillingSubscriptionSnapshot,
  CatalogPriceInput,
  NormalizedSubscriptionStatus,
} from "./types";

/**
 * Stripe adapter. Everything above this file speaks in Vigil terms; every
 * Stripe object id crosses the boundary as an `externalId` string that the
 * services record in provider_links.
 */
export class StripeBillingProvider implements BillingProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string | undefined;

  constructor(secretKey: string, webhookSecret?: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil", appInfo: { name: "Vigil", url: "https://www.vigilstudios.co" } });
    this.webhookSecret = webhookSecret;
  }

  async createCustomer(input: BillingCustomerInput) {
    const c = await this.call(() => this.stripe.customers.create({ email: input.email, name: input.name, metadata: { organization_id: input.organizationId } }));
    return { externalId: c.id };
  }

  async createCheckoutSession(input: BillingCheckoutInput) {
    const session = await this.call(() =>
      this.stripe.checkout.sessions.create({
        mode: input.mode,
        line_items: input.lineItems.map((l) =>
          "adHoc" in l
            ? { quantity: 1, price_data: { currency: l.adHoc.currency, unit_amount: l.adHoc.amountCents, product_data: { name: l.adHoc.name, ...(l.adHoc.description ? { description: l.adHoc.description } : {}) } } }
            : { price: l.priceExternalId, quantity: l.quantity ?? 1 }
        ),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        ...(input.customerExternalId ? { customer: input.customerExternalId } : { customer_email: input.customerEmail }),
        ...(input.mode === "payment" && !input.customerExternalId ? { customer_creation: "always" as const } : {}),
        metadata: input.reference,
        ...(input.mode === "subscription" ? { subscription_data: { metadata: input.reference } } : {}),
        allow_promotion_codes: input.allowPromotionCodes ?? false,
        // Stripe Tax needs a billing address to calculate sales tax.
        automatic_tax: { enabled: input.collectTax ?? false },
        billing_address_collection: input.collectTax ? "required" : "auto",
        ...(input.collectTax ? { customer_update: { address: "auto", name: "auto" } } : {}),
      })
    );
    if (!session.url) throw new ProviderError("stripe", "Stripe did not return a checkout URL.", { retryable: true });
    return { url: session.url, externalId: session.id };
  }

  async getCheckoutSession(externalId: string) {
    const s = await this.call(() => this.stripe.checkout.sessions.retrieve(externalId));
    return toCheckout(s);
  }

  /** Products and prices are found by lookup_key so re-running the sync is idempotent. */
  async ensurePrice(input: CatalogPriceInput) {
    const existing = await this.call(() => this.stripe.prices.list({ lookup_keys: [input.lookupKey], limit: 1, active: true }));
    const found = existing.data[0];
    const wantCount = input.interval ? input.intervalCount ?? 1 : undefined;
    if (found && found.unit_amount === input.amountCents && found.currency === input.currency && (found.recurring?.interval ?? undefined) === input.interval && (found.recurring?.interval_count ?? undefined) === wantCount) {
      return { externalId: found.id, created: false };
    }
    // Reuse the product the previous price pointed at, or create one.
    const productId = found ? (typeof found.product === "string" ? found.product : found.product.id) : (await this.call(() => this.stripe.products.create({ name: input.productName, description: input.productDescription ?? undefined }))).id;
    const price = await this.call(() =>
      this.stripe.prices.create({
        product: productId,
        unit_amount: input.amountCents,
        currency: input.currency,
        ...(input.interval ? { recurring: { interval: input.interval, interval_count: input.intervalCount ?? 1 } } : {}),
        lookup_key: input.lookupKey,
        transfer_lookup_key: true,
      })
    );
    if (found) await this.call(() => this.stripe.prices.update(found.id, { active: false }));
    return { externalId: price.id, created: true };
  }

  async getSubscription(externalId: string) {
    try {
      const s = await this.stripe.subscriptions.retrieve(externalId);
      return toSubscription(s);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError && err.statusCode === 404) return null;
      throw wrap(err);
    }
  }

  async cancelSubscription(externalId: string, options: { atPeriodEnd: boolean }) {
    const s = options.atPeriodEnd
      ? await this.call(() => this.stripe.subscriptions.update(externalId, { cancel_at_period_end: true }))
      : await this.call(() => this.stripe.subscriptions.cancel(externalId));
    return toSubscription(s);
  }

  async createPortalSession(customerExternalId: string, returnUrl: string) {
    const p = await this.call(() => this.stripe.billingPortal.sessions.create({ customer: customerExternalId, return_url: returnUrl }));
    return { url: p.url };
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<BillingEvent> {
    if (!this.webhookSecret) throw new ProviderError("stripe", "STRIPE_WEBHOOK_SECRET is not set.", { retryable: false, status: 500 });
    if (!signature) throw new ProviderError("stripe", "Missing Stripe-Signature header.", { retryable: false, status: 400 });
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      throw new ProviderError("stripe", `Webhook signature verification failed: ${(err as Error).message}`, { retryable: false, status: 400 });
    }
    const base = { externalEventId: event.id, rawType: event.type, raw: event };
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        return { ...base, type: "checkout.completed", checkout: toCheckout(s), reference: s.metadata ?? {} };
      }
      case "customer.subscription.created":
        return { ...base, type: "subscription.created", subscription: toSubscription(event.data.object), reference: event.data.object.metadata ?? {} };
      case "customer.subscription.updated":
        return { ...base, type: "subscription.updated", subscription: toSubscription(event.data.object), reference: event.data.object.metadata ?? {} };
      case "customer.subscription.deleted":
        return { ...base, type: "subscription.deleted", subscription: toSubscription(event.data.object), reference: event.data.object.metadata ?? {} };
      case "invoice.paid":
        return { ...base, type: "invoice.paid", subscriptionExternalId: invoiceSubscriptionId(event.data.object) };
      case "invoice.payment_failed":
        return { ...base, type: "invoice.payment_failed", subscriptionExternalId: invoiceSubscriptionId(event.data.object) };
      default:
        return { ...base, type: "ignored" };
    }
  }

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      throw wrap(err);
    }
  }
}

function wrap(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  if (err instanceof Stripe.errors.StripeError) {
    const retryable = err.type === "StripeConnectionError" || err.type === "StripeAPIError" || err.type === "StripeRateLimitError";
    return new ProviderError("stripe", err.message, { retryable, status: err.statusCode ?? 502 });
  }
  return new ProviderError("stripe", err instanceof Error ? err.message : String(err), { retryable: true });
}

function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  // Basil moved the subscription reference under `parent`.
  const parent = (inv as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } }).parent;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function toSubscription(s: Stripe.Subscription): BillingSubscriptionSnapshot {
  const item = s.items.data[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;
  return {
    externalId: s.id,
    customerExternalId: typeof s.customer === "string" ? s.customer : s.customer.id,
    priceExternalId: item?.price?.id ?? null,
    status: normalizeStatus(s.status),
    currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    canceledAt: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
    trialEnd: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
  };
}

function toCheckout(s: Stripe.Checkout.Session): BillingCheckoutSnapshot {
  return {
    externalId: s.id,
    status: (s.status ?? "open") as BillingCheckoutSnapshot["status"],
    paymentStatus: s.payment_status,
    customerExternalId: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
    customerEmail: s.customer_details?.email ?? s.customer_email ?? null,
    subscriptionExternalId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null,
    amountTotalCents: s.amount_total,
    currency: s.currency,
    reference: s.metadata ?? {},
  };
}

function normalizeStatus(status: Stripe.Subscription.Status): NormalizedSubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    default:
      return "incomplete";
  }
}
