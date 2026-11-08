import "server-only";
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
  ProviderNotConfiguredError,
  ValidationError,
} from "@/lib/vigil/auth/errors";
import {
  button,
  escapeHtml,
  layout,
  sendEmail,
  staffNotificationAddress,
} from "@/lib/vigil/email";
import {
  billingPeriodByKey,
  type BillingPeriodKey,
} from "@/lib/vigil/billing-periods";
import { slugify } from "@/lib/vigil/format";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type {
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
  if (promotion && build.currency !== planPrice.currency)
    throw new ValidationError("The build and plan currencies must match.");
  let orderMetadata: Record<string, unknown> = {};
  if (req.existingOrderId) {
    const { error: ownershipError } = await admin.rpc("claim_checkout_order", {
      p_order: req.existingOrderId,
      p_buyer: req.buyerUserId,
      p_token: req.checkoutToken ?? "",
    });
    if (ownershipError)
      throw new ValidationError(
        "This order belongs to another account, is expired, or is no longer awaiting payment.",
      );
    const { data: existing, error: metadataError } = await admin
      .from("orders")
      .select("metadata")
      .eq("id", req.existingOrderId)
      .maybeSingle();
    if (metadataError) throw metadataError;
    orderMetadata =
      (existing?.metadata as Record<string, unknown> | null) ?? {};
  }
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
  let orderId = req.existingOrderId ?? null;
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
  if (orderId) {
    const { data: updatedOrder, error } = await admin
      .from("orders")
      .update(snapshot)
      .eq("id", orderId)
      .eq("buyer_user_id", req.buyerUserId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!updatedOrder)
      throw new ValidationError(
        "This order changed. Refresh before continuing.",
      );
  } else {
    const { data, error } = await admin
      .from("orders")
      .insert({
        ...snapshot,
        metadata: orderMetadata as NonNullable<Json>,
        created_by: req.createdBy ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    orderId = data.id;
  }

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

  let session: { url: string; externalId: string };
  try {
    session = await provider.createCheckoutSession({
      mode: "subscription",
      lineItems,
      customerEmail: email,
      successUrl: `${req.appUrl}/checkout/success?order=${orderId}`,
      cancelUrl: `${req.appUrl}/checkout/${await tokenFor(admin, orderId)}?canceled=1`,
      reference: {
        order_id: orderId,
        plan_code: plan.code,
        billing_period: period.key,
        project_kind: req.projectKind,
        template_slug: req.templateSlug ?? "",
      },
      collectTax: process.env.STRIPE_TAX === "true",
      // Stripe's "Add promotion code" field. Codes only exist if staff create
      // them (friends and family, a live test); CHECKOUT_PROMOTION_CODES=false hides it.
      allowPromotionCodes:
        !orderMetadata.creator_promotion &&
        process.env.CHECKOUT_PROMOTION_CODES !== "false",
    });
  } catch (err) {
    // A self-serve order with no payment page is dead; staff links stay pending for a retry.
    if (!req.existingOrderId) {
      await admin
        .from("orders")
        .update({
          status: "failed",
          error: {
            message: err instanceof Error ? err.message : String(err),
          } as unknown as NonNullable<Json>,
        })
        .eq("id", orderId)
        .eq("status", "pending");
    }
    throw err;
  }

  await upsertProviderLink(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "checkout_session",
    externalId: session.externalId,
    entityType: "order",
    entityId: orderId,
  });
  await admin
    .from("orders")
    .update({
      metadata: {
        ...orderMetadata,
        checkout_session: session.externalId,
      } as unknown as NonNullable<Json>,
    })
    .eq("id", orderId);

  return { orderId, url: session.url };
}

async function tokenFor(admin: DbClient, orderId: string): Promise<string> {
  const { data, error } = await admin
    .from("orders")
    .select("checkout_token")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data.checkout_token;
}

/** Mark an order paid from a completed checkout. Idempotent. */
export async function completeCheckout(
  admin: DbClient,
  orderId: string,
  checkout: BillingCheckoutSnapshot,
  provider: BillingProvider = getBillingProvider(),
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

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      email: order.buyer_user_id
        ? order.email
        : (checkout.customerEmail?.toLowerCase() ?? order.email),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (updateError) throw updateError;

  const providerName = providerEnum(provider.name);
  if (checkout.customerExternalId) {
    // Attach the customer to the order for now; provisioning re-links it to the organization.
    await upsertProviderLink(admin, {
      provider: providerName,
      resourceKind: "customer",
      externalId: checkout.customerExternalId,
      entityType: "order",
      entityId: orderId,
    });
  }
  return updated;
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

  // One database transaction owns organization, exact buyer membership, project and website identity.
  const { data: allocation, error: allocationError } = await admin.rpc(
    "allocate_order_project",
    {
      p_order_id: orderId,
      p_slug: slugify(order.business_name) || "customer",
      p_provider: providerName,
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
    const sessionRef = (order.metadata as { checkout_session?: string } | null)
      ?.checkout_session;
    let linked: string | null = null;
    if (sessionRef) {
      const checkout = await provider
        .getCheckoutSession(sessionRef)
        .catch(() => null);
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
    await admin
      .from("orders")
      .update({ subscription_id: subscriptionId })
      .eq("id", orderId);
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
    !!order.buyer_user_id,
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
  await sendEmail({
    to: staffNotificationAddress(),
    subject: `New customer: ${order.business_name}`,
    text: `${order.business_name} (${order.email}) purchased a ${order.project_kind} site${order.template_slug ? ` on the ${order.template_slug} template` : ""}. Review in ${appUrl}/admin/organizations/${organizationId}`,
    html: layout(
      `New customer: ${order.business_name}`,
      `<p>${escapeHtml(order.email)} purchased a ${escapeHtml(order.project_kind)} site${order.template_slug ? ` on the <b>${escapeHtml(order.template_slug)}</b> template` : ""}.</p>${button(`${appUrl}/admin/organizations/${organizationId}`, "Open in Vigil Admin")}`,
    ),
  }).catch(() => undefined);

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
  accountOwned = false,
): Promise<{ sent: boolean; error?: string }> {
  const link = accountOwned
    ? null
    : await signInLinkFor(email, appUrl).catch(() => null);
  const cta = accountOwned
    ? `${appUrl}/dashboard/onboarding`
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
