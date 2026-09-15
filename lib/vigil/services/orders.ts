import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { NotFoundError, ProviderNotConfiguredError, ValidationError } from "@/lib/vigil/auth/errors";
import { button, escapeHtml, layout, sendEmail, staffNotificationAddress } from "@/lib/vigil/email";
import { billingPeriodByKey, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { slugify } from "@/lib/vigil/format";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingCheckoutSnapshot, BillingProvider, CheckoutLineItem } from "@/lib/vigil/providers/types";
import type { DbClient, Tables } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
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
 * All of it runs with the service-role client: the buyer has no account
 * yet, and the webhook has no session.
 */

export type CheckoutRequest = {
  email: string;
  contactName?: string | null;
  businessName: string;
  projectKind: "express" | "professional" | "custom";
  templateSlug?: string | null;
  planCode: string;
  /** How the plan is paid for; defaults to monthly. */
  billingPeriod?: BillingPeriodKey;
  /** Staff-created links carry an existing order; self-serve creates one. */
  existingOrderId?: string | null;
  /** Staff-quoted build amount (custom builds); overrides the catalog amount. */
  buildAmountOverrideCents?: number | null;
  createdBy?: string | null;
  appUrl: string;
};

export async function startCheckout(admin: DbClient, req: CheckoutRequest, provider: BillingProvider = getBillingProvider()): Promise<{ orderId: string; url: string }> {
  const { data: plan, error: planError } = await admin.from("plans").select("id, code, name").eq("code", req.planCode).eq("is_active", true).maybeSingle();
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
  if (!planPrice || planPrice.amount_cents === null) throw new ValidationError(`${plan.name} does not have an approved ${period.label.toLowerCase()} price yet.`);

  const { data: build, error: buildError } = await admin.from("build_prices").select("id, amount_cents, currency, name").eq("kind", req.projectKind).eq("is_active", true).maybeSingle();
  if (buildError) throw buildError;
  if (!build) throw new ValidationError("That kind of build is not available for online checkout.");

  const buildAmount = req.buildAmountOverrideCents ?? build.amount_cents;
  const useCatalogBuild = req.buildAmountOverrideCents == null && build.amount_cents !== null;
  const planExternal = await planPriceExternalId(admin, planPrice.id, provider);
  const buildExternal = useCatalogBuild ? await buildPriceExternalId(admin, build.id, provider) : null;
  if (!planExternal || (useCatalogBuild && !buildExternal)) {
    throw new ProviderNotConfiguredError("Billing prices have not been synced");
  }

  const email = req.email.trim().toLowerCase();
  let orderId = req.existingOrderId ?? null;
  const snapshot = {
    email,
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
    const { error } = await admin.from("orders").update(snapshot).eq("id", orderId).eq("status", "pending");
    if (error) throw error;
  } else {
    const { data, error } = await admin.from("orders").insert({ ...snapshot, created_by: req.createdBy ?? null }).select("id").single();
    if (error) throw error;
    orderId = data.id;
  }

  const lineItems: CheckoutLineItem[] = [{ priceExternalId: planExternal }];
  if (buildExternal) lineItems.push({ priceExternalId: buildExternal });
  else if (buildAmount !== null && buildAmount > 0) lineItems.push({ adHoc: { name: `${build.name} — ${req.businessName.trim()}`, description: "One-time website build", amountCents: buildAmount, currency: planPrice.currency } });

  let session: { url: string; externalId: string };
  try {
    session = await provider.createCheckoutSession({
    mode: "subscription",
    lineItems,
    customerEmail: email,
    successUrl: `${req.appUrl}/checkout/success?order=${orderId}`,
    cancelUrl: `${req.appUrl}/checkout/${await tokenFor(admin, orderId)}?canceled=1`,
    reference: { order_id: orderId, plan_code: plan.code, billing_period: period.key, project_kind: req.projectKind, template_slug: req.templateSlug ?? "" },
    collectTax: process.env.STRIPE_TAX === "true",
    });
  } catch (err) {
    // A self-serve order with no payment page is dead; staff links stay pending for a retry.
    if (!req.existingOrderId) {
      await admin.from("orders").update({ status: "failed", error: { message: err instanceof Error ? err.message : String(err) } as unknown as Json }).eq("id", orderId).eq("status", "pending");
    }
    throw err;
  }

  await upsertProviderLink(admin, { provider: providerEnum(provider.name), resourceKind: "checkout_session", externalId: session.externalId, entityType: "order", entityId: orderId });
  await admin.from("orders").update({ metadata: { checkout_session: session.externalId } as unknown as Json }).eq("id", orderId);

  return { orderId, url: session.url };
}

