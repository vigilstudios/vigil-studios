import "server-only";

import { button, escapeHtml, layout, sendEmail, staffNotificationAddress } from "@/lib/vigil/email";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider } from "@/lib/vigil/providers/types";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { completeCheckout, sendWelcome } from "./orders";
import { settleOrder } from "./settle";

/**
 * The transactional path has three moving parts (Stripe, the webhook, the
 * success page) and each can miss. This pass runs from the job runner and
 * puts every order back on the rails or tells a person:
 *
 *   paid, not provisioned for a while   → provision again; if it still is
 *                                         not, email staff (once a day)
 *   pending with a session, gone quiet   → ask the provider once: paid means
 *                                         complete + provision; expired
 *                                         means the order is expired
 *   provisioned, welcome email not sent  → send it again once; then staff
 *   brief sent, staff never told         → send the notification again
 *
 * Everything here is idempotent and safe to run any number of times.
 */
export type ReconcileReport = {
  provisioned: string[];
  stillStuck: string[];
  completed: string[];
  expired: string[];
  welcomeResent: string[];
  intakeNotified: string[];
  alerted: boolean;
};

export type ReconcileOptions = {
  provider?: BillingProvider;
  now?: Date;
  /** How long a paid order may sit unprovisioned before it counts as stuck. */
  stuckAfterMs?: number;
  /** How old a pending order must be before its session is checked. */
  pendingAfterMs?: number;
  /** Pending orders older than this are left alone (already expired at the provider). */
  pendingWithinMs?: number;
  /** Do not email the same stuck order again within this window. */
  alertEveryMs?: number;
  appUrl?: string;
};

const DEFAULTS = {
  stuckAfterMs: 10 * 60_000,
  pendingAfterMs: 60 * 60_000,
  pendingWithinMs: 7 * 86_400_000,
  alertEveryMs: 24 * 3_600_000,
};

/** Briefs sent before this were notified by hand; there is no record to check. */
const INTAKE_NOTIFIED_SINCE = "2026-09-15T20:00:00.000Z";

