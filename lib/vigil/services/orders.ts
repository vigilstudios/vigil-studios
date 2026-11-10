import "server-only";
import { randomUUID } from "node:crypto";
import { ensureDesignWorkspace } from "@/lib/vigil/professional/workspace";
import {
  CREATOR_CAMPAIGN,
  creatorCodeOffer,
  matchesCreatorPromoCode,
} from "@/lib/creator-campaign";

import { createAdminClient } from "@/lib/supabase/admin";
import { generatedConfirmationUrl } from "@/lib/vigil/auth/generated-link";
import {
  NotFoundError,
  ProviderError,
  ProviderNotConfiguredError,
  ValidationError,
} from "@/lib/vigil/auth/errors";
import {
  button,
  escapeHtml,
  layout,
  sendEmail,
} from "@/lib/vigil/email";
import {
  billingPeriodByKey,
  type BillingPeriodKey,
} from "@/lib/vigil/billing-periods";
import { slugify } from "@/lib/vigil/format";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type {
  BillingCheckoutInput,
  BillingCheckoutSnapshot,
  BillingProvider,
  CheckoutLineItem,
} from "@/lib/vigil/providers/types";
import type { DbClient, Tables } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { ONBOARDING_WELCOME_HREF } from "@/lib/vigil/onboarding/constants";
import { buildPriceExternalId, planPriceExternalId } from "./catalog";
import { applySubscriptionSnapshot } from "./billing";
import { providerEnum, upsertProviderLink } from "./provider-links";

export type Order = Tables<"orders">;

/**
 * Orders: from a purchase intent to a working account.
 *
 *   startCheckout      order row (pending) -> provider checkout URL
 *   completeCheckout   webhook or success page -> order paid
 *   provisionOrder     paid -> organization, invite, project, website,
 *                      subscription, welcome email (idempotent)
 *
 * The server verifies the buyer before checkout. Service-role operations
 * keep payment events independent of a browser session.
 */

export type CheckoutRequest = {
  email: string;
  /** Verified account, supplied by the server session. */
  buyerUserId: string;
  checkoutToken?: string;
  requestId?: string;
  serviceAgreementUrl?: string;
  contactName?: string | null;
  businessName: string;
  projectKind: "express" | "professional" | "custom";
  templateSlug?: string | null;
  planCode: string;
  /** How the plan is paid for; defaults to monthly. */
  billingPeriod?: BillingPeriodKey;
  /** Explicit customer redemption; campaign/UTM attribution never grants a discount. */
  promotionCode?: string | null;
  /** Staff-created links carry an existing order; self-serve creates one. */
  existingOrderId?: string | null;
  /** Staff-quoted build amount (custom builds); overrides the catalog amount. */
  buildAmountOverrideCents?: number | null;
  createdBy?: string | null;
  appUrl: string;
};

