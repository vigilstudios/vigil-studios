"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ForbiddenError,
  ValidationError,
  toActionError,
  type ActionResult,
} from "../auth/errors";
import { requireOrgContextOrThrow } from "../auth/session";
import {
  bookingServiceSchema,
  bookingSettingsSchema,
  resourceSchema,
  bookingExperienceSchema,
} from "../bookings/contract";
async function manager(website: string) {
  if (process.env.VIGIL_BOOKINGS_ENABLED !== "true")
    throw new ValidationError("Bookings are not enabled yet.");
  const ctx = await requireOrgContextOrThrow();
  if (!ctx.staffRole && !["owner", "manager"].includes(ctx.role))
    throw new ForbiddenError("An owner or manager must manage appointments.");
  const client = await createClient(),
    { data, error } = await client
      .from("websites")
      .select("id")
      .eq("id", z.uuid().parse(website))
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();
  if (error) throw error;
  if (!data) throw new ForbiddenError();
  return { client, ctx };
}
export async function saveBookingExperience(
  website: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website);
    const input = bookingExperienceSchema.parse({
      presentation: form.get("presentation"),
      datePicker: form.get("datePicker"),
      showResource: form.has("showResource"),
      resourceLabel: form.get("resourceLabel"),
      title: form.get("title"),
      introduction: form.get("introduction"),
      buttonLabel: form.get("buttonLabel"),
      accent: form.get("accent"),
    });
    const { error } = await client.rpc("save_booking_experience", {
      p_website: website,
      p_experience: input,
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
function refresh() {
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}
function failure(error: { code?: string } | null) {
  if (!error) return;
  throw new ValidationError(
    error.code === "23P01"
      ? "That time is no longer available. Choose another time."
      : error.code === "40001"
        ? "The appointment changed. Refresh before trying again."
        : "Check the settings, plan eligibility and availability, then try again.",
  );
}
export async function saveBookingSettings(
  website: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { client, ctx } = await manager(website),
      settings = bookingSettingsSchema.parse({
        timeZone: form.get("timeZone"),
        enabled: form.has("enabled"),
        acknowledgeAvailability: form.has("acknowledgeAvailability"),
        minimumNotice: Number(form.get("minimumNotice")),
        horizonDays: Number(form.get("horizonDays")),
        changeNotice: Number(form.get("changeNotice")),
      });
    const component =
      ctx.staffRole && form.has("componentReviewed")
        ? { p_component_ready: form.has("componentReady") }
        : {};
    const { error } = await client.rpc("configure_bookings", {
      p_website: website,
      p_settings: settings,
      ...component,
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
export async function saveBookingResource(
  website: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website),
      hours = JSON.parse(z.string().max(8000).parse(form.get("hours")));
    const input = resourceSchema.parse({
      ...(form.get("id") ? { id: form.get("id") } : {}),
      name: form.get("name"),
      active: form.has("active"),
      hours,
    });
    const { error } = await client.rpc("save_booking_resource", {
      p_website: website,
      p_resource: input,
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
export async function saveBookingService(
  website: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website),
      input = bookingServiceSchema.parse({
        ...(form.get("id") ? { id: form.get("id") } : {}),
        resourceId: form.get("resourceId"),
        name: form.get("name"),
        description: form.get("description"),
        duration: Number(form.get("duration")),
        bufferBefore: Number(form.get("bufferBefore")),
        bufferAfter: Number(form.get("bufferAfter")),
        mode: form.get("mode"),
        active: form.has("active"),
      });
    const { error } = await client.rpc("save_booking_service", {
      p_website: website,
      p_service: input,
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
export async function changeBooking(
  website: string,
  id: string,
  revision: number,
  action: string,
  start?: string,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website);
    z.enum([
      "confirm",
      "decline",
      "cancel",
      "complete",
      "no_show",
      "reschedule",
      "approve_reschedule",
      "decline_reschedule",
    ]).parse(action);
    z.number().int().positive().parse(revision);
    const { data } = await client
      .from("appointments")
      .select("id")
      .eq("id", z.uuid().parse(id))
      .eq("website_id", website)
      .maybeSingle();
    if (!data) throw new ForbiddenError();
    const { error } = await client.rpc("manage_booking", {
      p_id: id,
      p_action: action,
      p_revision: revision,
      ...(start ? { p_start: z.iso.datetime().parse(start) } : {}),
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
export async function blockBookingDays(
  website: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website),
      id = z.uuid().parse(form.get("resource"));
    const { data } = await client
      .from("booking_resources")
      .select("id")
      .eq("id", id)
      .eq("website_id", website)
      .maybeSingle();
    if (!data) throw new ForbiddenError();
    const { error } = await client.rpc("block_booking_days", {
      p_resource: id,
      p_from: z.iso.date().parse(form.get("from")),
      p_through: z.iso.date().parse(form.get("through")),
      p_reason: z.string().max(300).parse(form.get("reason")),
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
export async function removeBookingBlock(
  website: string,
  resource: string,
  id: string,
): Promise<ActionResult> {
  try {
    const { client } = await manager(website),
      { data } = await client
        .from("booking_resources")
        .select("id")
        .eq("id", z.uuid().parse(resource))
        .eq("website_id", website)
        .maybeSingle();
    if (!data) throw new ForbiddenError();
    const { error } = await client.rpc("save_booking_block", {
      p_resource: resource,
      p_start: new Date().toISOString(),
      p_end: new Date().toISOString(),
      p_reason: "",
      p_remove: z.uuid().parse(id),
    });
    failure(error);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
