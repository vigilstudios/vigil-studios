"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { ProviderNotConfiguredError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { checkoutIssues, checkoutSchema } from "@/lib/vigil/checkout-schema";
import { sendWelcome, startCheckout } from "@/lib/vigil/services/orders";
import { isAvailableExpressTemplateSlug } from "@/lib/constants";
import { clientIp, enforceRateLimit, limitKey, RATE_LIMITS } from "@/lib/vigil/rate-limit";
import type { Json } from "@/types/database.types";

async function appUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export type CheckoutState = ActionResult | null;

const RESEND_WINDOW_MS = 10 * 60_000;

/**
 * Anonymous: validate, create (or update) the order, hand off to the
 * provider's payment page. Server-side only; the buyer never sees a key.
 */
export async function beginCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let url: string | null = null;
  try {
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Checkout");
    const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", checkoutIssues(parsed.error));
    const v = parsed.data;
    if (v.agree !== "on") throw new ValidationError("Please accept the service agreement to continue.", { agree: ["Required"] });
    await enforceRateLimit(limitKey("checkout:ip", await clientIp()), RATE_LIMITS.checkoutIp);

    const admin = createAdminClient();

    // A staff-created link is bound to its token; the order id alone is not enough.
    let existingOrderId: string | null = null;
    let buildOverride: number | null = null;
    let projectKind = v.project_kind;
    let templateSlug = v.template_slug || null;
    if (!(v.order_id && v.checkout_token)) {
      // Self-serve: the hidden fields are the buyer's to edit. Custom builds
      // have no catalogue price (they would check out with no build fee) and
      // only exist behind a staff-created link; an Express order must name a
      // template that is actually for sale.
      if (projectKind === "custom") throw new ValidationError("Custom builds start from a link Vigil sends you. Write to hello@vigilstudios.co and we will prepare one.");
      if (projectKind === "express" && (!templateSlug || !isAvailableExpressTemplateSlug(templateSlug))) throw new ValidationError("Choose a template from the catalogue to start an Express order.");
      if (projectKind !== "express") templateSlug = null;
    }
    if (v.order_id && v.checkout_token) {
      const { data: order } = await admin.from("orders").select("id, status, build_amount_cents, project_kind, template_slug").eq("id", v.order_id).eq("checkout_token", v.checkout_token).maybeSingle();
      if (!order) throw new ValidationError("This checkout link is not valid.");
      if (order.status !== "pending") throw new ValidationError("This order has already been paid.");
      existingOrderId = order.id;
      // Commercial scope comes from the trusted staff-created order, never
      // hidden browser fields. The customer may still choose their plan.
      projectKind = order.project_kind;
      templateSlug = order.template_slug;
      buildOverride = order.build_amount_cents;
    }

    const result = await startCheckout(admin, {
      email: v.email,
      contactName: v.contact_name || null,
      businessName: v.business_name,
      projectKind,
      templateSlug,
      planCode: v.plan_code,
      billingPeriod: v.billing_period,
      existingOrderId,
      buildAmountOverrideCents: buildOverride,
      appUrl: await appUrl(),
    });
    url = result.url;
  } catch (error) {
    return toActionError(error);
  }
  redirect(url);
}

/** From the success page: re-send the welcome/sign-in email for a paid order. */
export async function resendWelcome(orderId: string): Promise<ActionResult> {
  try {
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Email");
    await enforceRateLimit(limitKey("resend:ip", await clientIp()), RATE_LIMITS.resendWelcomeIp);
    const admin = createAdminClient();
    const { data: order } = await admin.from("orders").select("email, business_name, status, metadata").eq("id", orderId).maybeSingle();
    if (!order || (order.status !== "paid" && order.status !== "provisioned")) throw new ValidationError("This order is not ready yet.");
    // Anyone holding the order id can reach this; each call mails a sign-in
    // link, so one resend per order every ten minutes is plenty.
    const meta = (order.metadata as Record<string, unknown> | null) ?? {};
    const welcome = (meta.welcome_email as Record<string, unknown> | undefined) ?? {};
    const last = typeof welcome.resent_at === "string" ? Date.parse(welcome.resent_at) : NaN;
    if (Number.isFinite(last) && Date.now() - last < RESEND_WINDOW_MS) throw new ValidationError("A sign-in email went out a moment ago. Check your inbox (and spam) before asking for another.");
    await admin.from("orders").update({ metadata: { ...meta, welcome_email: { ...welcome, resent_at: new Date().toISOString() } } as unknown as Json }).eq("id", orderId);
    const res = await sendWelcome(order.email, order.business_name, await appUrl());
    if (!res.sent) throw new ValidationError("We could not send the email right now. Use “Sign in with a link” below instead.");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
