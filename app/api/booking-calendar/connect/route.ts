import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/vigil/auth/session";
import { isSameOriginRequest, requestOrigin } from "@/lib/vigil/auth/origin";
import { enforceRateLimit, limitKey } from "@/lib/vigil/rate-limit";
import { calendarOwner } from "@/lib/vigil/bookings/google/access";
import {
  calendarConfig,
  calendarAuthorization,
  CALENDAR_COOKIE,
} from "@/lib/vigil/bookings/google/provider";
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
  const origin = requestOrigin(request),
    back = new URL(`/dashboard/bookings?view=setup&website=${site}`, origin);
  const owner = await calendarOwner(site);
  if (!owner)
    return new Response("Business owner or manager required", { status: 403 });
  const cfg = calendarConfig();
  if (
    !cfg ||
    new URL(cfg.redirectUri).host !==
      (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
  ) {
    back.searchParams.set("calendarNotice", "setup");
    return NextResponse.redirect(back, 303);
  }
  try {
    await enforceRateLimit(
      limitKey("booking-calendar-connect", owner.ctx.user.id),
      { limit: 10, windowSeconds: 600 },
      true,
    );
    const authorization = calendarAuthorization(
        owner.ctx.user.id,
        site,
        owner.ctx.organization.id,
      ),
      response = NextResponse.redirect(authorization.url, 303);
    response.cookies.set(CALENDAR_COOKIE, authorization.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    back.searchParams.set("calendarNotice", "error");
    return NextResponse.redirect(back, 303);
  }
}