export async function startCheckout(
  admin: DbClient,
  req: CheckoutRequest,
  provider: BillingProvider = getBillingProvider(),
): Promise<{ orderId: string; url: string }> {
  if (!req.buyerUserId)
    throw new ValidationError("Sign in before starting checkout.");
  if (req.existingOrderId && req.promotionCode?.trim())
    throw new ValidationError("This promo code is not available for this order.");
  let existing: Order | null = null;
  const lookupId = req.existingOrderId ?? req.requestId;
  if (req.existingOrderId) {
    const { error } = await admin.rpc("claim_checkout_order", {
      p_order: req.existingOrderId,
      p_buyer: req.buyerUserId,
      p_token: req.checkoutToken ?? "",
    });
    if (error)
      throw new ValidationError("This order belongs to another account, is expired, or is no longer awaiting payment.");
  }
  if (lookupId) {
    existing = await getBuyerOrder(admin, lookupId, req.buyerUserId);
    if (existing) {
      const resumed = await resumeCheckout(admin, existing, provider, req.appUrl);
      if (resumed) return resumed;
      if (!req.existingOrderId)
        return { orderId: existing.id, url: `${req.appUrl}/checkout/${existing.checkout_token}` };
    }
  }

  const { data: plan, error: planError } = await admin
    .from("plans")
    .select("id, code, name")
    .eq("code", req.planCode)
    .eq("is_active", true)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new ValidationError("Choose a Vigil plan.");

  const period = billingPeriodByKey(req.billingPeriod ?? "month");
  if (!period) throw new ValidationError("Choose how you want to pay.");
  const { data: planPrice, error: ppError } = await admin
    .from("plan_prices")
    .select("id, amount_cents, currency, interval, interval_count")
    .eq("plan_id", plan.id)
    .eq("is_active", true)
    .eq("interval", period.interval)
    .eq("interval_count", period.intervalCount)
    .maybeSingle();
  if (ppError) throw ppError;
  if (!planPrice || planPrice.amount_cents === null)
    throw new ValidationError(
      `${plan.name} does not have an approved ${period.label.toLowerCase()} price yet.`,
    );

  const { data: build, error: buildError } = await admin
    .from("build_prices")
    .select("id, amount_cents, currency, name")
    .eq("kind", req.projectKind)
    .eq("is_active", true)
    .maybeSingle();
  if (buildError) throw buildError;
  if (!build)
    throw new ValidationError(
      "That kind of build is not available for online checkout.",
    );

  // Only an explicitly redeemed code on a new self-service build grants the offer.
  // Token retries and staff quotes keep their trusted amount and existing metadata.
  const code = req.promotionCode?.trim() ?? "";
  const eligible =
    !req.existingOrderId &&
    req.buildAmountOverrideCents == null &&
    ["express", "professional"].includes(req.projectKind) &&
    build.amount_cents !== null &&
    build.amount_cents > 0;
  if (code && (!eligible || !matchesCreatorPromoCode(code)))
    throw new ValidationError(
      "This promo code is not available for this order.",
      {
        promotion_code: [
          "Check your code. It applies to new Express and Professional builds only.",
        ],
      },
    );
  const offer = eligible
    ? creatorCodeOffer(req.projectKind, build.amount_cents, code)
    : null;
  const promotion = offer?.percentOff
    ? {
        campaign: CREATOR_CAMPAIGN.id,
        code: CREATOR_CAMPAIGN.promotion.code,
        percent_off: offer.percentOff,
        original_build_amount_cents: offer.originalAmountCents,
        discount_amount_cents: offer.discountCents,
      }
    : null;
  const buildAmount =
    offer?.amountCents ?? req.buildAmountOverrideCents ?? build.amount_cents;
  if (buildAmount === null)
    throw new ValidationError("The website build needs an approved price before checkout.");
  if (build.currency !== planPrice.currency)
    throw new ValidationError("The build and plan currencies must match.");
  const orderMetadata = { ...checkoutMetadata(existing) };
  if (promotion) orderMetadata.creator_promotion = promotion;
  const useCatalogBuild =
    req.buildAmountOverrideCents == null && build.amount_cents !== null;
  const planExternal = await planPriceExternalId(admin, planPrice.id, provider);
  const buildExternal = useCatalogBuild
    ? await buildPriceExternalId(admin, build.id, provider)
    : null;
  if (!planExternal || (useCatalogBuild && !buildExternal)) {
    throw new ProviderNotConfiguredError("Billing prices have not been synced");
  }

  const email = req.email.trim().toLowerCase();
  const orderId = existing?.id ?? req.requestId ?? randomUUID();
  const token = existing?.checkout_token ?? randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const snapshot = {
    email,
    buyer_user_id: req.buyerUserId,
    contact_name: req.contactName ?? null,
    business_name: req.businessName.trim(),
    project_kind: req.projectKind,
    template_slug: req.templateSlug ?? null,
    plan_id: plan.id,
    plan_price_id: planPrice.id,
    build_price_id: build.id,
    build_amount_cents: buildAmount,
    plan_amount_cents: planPrice.amount_cents,
    currency: planPrice.currency,
  };
  const lineItems: CheckoutLineItem[] = [{ priceExternalId: planExternal }];
  if (buildExternal && !promotion)
    lineItems.push({ priceExternalId: buildExternal });
  else if (buildAmount !== null && buildAmount > 0)
    lineItems.push({
      adHoc: {
        name: `${build.name}: ${req.businessName.trim()}`,
        description: promotion
          ? `${promotion.percent_off}% creator promotion applied — one-time website build`
          : "One-time website build",
        amountCents: buildAmount,
        currency: planPrice.currency,
      },
    });

  const checkoutInput: BillingCheckoutInput = {
    mode: "subscription",
    lineItems,
    customerEmail: email,
    successUrl: `${req.appUrl}/checkout/success?order=${orderId}`,
    cancelUrl: `${req.appUrl}/checkout/${token}?canceled=1`,
    reference: {
      order_id: orderId,
      plan_code: plan.code,
      billing_period: period.key,
      project_kind: req.projectKind,
      template_slug: req.templateSlug ?? "",
    },
    collectTax: process.env.STRIPE_TAX === "true",
    allowPromotionCodes: !orderMetadata.creator_promotion && process.env.CHECKOUT_PROMOTION_CODES !== "false",
    idempotencyKey: `vigil-checkout:${orderId}:${randomUUID()}`,
  };
  delete orderMetadata.checkout_session;
  const startedAt = new Date().toISOString();
  orderMetadata.checkout_attempt = { input: checkoutInput, startedAt };
  if (req.serviceAgreementUrl) orderMetadata.service_agreement = { href: req.serviceAgreementUrl, accepted_at: startedAt };
  const metadata = orderMetadata as NonNullable<Json>;
  const written = existing
    ? await admin.from("orders")
      .update({ ...snapshot, metadata })
      .eq("id", orderId)
      .eq("buyer_user_id", req.buyerUserId)
      .eq("status", "pending")
      .eq("updated_at", existing.updated_at)
      .select("id").maybeSingle()
    : await admin.from("orders")
      .insert({ ...snapshot, id: orderId, checkout_token: token, metadata, created_by: req.createdBy ?? null })
      .select("id").single();
  if (written.error && written.error.code !== "23505") throw written.error;
  if (!written.data) {
    // A competing submit already persisted its exact commercial snapshot.
    const current = await getBuyerOrder(admin, orderId, req.buyerUserId);
    const resumed = current && await resumeCheckout(admin, current, provider, req.appUrl);
    if (resumed) return resumed;
    throw new ValidationError("The order changed. Open your purchases to try again.");
  }
  return openCheckout(admin, orderId, orderMetadata, checkoutInput, provider);
}

