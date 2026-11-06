import "server-only";
import { getOrgContext } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
/** A staff impersonation session cannot connect a personal Google account for a customer. */
export async function calendarOwner(website: string, requireEligible = true) {
  const ctx = await getOrgContext();
  if (!ctx || ctx.isImpersonating || !["owner", "manager"].includes(ctx.role))
    return null;
  const db = await createClient();
  const { data: site, error } = await db
    .from("websites")
    .select("id,name,organization_id")
    .eq("id", website)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();
  if (error || !site) return null;
  const settings = await db
    .from("booking_settings")
    .select("time_zone")
    .eq("website_id", site.id)
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();
  if (settings.error || !settings.data) return null;
  if (requireEligible) {
    const eligible = await db.rpc("booking_eligible", { p_website: site.id });
    if (eligible.error || eligible.data !== true) return null;
  }
  return { ctx, site, timeZone: settings.data.time_zone };
}
