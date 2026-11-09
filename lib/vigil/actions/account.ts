"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACTIVE_ORG_COOKIE,
  requireViewerOrThrow,
} from "@/lib/vigil/auth/session";
import {
  toActionError,
  type ActionResult,
  ForbiddenError,
} from "@/lib/vigil/auth/errors";
export async function saveAccountName(form: FormData): Promise<ActionResult> {
  try {
    const viewer = await requireViewerOrThrow();
    const name = z.string().trim().min(1).max(120).parse(form.get("full_name"));
    const client = await createClient();
    const { error } = await client
      .from("profiles")
      .update({ full_name: name })
      .eq("id", viewer.user.id);
    if (error) throw error;
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
export async function openPurchasedBusiness(orderId: string) {
  const viewer = await requireViewerOrThrow();
  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("buyer_user_id,organization_id,project_id,status")
    .eq("id", z.uuid().parse(orderId))
    .maybeSingle();
  if (error) throw error;
  if (
    !order ||
    order.status !== "provisioned" ||
    order.buyer_user_id !== viewer.user.id ||
    !order.organization_id ||
    !order.project_id ||
    !viewer.memberships.some((m) => m.organization.id === order.organization_id)
  )
    throw new ForbiddenError(
      "Your project is still being prepared. Refresh and try again.",
    );
  (await cookies()).set(ACTIVE_ORG_COOKIE, order.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 86400,
  });
  redirect(`/dashboard/onboarding?project=${encodeURIComponent(order.project_id)}`);
}
