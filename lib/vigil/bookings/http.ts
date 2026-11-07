import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { websiteContactCredentials } from "../contact/credentials";
import { registeredOrigin } from "../contact/contract";
import {
  ContactError,
  readBoundedJson,
  verifyTurnstile,
} from "../contact/http";
import { guestBookingSchema, publicBookingSchema } from "./contract";
import type { DbClient } from "../types";
export const bookingHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type BookingDependencies = {
  enabled: () => boolean;
  admin: () => DbClient;
  credentials: typeof websiteContactCredentials;
  verify: (
    token: string,
    hostname: string,
    ip: string,
    secret: string,
    action?: string,
  ) => Promise<boolean>;
};
const defaults: BookingDependencies = {
  enabled: () => process.env.VIGIL_BOOKINGS_ENABLED === "true",
  admin: createAdminClient,
  credentials: websiteContactCredentials,
  verify: verifyTurnstile,
};
async function limit(
  admin: DbClient,
  key: string,
  hits: number,
  seconds: number,
) {
  const { data, error } = await admin.rpc("rate_limit", {
    p_key: `booking:${bookingHash(key)}`,
    p_limit: hits,
    p_window_seconds: seconds,
  });
  if (error)
    throw new ContactError(503, "Bookings are temporarily unavailable.");
  if (!data)
    throw new ContactError(
      429,
      "Too many requests. Please wait and try again.",
    );
}
export async function handleBookings(
  request: Request,
  websiteId: string,
  deps = defaults,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  try {
    if (!deps.enabled())
      throw new ContactError(
        503,
        "Online booking is not enabled. Please contact the business.",
      );
    const origin = registeredOrigin(request.headers.get("origin"));
    if (!origin || !z.uuid().safeParse(websiteId).success)
      throw new ContactError(403, "Open booking on the business website.");
    const admin = deps.admin();
    // Existing appointment management survives a plan downgrade or paused new bookings.
    const { data: registry, error: registryError } = await admin
      .from("website_contact_settings")
      .select("allowed_origins")
      .eq("website_id", websiteId)
      .maybeSingle();
    if (registryError)
      throw new ContactError(503, "Bookings are temporarily unavailable.");
    if (!registry?.allowed_origins.includes(origin))
      throw new ContactError(403, "This website is not connected.");
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "unknown";
    await limit(admin, `read:${websiteId}:${ip}`, 180, 600);
    if (request.method === "GET") {
      const url = new URL(request.url),
        service = url.searchParams.get("service"),
        day = url.searchParams.get("day"),
        party = url.searchParams.get("party");
      if (service || day) {
        if (
          !z.uuid().safeParse(service).success ||
          !day ||
          !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
          !Number.isFinite(Date.parse(day)) ||
          (party !== null && !/^(?:[1-9]|[12][0-9]|30)$/.test(party))
        )
          throw new ContactError(422, "Choose a valid service and date.");
        const { data, error } = await admin.rpc("booking_public_slots", {
          p_website: websiteId,
          p_origin: origin,
          p_service: service!,
          p_day: day,
          ...(party !== null ? { p_party: Number(party) } : {}),
        });
        if (error)
          throw new ContactError(
            error.code === "42501" ? 403 : 422,
            "Available times could not be loaded. Please choose another date or contact the business.",
          );
        return Response.json({ slots: data }, { headers });
      }
      const { data, error } = await admin.rpc("booking_public_config", {
        p_website: websiteId,
        p_origin: origin,
      });
      const keys = await deps.credentials(admin, websiteId);
      if (
        error ||
        !data ||
        !keys ||
        /^(1x|2x|3x)0+/.test(keys.siteKey) ||
        /^(1x|2x|3x)0+/.test(keys.secret)
      )
        throw new ContactError(
          503,
          "Online booking is not connected yet. Please contact the business.",
        );
      return Response.json(
        { ...(data as object), siteKey: keys.siteKey },
        { headers },
      );
    }
    if (request.method !== "POST")
      throw new ContactError(405, "Use the booking form.");
    const raw = await readBoundedJson(request);
    await limit(admin, `write:${websiteId}:${ip}`, 20, 600);
    const guest = guestBookingSchema.safeParse(raw);
    if (guest.success) {
      const input = guest.data;
      const { data, error } = await admin.rpc("manage_guest_booking", {
        p_website: websiteId,
        p_origin: origin,
        p_id: input.bookingId,
        p_hash: bookingHash(input.token),
        p_action: input.action,
        ...(input.startsAt ? { p_start: input.startsAt } : {}),
      });
      if (error)
        throw new ContactError(
          error.code === "23P01" ? 409 : 422,
          error.code === "23P01"
            ? "That time is no longer available."
            : "This appointment cannot be changed online. Please contact the business.",
        );
      return Response.json({ ok: true, appointment: data }, { headers });
    }
    const parsed = publicBookingSchema.safeParse(raw);
    if (!parsed.success)
      throw new ContactError(422, "Check your service, time, name and email.");
    const input = parsed.data;
    const sourcePage = new URL(input.sourcePage);
    if (
      sourcePage.origin !== origin ||
      sourcePage.username ||
      sourcePage.password
    )
      throw new ContactError(422, "Invalid source page.");
    input.sourcePage = sourcePage.origin + sourcePage.pathname;
    const keys = await deps.credentials(admin, websiteId);
    if (
      !keys ||
      /^(1x|2x|3x)0+/.test(keys.siteKey) ||
      /^(1x|2x|3x)0+/.test(keys.secret)
    )
      throw new ContactError(503, "Booking verification is unavailable.");
    await limit(admin, `verify:${websiteId}`, 300, 3600);
    if (
      !(await deps.verify(
        input.captchaToken,
        new URL(origin).hostname,
        ip,
        keys.secret,
        "booking",
      ))
    )
      throw new ContactError(403, "Verification expired. Please try again.");
    const contact = {
      name: input.name,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
    };
    const fingerprint = bookingHash(
      JSON.stringify([
        input.sourcePage,
        input.serviceId,
        input.startsAt,
        contact,
        input.notes ?? "",
        bookingHash(input.managementToken),
        ...(input.partySize ? [input.partySize] : []),
      ]),
    );
    const { data, error } = await admin.rpc("create_public_booking", {
      p_website: websiteId,
      p_origin: origin,
      p_service: input.serviceId,
      p_start: input.startsAt,
      p_key: input.submissionId,
      p_hash: fingerprint,
      p_guest_hash: bookingHash(input.managementToken),
      p_contact: contact,
      p_notes: input.notes ?? "",
      p_page: input.sourcePage,
      ...(input.partySize ? { p_party: input.partySize } : {}),
    });
    if (error) {
      if (error.code === "23P01")
        throw new ContactError(
          409,
          "That time was just taken. Choose another available time.",
        );
      if (error.code === "23505")
        throw new ContactError(
          409,
          "This submission changed. Refresh and start again.",
        );
      if (error.code === "P0001")
        throw new ContactError(
          429,
          "The business has reached its online booking limit. Please contact them.",
        );
      throw new ContactError(
        503,
        "Your appointment could not be saved. Please try again or contact the business.",
      );
    }
    return Response.json(
      { ok: true, appointment: data },
      { status: 201, headers },
    );
  } catch (error) {
    const known = error instanceof ContactError;
    return Response.json(
      {
        ok: false,
        error: known
          ? error.message
          : "Bookings are temporarily unavailable. Please contact the business.",
      },
      {
        status: known ? error.status : 503,
        headers: {
          ...headers,
          ...(known && error.status === 429 ? { "Retry-After": "600" } : {}),
        },
      },
    );
  }
}
