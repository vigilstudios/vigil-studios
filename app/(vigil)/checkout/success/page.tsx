import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import { completeCheckout } from "@/lib/vigil/services/orders";
import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import { CheckoutShell } from "../CheckoutShell";
import { SuccessPanel } from "./SuccessPanel";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };

/**
 * After the provider's payment page. The webhook usually gets here first;
 * if it has not, the session is checked directly so the customer never
 * waits on a webhook to see confirmation.
 */
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  if (!orderId || !hasAdminClient() || !/^[0-9a-f-]{36}$/.test(orderId)) notFound();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, status, email, business_name, metadata").eq("id", orderId).maybeSingle();
  if (!order) notFound();

  let status = order.status;
  if (status === "pending") {
    const sessionRef = (order.metadata as { checkout_session?: string } | null)?.checkout_session;
    if (sessionRef) {
      const checkout = await getBillingProvider().getCheckoutSession(sessionRef).catch(() => null);
      if (checkout && (checkout.paymentStatus === "paid" || checkout.paymentStatus === "no_payment_required")) {
        const updated = await completeCheckout(admin, order.id, checkout);
        status = updated.status;
        if (status === "paid") {
          await enqueueJob(admin, { kind: JOB_KINDS.orderProvision, idempotencyKey: `order.provision:${order.id}`, payload: { order_id: order.id }, maxAttempts: 8 });
          await runDueJobs(admin, { worker: "success-page", limit: 3 }).catch(() => undefined);
          const { data: again } = await admin.from("orders").select("status").eq("id", order.id).single();
          status = again?.status ?? status;
        }
      }
    }
  }

  return (
    <CheckoutShell title={status === "pending" ? "Finishing your payment…" : "Welcome to Vigil"}>
      <SuccessPanel orderId={order.id} email={order.email} status={status} businessName={order.business_name} />
    </CheckoutShell>
  );
}
