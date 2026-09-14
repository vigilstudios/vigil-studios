"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { ProviderNotConfiguredError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { sendWelcome, startCheckout } from "@/lib/vigil/services/orders";

const schema = z.object({
  email: z.string().trim().email("Enter the email you want to use to sign in."),
  contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  business_name: z.string().trim().min(2, "Enter your business name.").max(120),
  plan_code: z.string().trim().min(1, "Choose a plan."),
  project_kind: z.enum(["express", "professional", "custom"]).default("express"),
  template_slug: z.string().trim().max(80).optional().or(z.literal("")),
  order_id: z.string().uuid().optional().or(z.literal("")),
  checkout_token: z.string().trim().optional().or(z.literal("")),
  agree: z.string().optional(),
});

async function appUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export type CheckoutState = ActionResult | null;

/**
 * Anonymous: validate, create (or update) the order, hand off to the
 * provider's payment page. Server-side only; the buyer never sees a key.
 */
export async function beginCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let url: string | null = null;
  try {
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Checkout");
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
      throw new ValidationError("Check the highlighted fields.", issues);
    }
    const v = parsed.data;
    if (v.agree !== "on") throw new ValidationError("Please accept the service agreement to continue.", { agree: ["Required"] });

    const admin = createAdminClient();

    // A staff-created link is bound to its token; the order id alone is not enough.
    let existingOrderId: string | null = null;
    let buildOverride: number | null = null;
    if (v.order_id && v.checkout_token) {
      const { data: order } = await admin.from("orders").select("id, status, build_amount_cents, project_kind").eq("id", v.order_id).eq("checkout_token", v.checkout_token).maybeSingle();
      if (!order) throw new ValidationError("This checkout link is not valid.");
      if (order.status !== "pending") throw new ValidationError("This order has already been paid.");
      existingOrderId = order.id;
      if (order.project_kind === "custom") buildOverride = order.build_amount_cents;
    }

    const result = await startCheckout(admin, {
      email: v.email,
      contactName: v.contact_name || null,
      businessName: v.business_name,
      projectKind: v.project_kind,
      templateSlug: v.template_slug || null,
      planCode: v.plan_code,
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
    const admin = createAdminClient();
    const { data: order } = await admin.from("orders").select("email, business_name, status").eq("id", orderId).maybeSingle();
    if (!order || (order.status !== "paid" && order.status !== "provisioned")) throw new ValidationError("This order is not ready yet.");
    await sendWelcome(order.email, order.business_name, await appUrl());
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
