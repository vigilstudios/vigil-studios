import "server-only";
import { redirect } from "next/navigation";
import { requireViewer } from "./session";
import { getViewer } from "./session";
import { safeNextPath } from "./redirects";

export function checkoutReturnPath(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  for (const key of [
    "template",
    "client_reference_id",
    "build",
    "canceled",
    "plan",
    "period",
    "promo",
  ]) {
    const value = params[key];
    if (typeof value === "string" && value.length <= 120) query.set(key, value);
  }
  return `/checkout${query.size ? `?${query}` : ""}`;
}
export async function requireCheckoutViewer(next: string, entry: "signup" | "login" = "signup") {
  const viewer = await getViewer();
  if (!viewer)
    redirect(`/${entry}?next=${encodeURIComponent(safeNextPath(next))}`);
  if (!viewer.user.email_confirmed_at || !viewer.user.email)
    redirect(
      `/login?error=email_unverified&next=${encodeURIComponent(safeNextPath(next))}`,
    );
  return viewer;
}
export function canViewPurchase(
  viewer: Awaited<ReturnType<typeof requireViewer>>,
  order: { buyer_user_id: string | null; organization_id: string | null },
) {
  return (
    !!viewer.staffRole ||
    order.buyer_user_id === viewer.user.id ||
    (order.organization_id !== null &&
      viewer.memberships.some(
        (m) => m.organization.id === order.organization_id,
      ))
  );
}
