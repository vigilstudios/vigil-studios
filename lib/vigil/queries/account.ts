import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/vigil/auth/session";
export async function getMyPurchases() {
  await requireViewer("/dashboard");
  const client = await createClient();
  const { data, error } = await client
    .from("my_purchase_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}
