import "server-only";

import { NotFoundError } from "@/lib/vigil/auth/errors";
import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider } from "@/lib/vigil/providers/types";
import type { DbClient } from "@/lib/vigil/types";
import { completeCheckout } from "./orders";

export type SettleOutcome = {
  status: string;
  /** What this call did: nothing, completed the checkout, queued provisioning, or both. */
  actions: ("completed" | "queued")[];
  /** null until the welcome email has been attempted. */
  welcomeSent: boolean | null;
};

/**
 * Bring an order as far as it can go right now, from wherever it is:
 *
 *   pending  → ask the provider whether the checkout was paid; if so, paid
 *   paid     → (re)queue provisioning and run it, whether the webhook has
 *              not arrived yet or an earlier attempt failed
 *   anything else → report it
 *
 * Every step is idempotent, so the success page, the webhook and the
 * reconciliation pass can all call this without stepping on each other.
 */
export async function settleOrder(admin: DbClient, orderId: string, options: { provider?: BillingProvider; worker?: string; run?: boolean } = {}): Promise<SettleOutcome> {
  const provider = options.provider ?? getBillingProvider();
  const actions: SettleOutcome["actions"] = [];

  const { data: order, error } = await admin.from("orders").select("id, status, metadata").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) throw new NotFoundError(`Order ${orderId} not found.`);

  let status = order.status;
  if (status === "pending") {
    const sessionRef = (order.metadata as { checkout_session?: string } | null)?.checkout_session;
    if (sessionRef) {
      const checkout = await provider.getCheckoutSession(sessionRef).catch(() => null);
      if (checkout && (checkout.paymentStatus === "paid" || checkout.paymentStatus === "no_payment_required")) {
        status = (await completeCheckout(admin, orderId, checkout, provider)).status;
        if (status === "paid") actions.push("completed");
      }
    }
  }

  if (status === "paid") {
    await enqueueJob(admin, { kind: JOB_KINDS.orderProvision, idempotencyKey: `order.provision:${orderId}`, payload: { order_id: orderId }, maxAttempts: 8, requeueFailed: true });
    actions.push("queued");
    if (options.run !== false) {
      await runDueJobs(admin, { worker: options.worker ?? "settle", limit: 3 }).catch(() => undefined);
      const { data: again } = await admin.from("orders").select("status").eq("id", orderId).single();
      status = again?.status ?? status;
    }
  }

  const { data: latest } = await admin.from("orders").select("metadata").eq("id", orderId).single();
  const welcome = (latest?.metadata as { welcome_email?: { sent?: boolean } } | null)?.welcome_email;
  return { status, actions, welcomeSent: welcome ? Boolean(welcome.sent) : null };
}