type CheckoutMetadata = Record<string, unknown> & {
  checkout_session?: string;
  checkout_attempt?: { input: BillingCheckoutInput; startedAt: string };
};

function checkoutMetadata(order: Pick<Order, "metadata"> | null): CheckoutMetadata {
  return (order?.metadata as CheckoutMetadata | null) ?? {};
}

export function hasCheckoutAttempt(metadata: Json): boolean {
  const attempt = metadata as CheckoutMetadata | null;
  return Boolean(attempt?.checkout_session || attempt?.checkout_attempt);
}

async function getBuyerOrder(admin: DbClient, id: string, buyer: string) {
  const { data, error } = await admin.from("orders").select("*")
    .eq("id", id).eq("buyer_user_id", buyer).maybeSingle();
  if (error) throw error;
  return data;
}

async function resumeCheckout(admin: DbClient, order: Order, provider: BillingProvider, appUrl: string) {
  const orderId = order.id;
  const successUrl = `${appUrl}/checkout/success?order=${orderId}`;
  if (order.status !== "pending") return { orderId, url: successUrl };
  const meta = checkoutMetadata(order);
  if (meta.checkout_session) {
    const session = await provider.getCheckoutSession(meta.checkout_session);
    if (!session) throw new ValidationError("We couldn’t check the last payment attempt. Try again in a moment.");
    if (session.status === "open" && session.url) return { orderId, url: session.url };
    if (session.status === "complete") return { orderId, url: successUrl };
    if (session.status !== "expired") throw new ValidationError("We couldn’t reopen this payment page. Please contact Vigil.");
  } else if (meta.checkout_attempt) {
    const { input, startedAt } = meta.checkout_attempt;
    // Stripe may prune idempotency keys after 24 hours. Ambiguous older attempts need review.
    if (Date.now() - Date.parse(startedAt) >= 23 * 3_600_000)
      throw new ValidationError("This payment attempt needs a review. Please contact Vigil.");
    return openCheckout(admin, orderId, meta, input, provider);
  }
  return null;
}

async function openCheckout(admin: DbClient, orderId: string, meta: CheckoutMetadata, input: BillingCheckoutInput, provider: BillingProvider) {
  const session = await provider.createCheckoutSession(input);
  await upsertProviderLink(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "checkout_session",
    externalId: session.externalId,
    entityType: "order",
    entityId: orderId,
  });
  const { error } = await admin.from("orders")
    .update({ metadata: { ...meta, checkout_session: session.externalId } as NonNullable<Json> })
    .eq("id", orderId)
    .eq("status", "pending");
  if (error) throw error;
  return { orderId, url: session.url };
}

