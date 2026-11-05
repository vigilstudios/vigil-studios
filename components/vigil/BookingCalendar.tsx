"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Clock3,
  Users,
} from "lucide-react";
import {
  calendarRange,
  shiftCalendar,
  positionEvents,
  type CalendarMode,
  type CalendarAppointment,
} from "@/lib/vigil/bookings/calendar";
type Block = {
  id: string;
  resource_id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
};
export function BookingCalendar({
  website,
  timeZone,
  mode,
  date,
  today,
  rows,
  resources,
  blocks,
  truncated,
  selected,
  detail,
}: {
  website: string;
  timeZone: string;
  mode: CalendarMode;
  date: string;
  today: string;
  rows: CalendarAppointment[];
  resources: { id: string; name: string }[];
  blocks: Block[];
  truncated: boolean;
  selected: string | null;
  detail: ReactNode;
}) {
  const router = useRouter(),
    scroll = useRef<HTMLDivElement>(null),
    [resource, setResource] = useState("");
  const range = calendarRange(mode, date, timeZone),
    visible = rows.filter(
      (e) => (!resource || e.resource === resource) && e.status !== "expired",
    ),
    days = range.days;
  const dayRanges = new Map(
    days.map((day) => [day, calendarRange("day", day, timeZone)]),
  );
  const blocksFor = (day: string) => {
    const bounds = dayRanges.get(day)!;
    return blocks.filter(
      (b) =>
        (!resource || b.resource_id === resource) &&
        b.starts_at < bounds.end &&
        b.ends_at > bounds.start,
    );
  };
  const label = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(
      new Date(day + "T12:00:00Z"),
    );
  const time = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  function go(nextMode = mode, nextDate = date, appointment?: string) {
    const url = new URL(location.href);
    url.searchParams.set("website", website);
    url.searchParams.set("view", "upcoming");
    url.searchParams.set("calendar", nextMode);
    url.searchParams.set("date", nextDate);
    url.searchParams.delete("page");
    if (appointment) url.searchParams.set("appointment", appointment);
    else url.searchParams.delete("appointment");
    router.push(url.pathname + url.search, { scroll: false });
  }
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 7 * 64;
  }, [date, mode]);
  function event(e: CalendarAppointment, compact = false) {
    return (
      <button
        key={e.id}
        type="button"
        className={`bc-event ${compact ? "bc-event-compact" : ""}`}
        data-status={e.status}
        data-selected={e.id === selected}
        onClick={() => go(mode, date, e.id)}
        title={`${e.service} · ${e.name} · ${time(e.start)}–${time(e.end)} · ${timeZone} · ${e.status}`}
        aria-label={`${e.service} with ${e.name}, ${time(e.start)} to ${time(e.end)}, ${timeZone}, ${e.status}`}
      >
        <span>
          <i />
          {time(e.start)}
          {mode === "agenda" && ` – ${time(e.end)}`}
        </span>
        <strong>{e.service}</strong>
        <small>
          {e.name}
          {e.status === "requested" ? " · Awaiting approval" : ""}
        </small>
      </button>
    );
  }
  const confirmed = visible.filter((e) => e.status === "confirmed").length,
    requests = visible.filter((e) => e.status === "requested").length;
  return (
    <section className="bc-workspace" aria-label="Appointment calendar">
      <div className="bc-summary">
        <div>
          <CalendarDays size={18} />
          <span>
            <strong>{confirmed}</strong> confirmed
          </span>
        </div>
        <div>
          <Clock3 size={18} />
          <span>
            <strong>{requests}</strong> awaiting approval
          </span>
        </div>
        <div>
          <Users size={18} />
          <span>
            <strong>
              {resources.filter((r) => !resource || r.id === resource).length}
            </strong>{" "}
            people & spaces
          </span>
        </div>
        <p>{timeZone.replaceAll("_", " ")}</p>
      </div>
      <div className="bc-toolbar">
        <div className="bc-date-nav">
          <button
            aria-label="Previous period"
            onClick={() => go(mode, shiftCalendar(date, mode, -1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(mode, today)}>Today</button>
          <button
            aria-label="Next period"
            onClick={() => go(mode, shiftCalendar(date, mode, 1))}
          >
            <ChevronRight size={16} />
          </button>
          <h2>
            {mode === "month"
              ? label(date, { month: "long", year: "numeric" })
              : mode === "week"
                ? `${label(days[0], { month: "short", day: "numeric" })} – ${label(days[6], { month: "short", day: "numeric", year: "numeric" })}`
                : label(date, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
          </h2>
        </div>
        <div className="bc-controls">
          <label className="lead-sr-only" htmlFor="calendar-resource">
            Calendar resource
          </label>
          <select
            id="calendar-resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="">Everyone</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="bc-modes" role="group" aria-label="Calendar view">
            {(["day", "week", "month", "agenda"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={value === mode}
                onClick={() => go(value, date)}
              >
                {value === "agenda" && <List size={13} />}{" "}
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {truncated && (
        <p role="status" className="bc-notice">
          This period reaches the display limit of 500 appointments or time
          blocks. Switch to a shorter period to review the complete schedule.
        </p>
      )}
      <div className="bc-layout">
        <div className="bc-calendar" data-mode={mode}>
          {mode === "month" ? (
            <>
              <div className="bc-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="bc-month">
                {days.map((day) => {
                  const bounds = dayRanges.get(day)!;
                  const events = visible.filter(
                    (e) => e.start < bounds.end && e.end > bounds.start,
                  );
                  const blocked = blocksFor(day);
                  return (
                    <div
                      key={day}
                      className="bc-month-day"
                      data-outside={day.slice(0, 7) !== date.slice(0, 7)}
                      data-today={day === today}
                    >
                      <button
                        className="bc-day-number"
                        onClick={() => go("day", day)}
                        aria-label={`Open ${label(day, { month: "long", day: "numeric", year: "numeric" })}`}
                      >
                        {Number(day.slice(-2))}
                      </button>
                      {blocked.length > 0 && (
                        <span className="bc-block-label">
                          {blocked.length} blocked
                        </span>
                      )}
                      {events.slice(0, 3).map((e) => event(e, true))}
                      {events.length > 3 && (
                        <button
                          className="bc-more"
                          onClick={() => go("day", day)}
                        >
                          +{events.length - 3} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : mode === "agenda" ? (
            <div className="bc-agenda-list">
              {visible.length ? (
                visible.map((e) => (
                  <div key={e.id}>
                    <span>{time(e.start)}</span>
                    {event(e)}
                  </div>
                ))
              ) : (
                <div className="bc-empty">
                  <CalendarDays />
                  <h3>Your day is clear</h3>
                  <p>Appointments for this day will appear here.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className="bc-time-head"
                style={{
                  gridTemplateColumns: `48px repeat(${days.length},minmax(90px,1fr))`,
                }}
              >
                <span />
                {days.map((day) => (
                  <button
                    key={day}
                    data-today={day === today}
                    onClick={() => go("day", day)}
                  >
                    {label(day, { weekday: "short" })}
                    <strong>{Number(day.slice(-2))}</strong>
                  </button>
                ))}
              </div>
              <div
                className="bc-blocks"
                style={{
                  gridTemplateColumns: `48px repeat(${days.length},minmax(90px,1fr))`,
                }}
              >
                <span>Blocks</span>
                {days.map((day) => (
                  <div key={day}>
                    {blocksFor(day).map((b) => (
                      <span key={b.id} title={b.reason}>
                        {resources.find((r) => r.id === b.resource_id)?.name} ·{" "}
                        {b.reason || "Unavailable"}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="bc-time-scroll" ref={scroll}>
                <div
                  className="bc-time-grid"
                  style={{
                    gridTemplateColumns: `48px repeat(${days.length},minmax(90px,1fr))`,
                  }}
                >
                  <div className="bc-hours">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <span key={hour} style={{ top: hour * 64 }}>
                        {hour === 0
                          ? "12 AM"
                          : hour < 12
                            ? `${hour} AM`
                            : hour === 12
                              ? "12 PM"
                              : `${hour - 12} PM`}
                      </span>
                    ))}
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="bc-day-lane"
                      aria-label={label(day, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    >
                      {positionEvents(visible, day, timeZone).map((p) => (
                        <div
                          key={p.event.id}
                          className="bc-positioned"
                          style={{
                            top: (p.top * 64) / 60,
                            height: Math.max(38, (p.height * 64) / 60),
                            left: `${(p.column / p.columns) * 100}%`,
                            width: `${100 / p.columns}%`,
                          }}
                        >
                          {event(p.event)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <footer className="bc-legend">
            <span>
              <i />
              Confirmed
            </span>
            <span>
              <i data-request />
              Approval request
            </span>
            <span>Gray: completed or no-show · Business timezone</span>
          </footer>
        </div>
        <aside className="bc-detail" aria-label="Selected appointment">
          <header>
            <span>APPOINTMENT DETAILS</span>
            <small>Select an appointment to manage it</small>
          </header>
          {(visible.some((e) => e.id === selected) ? detail : null) ?? (
            <div className="bc-empty">
              <CalendarDays />
              <p>No appointment selected</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
