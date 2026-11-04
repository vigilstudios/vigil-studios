import Link from "next/link";
import { WeeklyAvailabilityEditor } from "@/components/vigil/WeeklyAvailabilityEditor";
import { z } from "zod";
import { CalendarDays, Inbox, Settings2 } from "lucide-react";
import { getBookings } from "@/lib/vigil/queries/bookings";
import { bookingTime } from "@/lib/vigil/bookings/contract";
import { appointmentStatus } from "@/lib/vigil/bookings/data";
import { ActionButton, ActionForm } from "@/components/vigil/ActionControls";
import { BookingRescheduleForm } from "@/components/vigil/BookingRescheduleForm";
import {
  saveBookingResource,
  saveBookingService,
  saveBookingSettings,
  changeBooking,
  blockBookingDays,
  removeBookingBlock,
} from "@/lib/vigil/actions/bookings";
import "@/components/vigil/lead-hub.css";
import "@/components/vigil/bookings.css";
export const metadata = { title: "Bookings · Lead Hub" };
const approachLabels = {
  contact: "Contact only",
  vigil: "Vigil bookings",
  existing: "Existing scheduler",
  custom: "Specialized scheduling",
} as const;
const modeLabels = {
  instant: "Instant confirmation",
  approval: "Requests for approval",
  both: "Choose per service",
} as const;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams,
    view = ["requests", "history", "setup"].includes(String(params.view))
      ? String(params.view)
      : "upcoming",
    page = Math.max(1, Math.min(10000, Number(params.page) || 1)),
    data = await getBookings(
      typeof params.website === "string" ? params.website : undefined,
      view,
      page,
      z.uuid().safeParse(params.lead).success ? String(params.lead) : undefined,
    );
  const canManage =
      Boolean(data.ctx.staffRole) ||
      ["owner", "manager"].includes(data.ctx.role),
    website = data.site?.id ?? "",
    href = (v: string, p = 1) =>
      `/dashboard/leads/bookings?website=${website}&view=${v}&page=${p}${z.uuid().safeParse(params.lead).success ? `&lead=${params.lead}` : ""}`;
  return (
    <div className="lead-hub booking-workspace">
      <header className="lead-page-heading">
        <div>
          <h1>Lead Hub</h1>
          <p>Appointments, requests and the next step with every customer.</p>
        </div>
        <Link href="/dashboard/leads" className="lead-button">
          <Inbox size={15} />
          Inbox
        </Link>
      </header>
      <nav className="lead-tabs" aria-label="Lead Hub views">
        <Link href="/dashboard/leads">Inbox</Link>
        <Link href={href("upcoming")} aria-current="page">
          <CalendarDays size={15} />
          Bookings
        </Link>
        <Link href="/dashboard/leads?view=settings">Settings</Link>
      </nav>
      {!data.enabled ? (
        <div className="lead-empty">
          <CalendarDays size={28} />
          <h2>Booking setup is coming to Lead Hub</h2>
          <p>
            Standard appointments are included with Care or higher on compatible
            sites. Websites keep their contact forms until services,
            availability and activation are reviewed.
          </p>
        </div>
      ) : (
        <>
          <div className="booking-toolbar">
            <form>
              <label className="lead-field">
                Website
                <select name="website" defaultValue={website}>
                  {data.sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="view" value={view} />
              <button className="lead-button">Choose website</button>
            </form>
            <p>
              {data.settings?.enabled && data.eligible
                ? "Online bookings enabled"
                : "Online bookings paused"}{" "}
              · {data.settings?.time_zone ?? "Choose a timezone during setup"}
            </p>
          </div>
          {!data.eligible && (
            <p className="lead-gmail-notice">
              Care or higher is required for new bookings. Appointment history,
              cancellation and attendance records remain available.
            </p>
          )}
          <nav className="lead-tabs" aria-label="Booking views">
            {["upcoming", "requests", "history", "setup"].map((value) => (
              <Link
                key={value}
                href={href(value)}
                aria-current={view === value ? "page" : undefined}
              >
                {value === "setup" ? <Settings2 size={15} /> : null}
                {value[0].toUpperCase() + value.slice(1)}
              </Link>
            ))}
          </nav>
          {view !== "setup" ? (
            <>
              <div className="booking-agenda">
                {data.appointments.length ? (
                  data.appointments.map((a) => {
                    const contact = a.contact as {
                        name?: string;
                        email?: string;
                        phone?: string;
                      },
                      status = appointmentStatus(a, data.asOf),
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
                              data-tone={
                                status === "confirmed" ? "accent" : "neutral"
                              }
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </header>
                          <div className="booking-contact">
                            <strong>{contact.name}</strong>
                            <a href={`mailto:${contact.email}`}>
                              {contact.email}
                            </a>
                            {contact.phone && <span>{contact.phone}</span>}
                            {a.lead_id && (
                              <Link href={`/dashboard/leads/${a.lead_id}`}>
                                View inquiry
                              </Link>
                            )}
                          </div>
                          {a.notes && <p className="lead-message">{a.notes}</p>}
                          {a.requested_start_at && (
                            <p>
                              Requested time change:{" "}
                              {bookingTime(a.requested_start_at, a.time_zone)}.
                              The original appointment remains reserved.
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
                                    disabled={!data.eligible}
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
                              {status === "confirmed" &&
                                Date.parse(a.starts_at) <= data.asOf && (
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
                              {data.eligible && (
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
                            {data.events
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
                  })
                ) : (
                  <div className="lead-empty">
                    <CalendarDays size={28} />
                    <h2>
                      {view === "requests"
                        ? "No requests awaiting approval"
                        : "No appointments in this view"}
                    </h2>
                    <p>
                      {view === "upcoming"
                        ? "Confirmed appointments from your connected website will appear here. Requests stay separate until approved."
                        : "Choose another view or review booking setup."}
                    </p>
                    <Link href={href("setup")} className="lead-button">
                      Review setup
                    </Link>
                  </div>
                )}
              </div>
              <div className="booking-pagination">
                <span>
                  {data.count}{" "}
                  {data.count === 1 ? "appointment" : "appointments"} in this
                  view
                </span>
                {page > 1 && <Link href={href(view, page - 1)}>Previous</Link>}
                {page * 25 < data.count && (
                  <Link href={href(view, page + 1)}>Next</Link>
                )}
              </div>
            </>
          ) : (
            <div className="booking-setup">
              <section className="lead-detail-panel">
                <h2 className="lead-panel-heading">Website activation</h2>
                <div className="lead-panel-body">
                  <p className="lead-settings-note">
                    Vigil must verify that your site has a compatible booking
                    component. Services and availability need your review before
                    appointments go live. Existing external booking links remain
                    separate.
                  </p>
                  {data.bookingNeeds?.approach && (
                    <p className="lead-settings-note">
                      Onboarding request:{" "}
                      {approachLabels[data.bookingNeeds.approach]} ·{" "}
                      {modeLabels[data.bookingNeeds.mode]}.{" "}
                      {data.bookingNeeds.services}
                    </p>
                  )}
                  {canManage ? (
                    <ActionForm
                      action={saveBookingSettings.bind(null, website)}
                      submitLabel="Save booking settings"
                      className="lead-form"
                    >
                      <div className="lead-form-fields">
                        <label className="lead-field">
                          Business timezone
                          <input
                            name="timeZone"
                            defaultValue={
                              data.settings?.time_zone ??
                              data.bookingNeeds?.timeZone ??
                              "America/New_York"
                            }
                            required
                            maxLength={100}
                          />
                          <small>Use a region such as America/New_York.</small>
                        </label>
                        <label className="lead-field">
                          Minimum notice (minutes)
                          <input
                            name="minimumNotice"
                            type="number"
                            min={0}
                            max={43200}
                            defaultValue={data.settings?.minimum_notice ?? 60}
                          />
                        </label>
                        <label className="lead-field">
                          Book ahead (days)
                          <input
                            name="horizonDays"
                            type="number"
                            min={1}
                            max={180}
                            defaultValue={data.settings?.horizon_days ?? 90}
                          />
                        </label>
                        <label className="lead-field">
                          Online change cutoff (minutes)
                          <input
                            name="changeNotice"
                            type="number"
                            min={0}
                            max={10080}
                            defaultValue={data.settings?.change_notice ?? 120}
                          />
                        </label>
                      </div>
                      <label className="booking-check">
                        <input
                          type="checkbox"
                          name="enabled"
                          defaultChecked={data.settings?.enabled}
                          disabled={!data.eligible}
                        />
                        Accept online bookings
                      </label>
                      <label className="booking-check">
                        <input type="checkbox" name="acknowledgeAvailability" />
                        I reviewed timezone and availability. I will keep all
                        unavailable time blocked in Vigil. External calendars
                        are not synchronized.
                      </label>
                      <p className="lead-footnote">
                        Customers receive an on-screen receipt and private
                        management link. Automated emails, reminders and
                        calendar connections are not enabled.
                      </p>
                      {data.ctx.staffRole ? (
                        <>
                          <input
                            type="hidden"
                            name="componentReviewed"
                            value="yes"
                          />
                          <label className="booking-check">
                            <input
                              type="checkbox"
                              name="componentReady"
                              defaultChecked={data.settings?.component_ready}
                            />
                            Vigil verified the deployed booking component and
                            registered website origin
                          </label>
                        </>
                      ) : (
                        <p className="lead-footnote">
                          Website component:{" "}
                          {data.settings?.component_ready
                            ? "verified"
                            : "awaiting Vigil verification"}
                        </p>
                      )}
                    </ActionForm>
                  ) : (
                    <p>An owner or manager can configure booking settings.</p>
                  )}
                </div>
              </section>
              <section className="lead-detail-panel">
                <h2 className="lead-panel-heading">People & availability</h2>
                <div className="lead-panel-body">
                  <p className="lead-settings-note">
                    Each resource represents one person or appointment space.
                    Only one confirmed appointment can occupy it at a time,
                    including buffers. This does not allocate restaurant tables
                    or group capacity.
                  </p>
                  {[
                    ...data.resources,
                    ...(canManage && data.eligible ? [null] : []),
                  ].map((resource) => (
                    <details key={resource?.id ?? "new"}>
                      <summary>
                        {resource?.name ?? "Add a person or appointment space"}
                      </summary>
                      {canManage && data.eligible ? (
                        <ActionForm
                          action={saveBookingResource.bind(null, website)}
                          submitLabel="Save availability"
                          className="lead-form"
                        >
                          {resource && (
                            <input
                              name="id"
                              type="hidden"
                              value={resource.id}
                            />
                          )}
                          <label className="lead-field">
                            Name
                            <input
                              name="name"
                              defaultValue={resource?.name ?? ""}
                              required
                              maxLength={120}
                            />
                          </label>
                          <label className="booking-check">
                            <input
                              type="checkbox"
                              name="active"
                              defaultChecked={resource?.active ?? true}
                            />
                            Active
                          </label>
                          <p className="lead-footnote">
                            Weekly availability ·{" "}
                            {data.settings?.time_zone ?? "business timezone"}
                          </p>
                          <WeeklyAvailabilityEditor
                            key={resource?.updated_at ?? "new"}
                            id={resource?.id ?? "new"}
                            initial={
                              (resource?.hours ?? []) as {
                                day: number;
                                start: string;
                                end: string;
                              }[]
                            }
                          />
                        </ActionForm>
                      ) : (
                        <p>{resource?.active ? "Active" : "Inactive"}</p>
                      )}
                    </details>
                  ))}
                </div>
              </section>
              <section className="lead-detail-panel">
                <h2 className="lead-panel-heading">Services</h2>
                <div className="lead-panel-body">
                  {[
                    ...data.services,
                    ...(canManage && data.eligible && data.resources.length
                      ? [null]
                      : []),
                  ].map((service) => (
                    <details key={service?.id ?? "new"}>
                      <summary>
                        {service?.name ?? "Add a bookable service"}
                      </summary>
                      {canManage && data.eligible ? (
                        <ActionForm
                          action={saveBookingService.bind(null, website)}
                          submitLabel="Save service"
                          className="lead-form"
                        >
                          {service && (
                            <input type="hidden" name="id" value={service.id} />
                          )}
                          <div className="lead-form-fields">
                            <label className="lead-field">
                              Service name
                              <input
                                name="name"
                                defaultValue={service?.name ?? ""}
                                required
                                maxLength={120}
                              />
                            </label>
                            <label className="lead-field">
                              Person or space
                              <select
                                name="resourceId"
                                defaultValue={service?.resource_id}
                              >
                                {data.resources.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="lead-field">
                              Duration (minutes)
                              <input
                                type="number"
                                name="duration"
                                min={15}
                                max={480}
                                step={15}
                                defaultValue={service?.duration ?? 30}
                              />
                            </label>
                            <label className="lead-field">
                              Confirmation
                              <select
                                name="mode"
                                defaultValue={service?.mode ?? "approval"}
                              >
                                <option value="instant">
                                  Confirm instantly
                                </option>
                                <option value="approval">
                                  Approve requests first
                                </option>
                              </select>
                            </label>
                            <label className="lead-field">
                              Buffer before (minutes)
                              <input
                                name="bufferBefore"
                                type="number"
                                min={0}
                                max={120}
                                step={15}
                                defaultValue={service?.buffer_before ?? 0}
                              />
                            </label>
                            <label className="lead-field">
                              Buffer after (minutes)
                              <input
                                name="bufferAfter"
                                type="number"
                                min={0}
                                max={120}
                                step={15}
                                defaultValue={service?.buffer_after ?? 0}
                              />
                            </label>
                          </div>
                          <label className="lead-field">
                            Description
                            <textarea
                              name="description"
                              maxLength={600}
                              defaultValue={service?.description ?? ""}
                            />
                          </label>
                          <label className="booking-check">
                            <input
                              type="checkbox"
                              name="active"
                              defaultChecked={service?.active ?? false}
                            />
                            Available to book
                          </label>
                        </ActionForm>
                      ) : (
                        <p>
                          {service?.duration} minutes · {service?.mode}
                        </p>
                      )}
                    </details>
                  ))}
                  {!data.resources.length && (
                    <p>
                      Add a person or appointment space before creating a
                      service.
                    </p>
                  )}
                </div>
              </section>
              <section className="lead-detail-panel">
                <h2 className="lead-panel-heading">Blocked dates</h2>
                <div className="lead-panel-body">
                  <p className="lead-settings-note">
                    Block holidays or days away in your business timezone.
                    Existing appointments remain recorded; contact those
                    customers if their appointment must change.
                  </p>
                  {canManage && data.eligible && !!data.resources.length && (
                    <ActionForm
                      action={blockBookingDays.bind(null, website)}
                      submitLabel="Block dates"
                      className="lead-form"
                    >
                      <div className="lead-form-fields">
                        <label className="lead-field">
                          Person or space
                          <select name="resource" required>
                            {data.resources.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="lead-field">
                          First date
                          <input type="date" name="from" required />
                        </label>
                        <label className="lead-field">
                          Last date
                          <input type="date" name="through" required />
                        </label>
                        <label className="lead-field">
                          Reason
                          <input name="reason" maxLength={300} />
                        </label>
                      </div>
                    </ActionForm>
                  )}
                  {data.blocks.map((block) => (
                    <div key={block.id} className="booking-block">
                      <p>
                        {
                          data.resources.find((r) => r.id === block.resource_id)
                            ?.name
                        }{" "}
                        ·{" "}
                        {bookingTime(
                          block.starts_at,
                          data.settings?.time_zone ?? "UTC",
                        )}{" "}
                        –{" "}
                        {bookingTime(
                          block.ends_at,
                          data.settings?.time_zone ?? "UTC",
                        )}{" "}
                        · {block.reason}
                      </p>
                      {canManage && (
                        <ActionButton
                          action={removeBookingBlock.bind(
                            null,
                            website,
                            block.resource_id,
                            block.id,
                          )}
                        >
                          Remove block
                        </ActionButton>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
