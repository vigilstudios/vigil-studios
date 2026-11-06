import Link from "next/link";
import { PremiumWall } from "./PremiumWall";
export function BookingAccessWall({
  mode,
  canRequest = false,
  websiteId,
}: {
  mode: "upgrade" | "request";
  canRequest?: boolean;
  websiteId?: string;
}) {
  return (
    <div className="booking-workspace">
      <header className="lead-page-heading">
        <div>
          <h1>Bookings</h1>
          <p>Appointments, availability and customer requests in one place.</p>
        </div>
      </header>
      <PremiumWall
        feature="Bookings"
        previewKind="bookings"
        title={mode === "request" ? "Add bookings to your website" : undefined}
        planHint={
          mode === "upgrade"
            ? "Included with Care and higher"
            : "Included in your plan · Setup required"
        }
        description={
          mode === "upgrade"
            ? "Let customers choose a time on your website and manage appointments from your Vigil calendar. Upgrade to Care or higher to add booking to a compatible site."
            : "Your website currently uses contact inquiries. If you would like appointment scheduling, ask Vigil to add a compatible booking component and review your services and availability."
        }
        note={
          mode === "upgrade"
            ? "Upgrading does not automatically enable public bookings."
            : "Sending a request does not publish availability or enable bookings."
        }
        action={
          mode === "request" ? (
            <Link
              className="btn-primary premium-upgrade"
              href={
                canRequest
                  ? `/dashboard/requests${websiteId ? `?booking=${websiteId}` : ""}`
                  : "mailto:hello@vigilstudios.co?subject=Add%20Vigil%20bookings"
              }
            >
              {canRequest ? "Request booking setup" : "Contact Vigil"}
            </Link>
          ) : undefined
        }
      />
      <Link href="/dashboard/settings/calendar" className="lead-settings-note">
        Manage Google Calendar connections
      </Link>
    </div>
  );
}
