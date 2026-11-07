import Link from "next/link";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { calendarConnectionStatus } from "@/lib/vigil/bookings/google/service";
import { BookingSetup } from "@/components/vigil/BookingSetup";
import { BookingAccessWall } from "@/components/vigil/BookingAccessWall";
import { z } from "zod";
import { CalendarDays, Settings2 } from "lucide-react";
import { getBookings } from "@/lib/vigil/queries/bookings";
import { appointmentStatus } from "@/lib/vigil/bookings/data";
import { BookingAppointmentCard } from "@/components/vigil/BookingAppointmentCard";
import {
  BookingViewport,
  BookingRecordWorkspace,
} from "@/components/vigil/BookingWorkspace";
import { BookingCalendar } from "@/components/vigil/BookingCalendar";
import {
  calendarModes,
  businessDate,
  type CalendarMode,
} from "@/lib/vigil/bookings/calendar";
import "@/components/vigil/lead-hub.css";
import "@/components/vigil/bookings.css";
export const metadata = { title: "Bookings" };
export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireOrgContext("/dashboard/bookings"),
    ent = await resolveEntitlements(ctx.organization.id);
  if (!ent.enabled(FEATURES.bookings))
    return <BookingAccessWall mode="upgrade" />;
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
      {
        mode: calendarModes.includes(params.calendar as CalendarMode)
          ? (params.calendar as CalendarMode)
          : "week",
        date: typeof params.date === "string" ? params.date : undefined,
        appointment:
          typeof params.appointment === "string"
            ? params.appointment
            : undefined,
      },
    );
  if (!data.enabled && data.notRequested) {
    const sites = await getOrgWebsites(ctx.organization.id);
    const selected = sites.find((s) => s.id === params.website) ?? sites[0];
    return (
      <BookingAccessWall
        mode="request"
        canRequest={ent.enabled(FEATURES.requests)}
        websiteId={selected?.id}
      />
    );
  }
  const canManage =
      Boolean(data.ctx.staffRole) ||
      ["owner", "manager"].includes(data.ctx.role),
    website = data.site?.id ?? "",
    href = (v: string, p = 1) =>
      `/dashboard/bookings?website=${website}&view=${v}&page=${p}${z.uuid().safeParse(params.lead).success ? `&lead=${params.lead}` : ""}`;
  const calendarStatus =
    data.enabled &&
    view === "setup" &&
    !ctx.isImpersonating &&
    ["owner", "manager"].includes(ctx.role)
      ? await calendarConnectionStatus(ctx.user.id, website)
      : { configured: false, connection: null };
  const recordAppointment = data.enabled
    ? (data.appointments.find((a) => a.id === params.appointment) ??
      data.appointments[0])
    : undefined;
  const recordDetail =
    data.enabled && recordAppointment ? (
      <BookingAppointmentCard
        a={recordAppointment}
        website={website}
        canManage={canManage}
        eligible={data.eligible}
        asOf={data.asOf}
        events={data.events}
      />
    ) : (
      <div className="bc-empty">
        <CalendarDays />
        <p>Select an appointment to see its details.</p>
      </div>
    );
  return (
    <div className="lead-hub booking-workspace">
      <header className="lead-page-heading booking-page-heading">
        <div>
          <h1>Bookings</h1>
          <p>Your schedule, customer requests and booking preferences.</p>
        </div>
      </header>
      {!data.enabled ? (
        <div className="lead-empty">
          <CalendarDays size={28} />
          <h2>
            {data.notRequested
              ? "Your website uses contact inquiries"
              : "Bookings are unavailable"}
          </h2>
          <p>
            {data.notRequested
              ? "Booking setup is only needed for websites that request appointment scheduling. Your contact inquiries are available in Lead Hub."
              : "Standard appointments are included with Care or higher on compatible sites. Public bookings stay paused until services, availability and activation are reviewed."}
          </p>
          {data.notRequested && (
            <Link className="lead-button" href="/dashboard/leads">
              Open Lead Hub
            </Link>
          )}
        </div>
      ) : (
        <>
          <div
            className="booking-toolbar"
            data-online={Boolean(data.settings?.enabled && data.eligible)}
          >
            {data.sites.length === 1 ? (
              <strong className="booking-site-name">{data.site?.name}</strong>
            ) : (
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
            )}
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
                {value === "upcoming"
                  ? "Calendar"
                  : value[0].toUpperCase() + value.slice(1)}
              </Link>
            ))}
          </nav>
          {view === "upcoming" && data.calendar ? (
            <BookingViewport>
              <BookingCalendar
                key={website}
                website={website}
                timeZone={data.settings?.time_zone ?? "UTC"}
                mode={data.calendar.mode}
                date={data.calendar.date}
                today={businessDate(
                  data.asOf,
                  data.settings?.time_zone ?? "UTC",
                )}
                rows={data.appointments.map((a) => ({
                  id: a.id,
                  name: (a.contact as { name?: string }).name ?? "Customer",
                  service: a.service_name,
                  status: appointmentStatus(a, data.asOf),
                  start: a.starts_at,
                  end: a.ends_at,
                  resource: a.resource_id,
                }))}
                resources={data.resources.map((r) => ({
                  id: r.id,
                  name: r.name,
                  hours: r.hours as {
                    day: number;
                    start: string;
                    end: string;
                  }[],
                }))}
                blocks={data.blocks}
                truncated={data.count > 500 || data.blocks.length === 500}
                selected={data.calendar.selected}
                detail={
                  data.appointments.find(
                    (a) => a.id === data.calendar?.selected,
                  ) ? (
                    <BookingAppointmentCard
                      a={
                        data.appointments.find(
                          (a) => a.id === data.calendar?.selected,
                        )!
                      }
                      website={website}
                      canManage={canManage}
                      eligible={data.eligible}
                      asOf={data.asOf}
                      events={data.events}
                    />
                  ) : null
                }
              />
            </BookingViewport>
          ) : view !== "setup" ? (
            <BookingViewport>
              <BookingRecordWorkspace
                selected={recordAppointment?.id}
                detail={recordDetail}
              >
                <div className="booking-record-list">
                  <header className="booking-section-heading">
                    <div>
                      <h2>
                        {view === "requests"
                          ? "Needs your review"
                          : "Appointment history"}
                      </h2>
                      <p>
                        {view === "requests"
                          ? "Approve new appointments and requested time changes."
                          : "Past appointments, cancellations and closed requests."}
                      </p>
                    </div>
                    <span className="booking-count">{data.count}</span>
                  </header>
                  <div className="booking-record-scroll">
                    {data.appointments.length ? (
                      data.appointments.map((a) => {
                        const selected =
                          data.appointments.find(
                            (a) => a.id === params.appointment,
                          ) ?? data.appointments[0];
                        const contact = a.contact as { name?: string };
                        const status = appointmentStatus(a, data.asOf);
                        return (
                          <Link
                            key={a.id}
                            href={`${href(view, page)}&appointment=${a.id}`}
                            scroll={false}
                            className="booking-record"
                            aria-current={
                              a.id === selected?.id ? "true" : undefined
                            }
                          >
                            <span className="booking-record-date">
                              <strong>
                                {new Intl.DateTimeFormat("en-US", {
                                  timeZone: a.time_zone,
                                  day: "numeric",
                                }).format(new Date(a.starts_at))}
                              </strong>
                              <small>
                                {new Intl.DateTimeFormat("en-US", {
                                  timeZone: a.time_zone,
                                  month: "short",
                                }).format(new Date(a.starts_at))}
                              </small>
                            </span>
                            <span className="booking-record-name">
                              <strong>{contact.name ?? "Customer"}</strong>
                              <small>
                                {a.service_name} ·{" "}
                                {new Intl.DateTimeFormat("en-US", {
                                  timeZone: a.time_zone,
                                  hour: "numeric",
                                  minute: "2-digit",
                                }).format(new Date(a.starts_at))}
                              </small>
                            </span>
                            <span
                              className="lead-status"
                              data-tone={
                                status === "confirmed" ? "accent" : "neutral"
                              }
                            >
                              {a.requested_start_at
                                ? "Time change"
                                : status === "requested"
                                  ? "New request"
                                  : status.replaceAll("_", " ")}
                            </span>
                            <span aria-hidden="true">›</span>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="bc-empty">
                        <CalendarDays size={28} />
                        <h3>
                          {view === "requests"
                            ? "You're all caught up"
                            : "No history yet"}
                        </h3>
                        <p>
                          {view === "requests"
                            ? "New appointment requests will appear here."
                            : "Finished appointments and closed requests will appear here."}
                        </p>
                      </div>
                    )}
                  </div>
                  <footer className="booking-pagination">
                    <span>
                      {data.count
                        ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, data.count)} of ${data.count}`
                        : "0 appointments"}{" "}
                      · {data.settings?.time_zone}
                    </span>
                    {page > 1 && (
                      <Link href={href(view, page - 1)}>Previous</Link>
                    )}
                    {page * 25 < data.count && (
                      <Link href={href(view, page + 1)}>Next</Link>
                    )}
                  </footer>
                </div>
                <aside
                  className="booking-record-detail"
                  aria-label="Appointment details"
                >
                  <div className="booking-section-heading">
                    <h2>Appointment details</h2>
                  </div>
                  {recordDetail}
                </aside>
              </BookingRecordWorkspace>
            </BookingViewport>
          ) : (
            <BookingSetup
              data={data}
              website={website}
              canManage={canManage}
              calendarStatus={calendarStatus}
              canConnect={
                !ctx.isImpersonating && ["owner", "manager"].includes(ctx.role)
              }
              notice={
                typeof params.calendarNotice === "string"
                  ? params.calendarNotice
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  );
}
