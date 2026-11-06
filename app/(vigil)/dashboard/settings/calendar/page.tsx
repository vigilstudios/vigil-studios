import { requireOrgContext } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { calendarConnectionStatus } from "@/lib/vigil/bookings/google/service";
import { BookingGoogleCalendar } from "@/components/vigil/BookingGoogleCalendar";
import "@/components/vigil/lead-hub.css";
import "@/components/vigil/bookings.css";
export const metadata = { title: "Calendar connections" };
export default async function CalendarConnections() {
  const ctx = await requireOrgContext("/dashboard/settings/calendar");
  if (ctx.isImpersonating || !["owner", "manager"].includes(ctx.role))
    return (
      <p>
        The business owner or manager can manage their own calendar connections.
      </p>
    );
  const sites = await getOrgWebsites(ctx.organization.id),
    db = await createClient();
  const rows = await Promise.all(
    sites.map(async (site) => ({
      site,
      status: await calendarConnectionStatus(ctx.user.id, site.id),
      eligible: await db.rpc("booking_eligible", { p_website: site.id }),
    })),
  );
  return (
    <div className="lead-hub booking-workspace">
      <h1>Calendar connections</h1>
      <p>
        Saved Google Calendar access can be disconnected here even if your plan
        changes. Existing Google copies remain.
      </p>
      {rows
        .filter((row) => row.status.connection)
        .map((row) => (
          <div key={row.site.id}>
            <h2>{row.site.name}</h2>
            <BookingGoogleCalendar
              status={row.status}
              website={row.site.id}
              canConnect
              canStart={row.eligible.data === true}
            />
          </div>
        ))}
      {!rows.some((row) => row.status.connection) && (
        <p>No Google calendars are connected to your account.</p>
      )}
    </div>
  );
}
