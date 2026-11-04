import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "../auth/session";
import { appointmentColumns } from "../bookings/data";
import { parseBrief } from "../onboarding/brief";
export async function getBookings(
  websiteId?: string,
  view = "upcoming",
  page = 1,
  lead?: string,
) {
  const asOf = Date.now();
  const ctx = await requireOrgContext("/dashboard/leads/bookings"),
    client = await createClient();
  const { data: sites, error } = await client
    .from("websites")
    .select("id,name,project_id,status")
    .eq("organization_id", ctx.organization.id)
    .order("created_at");
  if (error) throw error;
  const site = sites?.find((s) => s.id === websiteId) ?? sites?.[0];
  if (!site || process.env.VIGIL_BOOKINGS_ENABLED !== "true")
    return { asOf, ctx, sites: sites ?? [], site, enabled: false as const };
  let agenda = client
    .from("appointments")
    .select(appointmentColumns, { count: "exact" })
    .eq("organization_id", ctx.organization.id)
    .eq("website_id", site.id);
  if (view === "requests")
    agenda = agenda.or(
      `and(status.eq.requested,request_expires_at.gt.${new Date().toISOString()}),and(status.eq.confirmed,requested_start_at.not.is.null)`,
    );
  else if (view === "upcoming")
    agenda = agenda
      .eq("status", "confirmed")
      .gte("ends_at", new Date().toISOString());
  if (lead) agenda = agenda.eq("lead_id", lead);
  const [
    settings,
    resources,
    services,
    blocks,
    appointments,
    eligible,
    project,
  ] = await Promise.all([
    client
      .from("booking_settings")
      .select("*")
      .eq("website_id", site.id)
      .eq("organization_id", ctx.organization.id)
      .maybeSingle(),
    client
      .from("booking_resources")
      .select("*")
      .eq("website_id", site.id)
      .eq("organization_id", ctx.organization.id)
      .order("created_at"),
    client
      .from("booking_services")
      .select("*")
      .eq("website_id", site.id)
      .eq("organization_id", ctx.organization.id)
      .order("created_at"),
    client
      .from("booking_blocks")
      .select("*")
      .eq("website_id", site.id)
      .eq("organization_id", ctx.organization.id)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(100),
    agenda
      .order("starts_at", { ascending: view !== "history" })
      .order("id")
      .range((page - 1) * 25, page * 25 - 1),
    client.rpc("booking_eligible", { p_website: site.id }),
    site.project_id
      ? client
          .from("projects")
          .select("brief")
          .eq("id", site.project_id)
          .eq("organization_id", ctx.organization.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  for (const result of [
    settings,
    resources,
    services,
    blocks,
    appointments,
    eligible,
    project,
  ])
    if (result.error) throw result.error;
  const events = appointments.data?.length
    ? await client
        .from("appointment_events")
        .select("id,appointment_id,kind,created_at")
        .eq("organization_id", ctx.organization.id)
        .in(
          "appointment_id",
          appointments.data.map((a) => a.id),
        )
        .order("id")
        .limit(1000)
    : { data: [], error: null };
  if (events.error) throw events.error;
  return {
    asOf,
    events: events.data ?? [],
    ctx,
    sites: sites ?? [],
    site,
    enabled: true as const,
    settings: settings.data,
    resources: resources.data ?? [],
    services: services.data ?? [],
    blocks: blocks.data ?? [],
    appointments: appointments.data ?? [],
    count: appointments.count ?? 0,
    page,
    eligible: eligible.data === true,
    bookingNeeds: parseBrief(project.data?.brief).basics?.booking,
  };
}