async function tokenFor(admin: DbClient, orderId: string): Promise<string> {
  const { data, error } = await admin.from("orders").select("checkout_token").eq("id", orderId).single();
  if (error) throw error;
  return data.checkout_token;
}

/** Mark an order paid from a completed checkout. Idempotent. */
export async function completeCheckout(admin: DbClient, orderId: string, checkout: BillingCheckoutSnapshot, provider: BillingProvider = getBillingProvider()): Promise<Order> {
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) throw new NotFoundError(`Order ${orderId} not found.`);
  if (checkout.paymentStatus !== "paid" && checkout.paymentStatus !== "no_payment_required") return order;
  if (order.status !== "pending") return order;

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), email: checkout.customerEmail?.toLowerCase() ?? order.email })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .single();
  if (updateError) throw updateError;

  const providerName = providerEnum(provider.name);
  if (checkout.customerExternalId) {
    // Attach the customer to the order for now; provisioning re-links it to the organization.
    await upsertProviderLink(admin, { provider: providerName, resourceKind: "customer", externalId: checkout.customerExternalId, entityType: "order", entityId: orderId });
  }
  return updated;
}

/**
 * Turn a paid order into a working account. Every step checks for its own
 * prior result, so a retried job or a second webhook delivery is harmless.
 */
export async function provisionOrder(admin: DbClient, orderId: string, provider: BillingProvider = getBillingProvider(), appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co"): Promise<{ organizationId: string; alreadyProvisioned: boolean }> {
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) throw new NotFoundError(`Order ${orderId} not found.`);
  if (order.status === "provisioned" && order.organization_id) return { organizationId: order.organization_id, alreadyProvisioned: true };
  if (order.status !== "paid") throw new ValidationError(`Order ${orderId} is ${order.status}, not paid.`);

  const providerName = providerEnum(provider.name);

  // 1. Organization
  let organizationId = order.organization_id;
  if (!organizationId) {
    const slug = await uniqueSlug(admin, slugify(order.business_name) || "customer");
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: order.business_name, slug, billing_email: order.email })
      .select("id")
      .single();
    if (orgError) throw orgError;
    organizationId = org.id;
    await admin.from("orders").update({ organization_id: organizationId }).eq("id", orderId);
  }

  // 2. Owner invitation (accepted automatically on first sign-in)
  const { data: invite } = await admin.from("organization_invites").select("id").eq("organization_id", organizationId).eq("email", order.email).is("revoked_at", null).maybeSingle();
  if (!invite) {
    const { error: inviteError } = await admin.from("organization_invites").insert({ organization_id: organizationId, email: order.email, role: "owner", expires_at: new Date(Date.now() + 90 * 86_400_000).toISOString() });
    if (inviteError) throw inviteError;
  }

  // 3. Project + website
  let projectId = order.project_id;
  if (!projectId) {
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({ organization_id: organizationId, name: `${order.business_name} website`, kind: order.project_kind, status: "intake", template_slug: order.template_slug, source_ref: `order:${orderId}` })
      .select("id")
      .single();
    if (projectError) throw projectError;
    projectId = project.id;
    await admin.from("orders").update({ project_id: projectId }).eq("id", orderId);
  }
  const { data: site } = await admin.from("websites").select("id").eq("project_id", projectId).maybeSingle();
  if (!site) {
    const { error: siteError } = await admin.from("websites").insert({ organization_id: organizationId, project_id: projectId, name: `${order.business_name} website`, template_slug: order.template_slug });
    if (siteError) throw siteError;
  }

  // 4. Subscription: from the provider's checkout session when we have one,
  //    otherwise a manual active row (staff-created orders paid off-platform).
  let subscriptionId = order.subscription_id;
  if (!subscriptionId) {
    const sessionRef = (order.metadata as { checkout_session?: string } | null)?.checkout_session;
    let linked: string | null = null;
    if (sessionRef) {
      const checkout = await provider.getCheckoutSession(sessionRef).catch(() => null);
      if (checkout?.customerExternalId) {
        await upsertProviderLink(admin, { provider: providerName, resourceKind: "customer", externalId: checkout.customerExternalId, entityType: "organization", entityId: organizationId });
      }
      if (checkout?.subscriptionExternalId) {
        const snapshot = await provider.getSubscription(checkout.subscriptionExternalId);
        if (snapshot) {
          // Ensure the price link points at the plan price the buyer chose so attribution works.
          if (snapshot.priceExternalId && order.plan_price_id) {
            await upsertProviderLink(admin, { provider: providerName, resourceKind: "price", externalId: snapshot.priceExternalId, entityType: "plan_price", entityId: order.plan_price_id });
          }
          const applied = await applySubscriptionSnapshot(admin, snapshot, provider);
          linked = applied.subscriptionId;
        }
      }
    }
    if (!linked && order.plan_id) {
      const { data: manual, error: subError } = await admin
        .from("subscriptions")
        .insert({ organization_id: organizationId, plan_id: order.plan_id, plan_price_id: order.plan_price_id, status: "active", current_period_start: new Date().toISOString(), metadata: { source: `order:${orderId}` } })
        .select("id")
        .single();
      if (subError) throw subError;
      linked = manual.id;
    }
    subscriptionId = linked;
    await admin.from("orders").update({ subscription_id: subscriptionId }).eq("id", orderId);
  }

  // 5. Done
  const { error: doneError } = await admin.from("orders").update({ status: "provisioned", provisioned_at: new Date().toISOString() }).eq("id", orderId);
  if (doneError) throw doneError;

  await admin.rpc("log_audit_event", {
    p_action: "order.provisioned",
    p_entity_type: "order",
    p_entity_id: orderId,
    p_org: organizationId,
    p_after: { business_name: order.business_name, plan_id: order.plan_id, project_kind: order.project_kind },
  });

  // 6. Welcome email with a sign-in link. Failures here never undo the
  //    account; the outcome is kept on the order so the success page can
  //    offer the sign-in page instead of a promise that will not arrive.
  const welcome = await sendWelcome(order.email, order.business_name, appUrl).catch((err) => ({ sent: false, error: err instanceof Error ? err.message : String(err) }));
  await admin.from("orders").update({ metadata: { ...(order.metadata as Record<string, unknown> | null), welcome_email: { sent: welcome.sent, error: welcome.error ?? null, at: new Date().toISOString() } } as unknown as Json }).eq("id", orderId);
  await sendEmail({
    to: staffNotificationAddress(),
    subject: `New customer: ${order.business_name}`,
    text: `${order.business_name} (${order.email}) purchased a ${order.project_kind} site${order.template_slug ? ` on the ${order.template_slug} template` : ""}. Review in ${appUrl}/admin/organizations/${organizationId}`,
    html: layout(`New customer: ${order.business_name}`, `<p>${escapeHtml(order.email)} purchased a ${escapeHtml(order.project_kind)} site${order.template_slug ? ` on the <b>${escapeHtml(order.template_slug)}</b> template` : ""}.</p>${button(`${appUrl}/admin/organizations/${organizationId}`, "Open in Vigil Admin")}`),
  }).catch(() => undefined);

  return { organizationId, alreadyProvisioned: false };
}

