import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { calendarConnectionStatus } from "@/lib/vigil/bookings/google/service";
const notices: Record<string, string> = {
  connected:
    "Google Calendar connected. Upcoming appointments and unavailable time are queued for copying.",
  disconnected:
    "Calendar disconnected. Saved access was removed; existing Google copies remain.",
  cancelled: "Connection cancelled. Your calendar connection was not changed.",
  busy: "A sync is finishing. Try disconnecting again in a moment.",
  setup: "Google Calendar connection setup is not available yet.",
  error: "The calendar could not be connected. Please try again.",
};
export function BookingGoogleCalendar({
  status,
  website,
  canConnect,
  canStart = true,
  notice,
}: {
  status: Awaited<ReturnType<typeof calendarConnectionStatus>>;
  website: string;
  canConnect: boolean;
  canStart?: boolean;
  notice?: string;
}) {
  const connection = status.connection,
    connected = connection && connection.status !== "disconnected";
  return (
    <section className="lead-detail-panel">
      <h2 className="lead-panel-heading">
        <CalendarDays size={16} /> Google Calendar
      </h2>
      <div className="lead-panel-body">
        <p className="lead-settings-note">
          Copy this website’s appointments and blocked time into a separate
          Vigil calendar in your Google account. Vigil manages availability;
          edits made in Google do not update Vigil. Approval requests appear as
          tentative and do not reserve time.
        </p>
        {notice && Object.hasOwn(notices, notice) && (
          <p role="status" className="lead-settings-note">
            {notices[notice]}
          </p>
        )}
        {connected && (
          <p className="lead-settings-note">
            Connected as {connection.email}.{" "}
            {connection.lastSyncedAt
              ? `Last updated ${new Date(connection.lastSyncedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC.`
              : "Waiting for the first sync."}{" "}
            {!status.configured
              ? "Google sync is paused. You can disconnect below."
              : connection.status === "attention"
                ? "Reconnect Google to resume updates."
                : connection.status === "retrying"
                  ? "An update is delayed. Vigil will retry automatically."
                  : canStart
                    ? "Updates normally appear within a few minutes."
                    : "Sync is paused while your plan does not include bookings. You can disconnect below."}
          </p>
        )}
        {canConnect ? (
          <div className="booking-actions">
            {status.configured &&
            canStart &&
            (!connected || connection.status === "attention") ? (
              <form method="post" action="/api/booking-calendar/connect">
                <input type="hidden" name="website" value={website} />
                <button className="lead-button" data-primary="true">
                  {connected
                    ? "Reconnect Google Calendar"
                    : "Connect Google Calendar"}
                </button>
              </form>
            ) : !connected ? (
              <p className="lead-settings-note">
                {canStart
                  ? "Google Calendar connection is being prepared. Your Vigil bookings continue to work."
                  : "Care or higher is required to connect or resume syncing."}
              </p>
            ) : null}
            {connected && (
              <form method="post" action="/api/booking-calendar/disconnect">
                <input type="hidden" name="website" value={website} />
                <button className="lead-button">Disconnect calendar</button>
              </form>
            )}
          </div>
        ) : (
          <p className="lead-settings-note">
            The business owner or manager can connect their own Google account
            from their dashboard.
          </p>
        )}
        <p className="lead-footnote">
          Only this site’s calendar is copied. Customer invitations and default
          Google reminders are not sent. Disconnect removes saved access and
          stops future copies; existing copies remain in Google.{" "}
          <Link href="/calendar-privacy" className="underline">
            Calendar connection privacy
          </Link>
        </p>
      </div>
    </section>
  );
}
