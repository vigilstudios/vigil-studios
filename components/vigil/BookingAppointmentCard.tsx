import Link from "next/link";
import { ActionButton } from "./ActionControls";
import { BookingRescheduleForm } from "./BookingRescheduleForm";
import { changeBooking } from "@/lib/vigil/actions/bookings";
import { bookingTime } from "@/lib/vigil/bookings/contract";
import { appointmentStatus, type Appointment } from "@/lib/vigil/bookings/data";
export function BookingAppointmentCard({
  a,
  website,
  canManage,
  eligible,
  asOf,
  events,
}: {
  a: Appointment;
  website: string;
  canManage: boolean;
  eligible: boolean;
  asOf: number;
  events: {
    id: number;
    appointment_id: string;
    kind: string;
    created_at: string;
  }[];
}) {
  const contact = a.contact as {
      name?: string;
      email?: string;
      phone?: string;
    },
    status = appointmentStatus(a, asOf),
    open = ["requested", "confirmed"].includes(status);
  return (
    <article key={a.id} className="lead-detail-panel">
      <div className="lead-panel-body">
        <header className="booking-appointment-heading">
          <div>
            <h2>{a.service_name}</h2>
            <p>{bookingTime(a.starts_at, a.time_zone)}</p>
          </div>
          <span
            className="lead-status"
            data-tone={status === "confirmed" ? "accent" : "neutral"}
          >
            {status.replaceAll("_", " ")}
          </span>
        </header>
        <div className="booking-contact">
          <strong>{contact.name}</strong>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          {contact.phone && <span>{contact.phone}</span>}
          {a.lead_id && (
            <Link href={`/dashboard/leads/${a.lead_id}`}>View inquiry</Link>
          )}
        </div>
        {a.notes && <p className="lead-message">{a.notes}</p>}
        {a.requested_start_at && (
          <p>
            Requested time change:{" "}
            {bookingTime(a.requested_start_at, a.time_zone)}. The original
            appointment remains reserved.
          </p>
        )}
        {canManage && open && (
          <div className="booking-actions">
            {status === "requested" && (
              <>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "confirm",
                  )}
                  disabled={!eligible}
                  disabledReason="Care or higher is required to confirm new appointments."
                  variant="primary"
                >
                  Confirm request
                </ActionButton>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "decline",
                  )}
                >
                  Decline
                </ActionButton>
              </>
            )}
            {a.requested_start_at && (
              <>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "approve_reschedule",
                  )}
                >
                  Approve time change
                </ActionButton>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "decline_reschedule",
                  )}
                >
                  Keep current time
                </ActionButton>
              </>
            )}
            <ActionButton
              action={changeBooking.bind(
                null,
                website,
                a.id,
                a.revision,
                "cancel",
              )}
              confirmText="Cancel this appointment?"
            >
              Cancel
            </ActionButton>
            {status === "confirmed" && Date.parse(a.starts_at) <= asOf && (
              <>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "complete",
                  )}
                >
                  Mark completed
                </ActionButton>
                <ActionButton
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "no_show",
                  )}
                >
                  Mark no-show
                </ActionButton>
              </>
            )}
            {eligible && (
              <details>
                <summary>Change time</summary>
                <BookingRescheduleForm
                  action={changeBooking.bind(
                    null,
                    website,
                    a.id,
                    a.revision,
                    "reschedule",
                  )}
                />
              </details>
            )}
          </div>
        )}
        <details>
          <summary>Appointment history</summary>
          {events
            .filter((event) => event.appointment_id === a.id)
            .map((event) => (
              <p key={event.id} className="lead-footnote">
                {event.kind.replaceAll("_", " ")} ·{" "}
                {bookingTime(event.created_at, a.time_zone)}
              </p>
            ))}
        </details>
      </div>
    </article>
  );
}
