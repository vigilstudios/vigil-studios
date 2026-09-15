import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { settleOrder } from "@/lib/vigil/services/settle";
import { CheckoutShell } from "../CheckoutShell";
import { SuccessPanel } from "./SuccessPanel";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };

/**
 * After the provider's payment page. The webhook usually gets here first;
 * if it has not, settleOrder checks the session directly and provisions,
 * so the customer never waits on a webhook to see confirmation.
 */
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  if (!orderId || !hasAdminClient() || !/^[0-9a-f-]{36}$/.test(orderId)) notFound();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, email, business_name").eq("id", orderId).maybeSingle();
  if (!order) notFound();

  const { status, welcomeSent } = await settleOrder(admin, order.id, { worker: "success-page" });

  return (
    <CheckoutShell centered>
      <SuccessPanel orderId={order.id} email={order.email} status={status} businessName={order.business_name} emailSent={welcomeSent} />
    </CheckoutShell>
  );
}