async function uniqueSlug(admin: DbClient, base: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from("organizations").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * A sign-in link minted server-side: new addresses get an invite token,
 * existing accounts a magic link. Both land on /auth/confirm.
 */
export async function signInLinkFor(email: string, appUrl: string): Promise<string | null> {
  const auth = createAdminClient().auth.admin;
  const redirectTo = `${appUrl}/auth/confirm`;
  let res = await auth.generateLink({ type: "magiclink", email, options: { redirectTo } });
  if (res.error) {
    res = await auth.generateLink({ type: "invite", email, options: { redirectTo } });
  }
  if (res.error || !res.data?.properties?.hashed_token) return null;
  const type = res.data.properties.verification_type === "invite" ? "invite" : "magiclink";
  return `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(res.data.properties.hashed_token)}&type=${type}`;
}

export async function sendWelcome(email: string, businessName: string, appUrl: string): Promise<{ sent: boolean; error?: string }> {
  const link = await signInLinkFor(email, appUrl).catch(() => null);
  const cta = link ?? `${appUrl}/login`;
  return sendEmail({
    to: email,
    subject: `Welcome to Vigil — let's build ${businessName}`,
    text: `Thanks for choosing Vigil Studios. Your account is ready.\n\nSign in here to tell us about ${businessName} so we can start building:\n${cta}\n\nThe link signs you in directly; no password needed.`,
    html: layout(
      `Welcome to Vigil`,
      `<p>Thanks for choosing Vigil Studios. Your account for <b>${escapeHtml(businessName)}</b> is ready.</p><p>Next, tell us about your business so we can start building. It takes about ten minutes and you can save as you go.</p>${button(cta, "Start your onboarding")}<p style="color:#666;font-size:13px">The button signs you in directly; there is no password to remember.</p>`
    ),
  });
}