/** Mark an order paid from a completed checkout. Idempotent. */
export async function completeCheckout(
  admin: DbClient,
  orderId: string,
  checkout: BillingCheckoutSnapshot,
): Promise<Order> {
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new NotFoundError(`Order ${orderId} not found.`);
  if (
    checkout.paymentStatus !== "paid" &&
    checkout.paymentStatus !== "no_payment_required"
  )
    return order;
  if (order.status !== "pending") return order;
  const metadata = checkoutMetadata(order);
  if (
    checkout.status !== "complete" ||
    (checkout.reference.order_id && checkout.reference.order_id !== orderId) ||
    (metadata.checkout_session && metadata.checkout_session !== checkout.externalId) ||
    (checkout.currency && checkout.currency !== order.currency)
  ) throw new ValidationError("This payment does not match the order.");

  // Persist the winning session together with the paid transition. A webhook
  // may arrive before the request that opened Checkout finishes its own write.
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      metadata: { ...metadata, checkout_session: checkout.externalId } as NonNullable<Json>,
      email: order.buyer_user_id
        ? order.email
        : (checkout.customerEmail?.toLowerCase() ?? order.email),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (updateError) throw updateError;
  if (updated) return updated;
  const { data: latest, error: reloadError } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (reloadError) throw reloadError;
  return latest;
}

/**
 * Turn a paid order into a working account. Every step checks for its own
 * prior result, so a retried job or a second webhook delivery is harmless.
 */
export async function provisionOrder(
  admin: DbClient,
  orderId: string,
  provider: BillingProvider = getBillingProvider(),
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co",
): Promise<{
  organizationId: string;
  websiteId: string;
  projectKind: CheckoutRequest["projectKind"];
  alreadyProvisioned: boolean;
}> {
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new NotFoundError(`Order ${orderId} not found.`);
  if (
    order.status === "provisioned" &&
    order.organization_id &&
    order.project_id
  ) {
    const { data: provisionedSite, error: siteLookupError } = await admin
      .from("websites")
      .select("id")
      .eq("project_id", order.project_id)
      .single();
    if (siteLookupError) throw siteLookupError;
    if (order.project_kind === "professional")
      await ensureDesignWorkspace(admin, order.project_id);
    return {
      organizationId: order.organization_id,
      websiteId: provisionedSite.id,
      projectKind: order.project_kind,
      alreadyProvisioned: true,
    };
  }
  if (order.status !== "paid")
    throw new ValidationError(`Order ${orderId} is ${order.status}, not paid.`);

  const providerName = providerEnum(provider.name);

  const sessionRef = (order.metadata as { checkout_session?: string } | null)
    ?.checkout_session;
  const checkout = sessionRef
    ? await provider.getCheckoutSession(sessionRef).catch(() => null)
    : null;
  if (sessionRef && !checkout)
    throw new ProviderError(
      provider.name,
      order.buyer_user_id ? "Could not retrieve the paid checkout." : "Could not verify the legacy checkout's customer identity.",
      { retryable: true },
    );

  // One database transaction owns organization, exact buyer membership, project and website identity.
  const { data: allocation, error: allocationError } = await admin.rpc(
    "allocate_order_project",
    {
      p_order_id: orderId,
      p_slug: slugify(order.business_name) || "customer",
      p_provider: providerName,
      p_customer_ref: checkout?.customerExternalId ?? undefined,
    },
  );
  if (allocationError) throw allocationError;
  const allocated = allocation as {
    organizationId: string;
    projectId: string;
    websiteId: string;
  } | null;
  if (
    !allocated?.organizationId ||
    !allocated.projectId ||
    !allocated.websiteId
  )
    throw new ValidationError("The purchase workspace could not be prepared.");
  const organizationId = allocated.organizationId,
    projectId = allocated.projectId,
    site = { id: allocated.websiteId };
  if (order.project_kind === "professional")
    await ensureDesignWorkspace(admin, projectId);

  // 4. Subscription: from the provider's checkout session when we have one,
  //    otherwise a manual active row (staff-created orders paid off-platform).
  let subscriptionId = order.subscription_id;
  if (!subscriptionId) {
    let linked: string | null = null;
    if (sessionRef) {
      if (checkout?.customerExternalId) {
        await upsertProviderLink(admin, {
          provider: providerName,
          resourceKind: "customer",
          externalId: checkout.customerExternalId,
          entityType: "organization",
          entityId: organizationId,
        });
      }
      if (checkout?.subscriptionExternalId) {
        const snapshot = await provider.getSubscription(
          checkout.subscriptionExternalId,
        );
        if (snapshot) {
          // Ensure the price link points at the plan price the buyer chose so attribution works.
          if (snapshot.priceExternalId && order.plan_price_id) {
            await upsertProviderLink(admin, {
              provider: providerName,
              resourceKind: "price",
              externalId: snapshot.priceExternalId,
              entityType: "plan_price",
              entityId: order.plan_price_id,
              metadata: provider.mode ? { mode: provider.mode } : undefined,
            });
          }
          const applied = await applySubscriptionSnapshot(
            admin,
            snapshot,
            provider,
          );
          linked = applied.subscriptionId;
        }
      }
    }
    if (!linked && sessionRef && provider.name === "stripe")
      throw new ProviderError(provider.name, "The paid Stripe subscription could not be linked yet.", { retryable: true });
    if (!linked && order.plan_id) {
      const { data: manual, error: subError } = await admin
        .from("subscriptions")
        .insert({
          organization_id: organizationId,
          plan_id: order.plan_id,
          plan_price_id: order.plan_price_id,
          status: "active",
          current_period_start: new Date().toISOString(),
          metadata: { source: `order:${orderId}` },
        })
        .select("id")
        .single();
      if (subError) throw subError;
      linked = manual.id;
    }
    subscriptionId = linked;
    const { error: linkError } = await admin.from("orders")
      .update({ subscription_id: subscriptionId }).eq("id", orderId);
    if (linkError) throw linkError;
  }

  // 5. Done
  const { error: doneError } = await admin
    .from("orders")
    .update({ status: "provisioned", provisioned_at: new Date().toISOString() })
    .eq("id", orderId);
  if (doneError) throw doneError;

  await admin.rpc("log_audit_event", {
    p_action: "order.provisioned",
    p_entity_type: "order",
    p_entity_id: orderId,
    p_org: organizationId,
    p_after: {
      business_name: order.business_name,
      plan_id: order.plan_id,
      project_kind: order.project_kind,
    },
  });

  // 6. Welcome email with a sign-in link. Failures here never undo the
  //    account; the outcome is kept on the order so the success page can
  //    offer the sign-in page instead of a promise that will not arrive.
  const welcome = await sendWelcome(
    order.email,
    order.business_name,
    appUrl,
    order.buyer_user_id ? orderId : false,
  ).catch((err) => ({
    sent: false,
    error: err instanceof Error ? err.message : String(err),
  }));
  await admin
    .from("orders")
    .update({
      metadata: {
        ...(order.metadata as Record<string, unknown> | null),
        welcome_email: {
          sent: welcome.sent,
          error: welcome.error ?? null,
          at: new Date().toISOString(),
        },
      } as unknown as NonNullable<Json>,
    })
    .eq("id", orderId);

  return {
    organizationId,
    websiteId: site.id,
    projectKind: order.project_kind,
    alreadyProvisioned: false,
  };
}

