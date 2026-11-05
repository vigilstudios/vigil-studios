import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrgContext } from "@/lib/vigil/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { calendarOwner } from "@/lib/vigil/bookings/google/access";
import {
  calendarConfig,
  readCalendarCookie,
  exchangeCalendarCode,
  createGoogleCalendar,
  googleCalendarExists,
  deleteProvisionalCalendar,
  CALENDAR_COOKIE,
} from "@/lib/vigil/bookings/google/provider";
export async function GET(request: NextRequest) {
  let outcome = "error",
    website: string | undefined,
    provisional: { token: string; id: string } | null = null;
  try {
    const ctx = await getOrgContext(),
      cfg = calendarConfig(),
      state =
        ctx &&
        !ctx.isImpersonating &&
        readCalendarCookie(
          request.cookies.get(CALENDAR_COOKIE)?.value,
          request.nextUrl.searchParams.get("state"),
          ctx.user.id,
          ctx.organization.id,
        );
    if (
      state &&
      cfg &&
      new URL(cfg.redirectUri).host ===
        (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    ) {
      website = state.websiteId;
      const owner = await calendarOwner(website);
      if (!owner) throw new Error("No access");
      if (request.nextUrl.searchParams.get("error")) outcome = "cancelled";
      else {
        const code = request.nextUrl.searchParams.get("code");
        if (!code || code.length > 4096) throw new Error("Invalid code");
        const account = await exchangeCalendarCode(code, state.verifier),
          admin = createAdminClient();
        const target = await admin.rpc("booking_calendar_target", {
          p_user: ctx!.user.id,
          p_site: website,
        });
        if (target.error) throw new Error("Calendar unavailable");
        const previous = target.data
          ? z
              .object({ email: z.email(), calendarId: z.string() })
              .parse(target.data)
          : null;
        let calendarId =
          previous?.email === account.email &&
          (await googleCalendarExists(account.accessToken, previous.calendarId))
            ? previous.calendarId
            : null;
        if (!calendarId) {
          calendarId = await createGoogleCalendar(
            account.accessToken,
            owner.site.name,
            owner.timeZone,
          );
          provisional = { token: account.accessToken, id: calendarId };
        }
        const saved = await admin.rpc("save_booking_calendar", {
          p_user: ctx!.user.id,
          p_site: website,
          p_email: account.email,
          p_refresh_token: account.refreshToken,
          p_calendar: calendarId,
        });
        if (saved.error) throw new Error("Calendar could not be saved");
        provisional = null;
        outcome = "connected";
      }
    }
  } catch {
    /* Codes, tokens and Google response bodies must never enter logs or redirects. */
  }
  if (provisional)
    await deleteProvisionalCalendar(provisional.token, provisional.id).catch(
      () => {},
    );
  const back = new URL("/dashboard/bookings", requestOrigin(request));
  back.searchParams.set("view", "setup");
  if (website) back.searchParams.set("website", website);
  back.searchParams.set("calendarNotice", outcome);
  const response = NextResponse.redirect(back, 303);
  response.cookies.set(CALENDAR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
