import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/vigil/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function ResumePurchase({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const viewer = await requireViewer("/dashboard");
  const { orderId } = await params;
  if (!z.uuid().safeParse(orderId).success) notFound();
  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("checkout_token,status")
    .eq("id", orderId)
    .eq("buyer_user_id", viewer.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!order) notFound();
  redirect(
    order.status === "pending"
      ? `/checkout/${order.checkout_token}`
      : `/checkout/success?order=${orderId}`,
  );
}