/**
 * A sign-in link minted server-side: new addresses get an invite token,
 * existing accounts a magic link. Both land on /auth/confirm.
 */
export async function signInLinkFor(
  email: string,
  appUrl: string,
): Promise<string | null> {
  const auth = createAdminClient().auth.admin;
  const redirectTo = `${appUrl}/auth/confirm`;
  let res = await auth.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (res.error) {
    res = await auth.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });
  }
  if (res.error || !res.data?.properties?.hashed_token) return null;
  return generatedConfirmationUrl(
    appUrl,
    res.data.properties,
    ONBOARDING_WELCOME_HREF,
  );
}

export async function sendWelcome(
  email: string,
  businessName: string,
  appUrl: string,
  accountOwned: string | false = false,
): Promise<{ sent: boolean; error?: string }> {
  const link = accountOwned
    ? null
    : await signInLinkFor(email, appUrl).catch(() => null);
  const cta = accountOwned
    ? `${appUrl}/checkout/success?order=${accountOwned}`
    : (link ?? `${appUrl}/login`);
  const signInNote = accountOwned
    ? "Use the Vigil account you purchased with."
    : "The link signs you in directly; no password needed.";
  return sendEmail({
    to: email,
    subject: `Welcome to Vigil: let's build ${businessName}`,
    text: `Thanks for choosing Vigil Studios. Your account is ready.\n\nOpen your workspace to tell us about ${businessName} so we can start building:\n${cta}\n\n${signInNote}`,
    html: layout(
      `Welcome to Vigil`,
      `<p>Thanks for choosing Vigil Studios. Your account for <b>${escapeHtml(businessName)}</b> is ready.</p><p>Next, tell us about your business so we can start building. It takes about ten minutes and you can save as you go.</p>${button(cta, "Start your onboarding")}<p style="color:#666;font-size:13px">${escapeHtml(signInNote)}</p>`,
    ),
  });
}
