"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { NotFoundError, ProviderNotConfiguredError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { normalizeEmail } from "@/lib/vigil/auth/redirects";
import { requireAdminOrThrow, requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { button, escapeHtml, layout, sendEmail } from "@/lib/vigil/email";
import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import { syncCatalogToProvider, type SyncReport } from "@/lib/vigil/services/catalog";
import { isAvailableExpressTemplateSlug } from "@/lib/constants";

async function appUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

const createOrderSchema = z.object({
  business_name: z.string().trim().min(2, "Business name is too short.").max(120),
  email: z.string().trim().email("Enter the customer's email."),
  contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  project_kind: z.enum(["express", "professional", "custom"]),
  template_slug: z.string().trim().max(80).optional().or(z.literal("")).refine((slug) => !slug || isAvailableExpressTemplateSlug(slug), "Choose an available template from the list."),
  plan_code: z.string().trim().min(1, "Choose a plan."),
  build_amount: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  send_email: z.string().optional(),
});

export type CreateOrderState = ActionResult<{ id: string; url: string; emailed: boolean }> | null;

/**
 * Staff prepare an order and get a checkout link to send. The customer pays
 * on that link; provisioning is identical to a self-serve purchase.
 */
export async function createCheckoutLink(_prev: CreateOrderState, formData: FormData): Promise<CreateOrderState> {
  try {
    const staff = await requireStaffOrThrow();
    const parsed = createOrderSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
      throw new ValidationError("Check the highlighted fields.", issues);
    }
    const v = parsed.data;
    const supabase = await createClient();

    const { data: plan, error: planError } = await supabase.from("plans").select("id, name").eq("code", v.plan_code).maybeSingle();
    if (planError) throw planError;
    if (!plan) throw new ValidationError("Unknown plan.");

    let buildAmount: number | null = null;
    if (v.build_amount) {
      const n = Math.round(Number(v.build_amount) * 100);
      if (!Number.isFinite(n) || n < 0) throw new ValidationError("Build amount must be a number.", { build_amount: ["Invalid"] });
      buildAmount = n;
    }
    const { data: build } = await supabase.from("build_prices").select("id, amount_cents").eq("kind", v.project_kind).maybeSingle();
    if (v.project_kind === "custom" && buildAmount === null) throw new ValidationError("Enter the quoted build amount for a custom build.", { build_amount: ["Required for custom builds"] });

    const email = normalizeEmail(v.email);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        email,
        contact_name: v.contact_name || null,
        business_name: v.business_name,
        project_kind: v.project_kind,
        template_slug: v.template_slug || null,
        plan_id: plan.id,
        build_price_id: build?.id ?? null,
        build_amount_cents: buildAmount ?? build?.amount_cents ?? null,
        created_by: staff.user.id,
        expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      })
      .select("id, checkout_token")
      .single();
    if (error) throw error;
    if (v.notes) {
      // Staff-only context for the order; the customer's own order row never carries it.
      const { error: noteError } = await supabase.from("staff_notes").insert({ entity_type: "order", entity_id: order.id, body: v.notes, created_by: staff.user.id });
      if (noteError) throw noteError;
    }

    const url = `${await appUrl()}/checkout/${order.checkout_token}`;
    await logAuditEvent(supabase, { action: "order.link_created", entityType: "order", entityId: order.id, after: { business_name: v.business_name, email, plan: plan.name, project_kind: v.project_kind } });

    let emailed = false;
    if (v.send_email === "on") {
      const res = await sendEmail({
        to: email,
        subject: `Your Vigil Studios order for ${v.business_name}`,
        text: `Hi${v.contact_name ? ` ${v.contact_name}` : ""},\n\nHere is your secure checkout for ${v.business_name}: ${url}\n\nIt covers the website build and your ${plan.name} plan. The moment payment goes through, your Vigil dashboard is ready and a short onboarding tells us everything we need to start.\n\nVigil Studios`,
        html: layout(
          `Your order for ${v.business_name}`,
          `<p>Hi${v.contact_name ? ` ${escapeHtml(v.contact_name)}` : ""},</p><p>Here is your secure checkout for <b>${escapeHtml(v.business_name)}</b>. It covers the website build and your <b>${escapeHtml(plan.name)}</b> plan.</p>${button(url, "Review and pay securely")}<p>The moment payment goes through, your Vigil dashboard is ready and a short onboarding tells us everything we need to start building.</p>`
        ),
      });
      emailed = res.sent;
    }

    revalidatePath("/admin/orders");
    return { ok: true, data: { id: order.id, url, emailed } };
  } catch (error) {
    return toActionError(error, "staff");
  }
}

/** Staff took payment off-platform (or the webhook never came): mark paid and provision. */
export async function markOrderPaidAndProvision(orderId: string): Promise<ActionResult<{ organizationId: string }>> {
  try {
    await requireStaffOrThrow();
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Service role");
    const admin = createAdminClient();
    const { data: order } = await admin.from("orders").select("id, status").eq("id", orderId).maybeSingle();
    if (!order) throw new NotFoundError();
    if (order.status === "pending") {
      const { error } = await admin.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", orderId);
      if (error) throw error;
    }
    await enqueueJob(admin, { kind: JOB_KINDS.orderProvision, idempotencyKey: `order.provision:${orderId}`, payload: { order_id: orderId }, maxAttempts: 8 });
    const outcomes = await runDueJobs(admin, { worker: "console", limit: 5 });
    const mine = outcomes.find((o) => o.kind === JOB_KINDS.orderProvision);
    if (mine && mine.status === "failed") throw new ValidationError(mine.error ?? "Provisioning failed.");
    const { data: after } = await admin.from("orders").select("organization_id").eq("id", orderId).single();
    revalidatePath("/admin/orders");
    revalidatePath("/admin/organizations");
    return { ok: true, data: { organizationId: after?.organization_id ?? "" } };
  } catch (error) {
    return toActionError(error, "staff");
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { error } = await supabase.from("orders").update({ status: "expired" }).eq("id", orderId).eq("status", "pending");
    if (error) throw error;
    revalidatePath("/admin/orders");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "staff");
  }
}

/** Admin: push every approved price to the billing provider and record the links. */
export async function syncPrices(): Promise<ActionResult<SyncReport>> {
  try {
    await requireAdminOrThrow();
    const supabase = await createClient();
    const report = await syncCatalogToProvider(supabase);
    await logAuditEvent(supabase, { action: "catalog.synced", entityType: "plan", after: { synced: report.synced.length, skipped: report.skipped.length } });
    revalidatePath("/admin/plans");
    return { ok: true, data: report };
  } catch (error) {
    return toActionError(error, "staff");
  }
}

export async function updateBuildPrice(buildPriceId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();
    const raw = String(formData.get("amount") ?? "").trim();
    const cents = raw ? Math.round(Number(raw) * 100) : null;
    if (raw && (!Number.isFinite(cents) || (cents as number) < 0)) throw new ValidationError("Amount must be a number.");
    const supabase = await createClient();
    const { error } = await supabase.from("build_prices").update({ amount_cents: cents, is_active: String(formData.get("is_active")) === "on" }).eq("id", buildPriceId);
    if (error) throw error;
    await logAuditEvent(supabase, { action: "build_price.updated", entityType: "build_price", entityId: buildPriceId, after: { amount_cents: cents } });
    revalidatePath("/admin/plans");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "staff");
  }
}