export async function reconcileOrders(admin: DbClient, options: ReconcileOptions = {}): Promise<ReconcileReport> {
  const provider = options.provider ?? getBillingProvider();
  const now = options.now ?? new Date();
  const cfg = { ...DEFAULTS, ...options };
  const appUrl = (options.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co").replace(/\/$/, "");
  const report: ReconcileReport = { provisioned: [], stillStuck: [], completed: [], expired: [], welcomeResent: [], intakeNotified: [], alerted: false };
  const iso = (ms: number) => new Date(now.getTime() - ms).toISOString();

  // 1. Paid, not provisioned.
  const { data: stuck, error: stuckError } = await admin.from("orders").select("id, business_name, email, paid_at, metadata").eq("status", "paid").lt("paid_at", iso(cfg.stuckAfterMs));
  if (stuckError) throw stuckError;
  const toAlert: { id: string; business_name: string; email: string; paid_at: string | null }[] = [];
  for (const order of stuck ?? []) {
    const result = await settleOrder(admin, order.id, { provider, worker: "reconcile" }).catch(() => null);
    if (result?.status === "provisioned") {
      report.provisioned.push(order.id);
      continue;
    }
    report.stillStuck.push(order.id);
    const meta = (order.metadata as Record<string, unknown> | null) ?? {};
    const notifiedAt = (meta.reconcile as { notified_at?: string } | undefined)?.notified_at;
    if (!notifiedAt || new Date(notifiedAt).getTime() < now.getTime() - cfg.alertEveryMs) toAlert.push(order);
  }

  // 2. Pending with a checkout session, past the window a buyer takes to pay.
  const { data: pending, error: pendingError } = await admin
    .from("orders")
    .select("id, metadata, created_at")
    .eq("status", "pending")
    .lt("created_at", iso(cfg.pendingAfterMs))
    .gt("created_at", iso(cfg.pendingWithinMs));
  if (pendingError) throw pendingError;
  for (const order of pending ?? []) {
    const sessionRef = (order.metadata as { checkout_session?: string } | null)?.checkout_session;
    if (!sessionRef) continue;
    const checkout = await provider.getCheckoutSession(sessionRef).catch(() => null);
    if (!checkout) continue;
    if (checkout.paymentStatus === "paid" || checkout.paymentStatus === "no_payment_required") {
      await completeCheckout(admin, order.id, checkout, provider);
      const result = await settleOrder(admin, order.id, { provider, worker: "reconcile" }).catch(() => null);
      report.completed.push(order.id);
      if (result?.status === "provisioned") report.provisioned.push(order.id);
      else report.stillStuck.push(order.id);
    } else if (checkout.status === "expired") {
      await admin.from("orders").update({ status: "expired" }).eq("id", order.id).eq("status", "pending");
      report.expired.push(order.id);
    }
  }

  // 3. Provisioned, but the welcome email never went out: one more try.
  const { data: provisioned, error: provError } = await admin.from("orders").select("id, email, business_name, metadata").eq("status", "provisioned").gt("provisioned_at", iso(cfg.pendingWithinMs));
  if (provError) throw provError;
  for (const order of provisioned ?? []) {
    const meta = (order.metadata as Record<string, unknown> | null) ?? {};
    const welcome = meta.welcome_email as { sent?: boolean; retried?: boolean } | undefined;
    if (!welcome || welcome.sent || welcome.retried) continue;
    const res = await sendWelcome(order.email, order.business_name, appUrl).catch((err) => ({ sent: false, error: err instanceof Error ? err.message : String(err) }));
    await admin
      .from("orders")
      .update({ metadata: { ...meta, welcome_email: { ...welcome, sent: res.sent, error: res.error ?? null, retried: true, retried_at: now.toISOString() } } as unknown as Json })
      .eq("id", order.id);
    if (res.sent) report.welcomeResent.push(order.id);
    else toAlert.push({ id: order.id, business_name: order.business_name, email: order.email, paid_at: null });
  }

  // 4. Brief sent, staff never notified (the email failed when it was submitted).
  const intakeSince = [iso(cfg.pendingWithinMs), INTAKE_NOTIFIED_SINCE].sort()[1];
  const { data: completedIntakes, error: intakeError } = await admin.from("audit_events").select("entity_id, organization_id, created_at").eq("action", "project.intake_completed").gt("created_at", intakeSince);
  if (intakeError) throw intakeError;
  for (const ev of completedIntakes ?? []) {
    if (!ev.entity_id) continue;
    const { data: notified } = await admin.from("audit_events").select("id").eq("action", "project.intake_notified").eq("entity_id", ev.entity_id).limit(1);
    if (notified && notified.length > 0) continue;
    const { data: project } = await admin.from("projects").select("id, name, organization_id").eq("id", ev.entity_id).maybeSingle();
    if (!project) continue;
    const res = await sendEmail({
      to: staffNotificationAddress(),
      subject: `Onboarding complete: ${project.name}`,
      text: `The brief for "${project.name}" was sent and the first notification did not go out.\n\nReview: ${appUrl}/admin/organizations/${project.organization_id}`,
      html: layout(`Onboarding complete: ${escapeHtml(project.name)}`, `<p>The brief was sent and the first notification did not go out.</p>${button(`${appUrl}/admin/organizations/${project.organization_id}`, "Open in Vigil Admin")}`),
    });
    if (res.sent) {
      await admin.rpc("log_audit_event", { p_action: "project.intake_notified", p_entity_type: "project", p_entity_id: project.id, p_org: project.organization_id, p_after: { via: "reconcile" } });
      report.intakeNotified.push(project.id);
    }
  }

  // 5. One email for everything that still needs a person.
  if (toAlert.length > 0) {
    const lines = toAlert.map((o) => `${o.business_name} <${o.email}>: order ${o.id}${o.paid_at ? `, paid ${o.paid_at}` : ", welcome email failed"}`);
    const res = await sendEmail({
      to: staffNotificationAddress(),
      subject: `Needs attention: ${toAlert.length} order${toAlert.length === 1 ? "" : "s"} need a person`,
      text: `These customers paid and are not fully set up. Provisioning was retried and did not complete, or their welcome email could not be sent.\n\n${lines.join("\n")}\n\nOrders: ${appUrl}/admin/orders\nJobs: ${appUrl}/admin/jobs`,
      html: layout(`Needs attention: ${toAlert.length} order${toAlert.length === 1 ? "" : "s"}`, `<p>These customers paid and are not fully set up. Provisioning was retried and did not complete, or their welcome email could not be sent.</p><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>${button(`${appUrl}/admin/orders`, "Open orders")}`),
    });
    report.alerted = res.sent;
    if (res.sent) {
      for (const o of toAlert) {
        const { data: row } = await admin.from("orders").select("metadata").eq("id", o.id).maybeSingle();
        const meta = (row?.metadata as Record<string, unknown> | null) ?? {};
        await admin.from("orders").update({ metadata: { ...meta, reconcile: { notified_at: now.toISOString() } } as unknown as Json }).eq("id", o.id);
      }
    }
  }

  return report;
}
