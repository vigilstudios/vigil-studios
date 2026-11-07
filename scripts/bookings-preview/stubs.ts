import {
  calendarRange,
  type CalendarMode,
} from "@/lib/vigil/bookings/calendar";
import { parseBrief } from "@/lib/vigil/onboarding/brief";
export async function getBookings(
  _website?: string,
  view = "upcoming",
  page = 1,
  _lead?: string,
  options?: { mode: CalendarMode; date?: string; appointment?: string },
) {
  if (new URLSearchParams(location.search).get("state") === "request")
    return {
      ctx: { role: "owner", staffRole: null },
      enabled: false as const,
      notRequested: true,
      site: undefined,
    };
  const website = "ba000000-0000-4000-8000-000000000021",
    org = "ba000000-0000-4000-8000-000000000011",
    resource = "ba000000-0000-4000-8000-000000000031",
    service = "ba000000-0000-4000-8000-000000000041",
    id = "ba000000-0000-4000-8000-000000000051",
    now = "2026-11-04T15:00:00Z";
  const mode = options?.mode ?? "week",
    date = options?.date ?? "2026-11-04";
  const data = {
    calendar:
      view === "upcoming"
        ? {
            mode,
            date,
            selected: (options?.appointment ?? id) as string | null,
          }
        : null,
    asOf: Date.parse("2026-11-04T12:00:00Z"),
    enabled: true as const,
    ctx: { role: "owner", staffRole: null },
    site: { id: website, name: "Marlow Studio" },
    sites: [{ id: website, name: "Marlow Studio" }],
    eligible: true,
    page,
    count: 8,
    settings: {
      enabled: new URLSearchParams(location.search).get("state") !== "paused",
      component_ready: true,
      time_zone: "America/New_York",
      minimum_notice: 60,
      horizon_days: 90,
      change_notice: 120,
    },
    bookingNeeds: parseBrief({
      basics: {
        businessName: "Marlow Studio",
        booking: {
          approach: "vigil",
          mode: "both",
          services: "Consultations and project reviews",
        },
      },
    }).basics?.booking,
    resources: [
      {
        id: resource,
        name: "Jordan · Studio",
        active: true,
        hours: [1, 2, 3, 4, 5].map((day) => ({
          day,
          start: "09:00",
          end: "17:00",
        })),
      },
    ],
    services: [
      {
        id: service,
        resource_id: resource,
        name: "Initial consultation",
        description: "Plan your next project with our team.",
        duration: 30,
        buffer_before: 15,
        buffer_after: 15,
        mode: "approval",
        active: true,
      },
    ],
    blocks: [],
    appointments: [
      {
        id,
        website_id: website,
        organization_id: org,
        service_id: service,
        resource_id: resource,
        lead_id: "ba000000-0000-4000-8000-000000000061",
        service_name: "Initial consultation",
        time_zone: "America/New_York",
        confirmation_mode: "approval",
        status: view === "requests" ? "requested" : "confirmed",
        starts_at: now,
        ends_at: "2026-11-04T15:30:00Z",
        reserved_from: "2026-11-04T14:45:00Z",
        reserved_until: "2026-11-04T15:45:00Z",
        duration: 30,
        buffer_before: 15,
        buffer_after: 15,
        requested_start_at: null,
        request_expires_at: view === "requests" ? "2026-11-04T14:00:00Z" : null,
        contact: { name: "Avery Parker", email: "avery@example.test" },
        notes: "I’d like to discuss a new project.",
        revision: 1,
        created_at: now,
        updated_at: now,
      },
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `ba000000-0000-4000-8000-${String(52 + i).padStart(12, "0")}`,
        website_id: website,
        organization_id: org,
        service_id: service,
        resource_id: resource,
        lead_id: null,
        service_name: i % 2 ? "Project review" : "Discovery call",
        time_zone: "America/New_York",
        confirmation_mode: "approval",
        status: i % 3 === 0 ? "requested" : "confirmed",
        starts_at: new Date(
          Date.parse(now) + [2, 4, 24, 27, 48, 52, 72][i] * 3600000,
        ).toISOString(),
        ends_at: new Date(
          Date.parse(now) + ([2, 4, 24, 27, 48, 52, 72][i] + 0.75) * 3600000,
        ).toISOString(),
        reserved_from: now,
        reserved_until: now,
        duration: 45,
        buffer_before: 0,
        buffer_after: 0,
        requested_start_at: null,
        request_expires_at: "2026-11-06T12:00:00Z",
        contact: {
          name: [
            "Morgan Lee",
            "Jamie Chen",
            "Taylor Brooks",
            "Alex Rivera",
            "Sam Bell",
            "Casey Hall",
            "Riley Green",
          ][i],
          email: "preview@example.test",
        },
        notes: "Fictional appointment for calendar review.",
        revision: 1,
        created_at: now,
        updated_at: now,
      })),
    ],
    events: [
      {
        id: 1,
        appointment_id: id,
        kind: view === "requests" ? "requested" : "confirmed",
        created_at: "2026-11-04T15:00:00Z",
      },
    ],
  };
  if (new URLSearchParams(location.search).get("business") === "restaurant") {
    data.site.name = data.sites[0].name = "Marlow Kitchen";
    Object.assign(data.settings, {
      dining_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        start: "11:00",
        end: "22:00",
      })),
    });
    data.resources = [2, 4, 6].map((seats, i) => ({
      ...data.resources[0],
      id: i ? `ba000000-0000-4000-8000-00000000003${i + 1}` : resource,
      name: `Table ${i + 1}`,
      kind: "table",
      min_party: 1,
      max_party: seats,
    }));
    Object.assign(data.services[0], {
      resource_id: null,
      allocation: "table_pool",
      name: "Dining reservation",
      description: "Reserve a table for your party.",
      duration: 90,
      buffer_after: 15,
    });
    data.appointments.forEach((a, i) => {
      Object.assign(a, {
        service_name: "Dining reservation",
        party_size: [2, 4, 6][i % 3],
        resource_id: data.resources[i % 3].id,
        duration: 90,
      });
      a.ends_at = new Date(Date.parse(a.starts_at) + 90 * 60000).toISOString();
    });
  }
  data.appointments.push({
    ...data.appointments[0],
    id: "ba000000-0000-4000-8000-000000000071",
    starts_at: "2026-11-03T15:00:00Z",
    ends_at: "2026-11-03T15:30:00Z",
    status: "completed",
    contact: { name: "Robin Blake", email: "robin@example.test" },
  });
  if (view === "upcoming") {
    const range = calendarRange(mode, date, "America/New_York");
    data.appointments = data.appointments.filter(
      (a) => a.starts_at < range.end && a.ends_at > range.start,
    );
  } else if (view === "requests") {
    data.appointments = data.appointments.filter(
      (a) => a.status === "requested",
    );
  }
  if (view === "history")
    data.appointments = data.appointments.filter(
      (a) =>
        ["completed", "no_show", "cancelled", "declined", "expired"].includes(
          a.status,
        ) || Date.parse(a.ends_at) < data.asOf,
    );
  data.count = data.appointments.length;
  if (data.calendar)
    data.calendar.selected =
      data.appointments.find((a) => a.id === options?.appointment)?.id ??
      data.appointments[0]?.id ??
      null;
  return data;
}
const preview = async () => ({
  ok: false as const,
  error: "Preview only. No changes were saved.",
});
export const saveBookingExperience = () => preview();
export const saveBookingTable = () => preview();
export const saveBookingDiningHours = () => preview();
export const saveBookingResource = () => preview(),
  saveBookingService = () => preview(),
  saveBookingSettings = () => preview(),
  changeBooking = () => preview(),
  blockBookingDays = () => preview(),
  removeBookingBlock = () => preview();

export async function requireOrgContext() {
  return {
    organization: { id: "ba000000-0000-4000-8000-000000000011" },
    user: { id: "ba000000-0000-4000-8000-000000000012" },
    role: "owner",
    isImpersonating:
      new URLSearchParams(location.search).get("state") === "staff",
  };
}
export const FEATURES = {
  bookings: "bookings.enabled",
  requests: "requests.enabled",
};
export async function resolveEntitlements() {
  return {
    enabled: () =>
      new URLSearchParams(location.search).get("state") !== "basic",
  };
}
export async function getOrgWebsites() {
  return [
    { id: "ba000000-0000-4000-8000-000000000021", name: "Marlow Studio" },
  ];
}
export async function calendarConnectionStatus() {
  return { configured: true, connection: null };
}
