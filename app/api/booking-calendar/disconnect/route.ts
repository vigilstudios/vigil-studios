import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/vigil/auth/session";
import { isSameOriginRequest, requestOrigin } from "@/lib/vigil/auth/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { calendarOwner } from "@/lib/vigil/bookings/google/access";
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request))
    return new Response("Request not allowed", { status: 403 });
  const ctx = await getOrgContext();
  if (!ctx || ctx.isImpersonating || !["owner", "manager"].includes(ctx.role))
    return new Response("Business owner or manager required", { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8192)
    return new Response("Request too large", { status: 413 });
  const form = await request.formData(),
    site = String(form.get("website") ?? "");
  if (!z.uuid().safeParse(site).success)
    return new Response("Invalid website", { status: 422 });
  const owner = await calendarOwner(site, false);
  if (!owner)
    return new Response("Business owner or manager required", { status: 403 });
  const result = await createAdminClient().rpc("remove_booking_calendar", {
    p_user: owner.ctx.user.id,
    p_site: site,
  });
  const back = new URL(
    `/dashboard/bookings?view=setup&website=${site}`,
    requestOrigin(request),
  );
  back.searchParams.set(
    "calendarNotice",
    result.error ? "error" : result.data ? "disconnected" : "busy",
  );
  return NextResponse.redirect(back, 303);
}
