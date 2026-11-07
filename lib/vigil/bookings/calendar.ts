export const calendarModes = ["day", "week", "month", "agenda"] as const;
export type CalendarMode = (typeof calendarModes)[number];
const formatters = new Map<string, Intl.DateTimeFormat>();
export function businessDate(value: string | number, timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(timeZone, f);
  }
  const p = f.formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((k) => p.find((v) => v.type === k)!.value)
    .join("-");
}
export function validDate(date: string) {
  return (
    /^(?:20\d{2}|2100)-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date
  );
}
export function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/** Find the first instant of a local date, including midnight offset changes. */
export function dayStart(date: string, timeZone: string) {
  let lo = Date.parse(date + "T00:00:00Z") - 36 * 3600000,
    hi = lo + 72 * 3600000;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (businessDate(mid, timeZone) < date) lo = mid;
    else hi = mid;
  }
  return new Date(hi).toISOString();
}
export function calendarRange(
  mode: CalendarMode,
  date: string,
  timeZone: string,
) {
  if (!validDate(date)) throw new Error("Invalid calendar date");
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  let first = mode === "week" ? addDays(date, -weekday) : date,
    count = mode === "week" ? 7 : 1;
  if (mode === "month") {
    const month = date.slice(0, 7) + "-01";
    first = addDays(month, -new Date(month + "T12:00:00Z").getUTCDay());
    count = 42;
  }
  const days = Array.from({ length: count }, (_, i) => addDays(first, i));
  return {
    days,
    start: dayStart(first, timeZone),
    end: dayStart(addDays(first, count), timeZone),
  };
}
export function shiftCalendar(
  date: string,
  mode: CalendarMode,
  direction: number,
) {
  if (mode !== "month")
    return addDays(date, direction * (mode === "week" ? 7 : 1));
  const d = new Date(date.slice(0, 7) + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + direction);
  return d.toISOString().slice(0, 10);
}
export type CalendarAppointment = {
  id: string;
  name: string;
  service: string;
  status: string;
  start: string;
  end: string;
  resource: string;
};
export function wallMinutes(value: string, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  return (
    Number(p.find((v) => v.type === "hour")!.value) * 60 +
    Number(p.find((v) => v.type === "minute")!.value)
  );
}
/** Fit working hours while always including appointments outside those hours. */
export function calendarHours(
  events: CalendarAppointment[],
  resources: { hours?: { day: number; start: string; end: string }[] }[],
  days: string[],
  timeZone: string,
) {
  const weekdays = new Set(
    days.map((day) => new Date(day + "T12:00:00Z").getUTCDay()),
  );
  const minutes = (s: string) =>
    Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const windows = resources
    .flatMap((r) => r.hours ?? [])
    .filter((h) => weekdays.has(h.day));
  const placed = days.flatMap((day) => positionEvents(events, day, timeZone));
  const starts = [
    ...windows.map((h) => minutes(h.start)),
    ...placed.map((p) => p.top),
  ];
  const ends = [
    ...windows.map((h) => minutes(h.end)),
    ...placed.map((p) => p.top + p.height),
  ];
  return {
    start: Math.max(
      0,
      Math.floor((starts.length ? Math.min(...starts) : 8 * 60) / 60) * 60,
    ),
    end: Math.min(
      1440,
      Math.ceil((ends.length ? Math.max(...ends) : 18 * 60) / 60) * 60,
    ),
  };
}
/** Side-by-side columns for overlapping requests/reservations; no event hides another. */
export function positionEvents(
  events: CalendarAppointment[],
  day: string,
  timeZone: string,
) {
  const start = Date.parse(dayStart(day, timeZone)),
    end = Date.parse(dayStart(addDays(day, 1), timeZone));
  const rows = events
    .filter((e) => Date.parse(e.start) < end && Date.parse(e.end) > start)
    .map((event) => {
      const a = Math.max(start, Date.parse(event.start));
      const b = Math.min(end, Date.parse(event.end));
      const top = a === start ? 0 : wallMinutes(event.start, timeZone);
      const bottom = b === end ? 1440 : wallMinutes(event.end, timeZone);
      // A repeated DST hour can have the same wall-clock start and end.
      const duration = bottom > top ? bottom - top : (b - a) / 60000;
      return {
        event,
        top,
        height: Math.min(1440 - top, Math.max(1, duration)),
      };
    })
    .sort((a, b) => a.top - b.top || a.event.id.localeCompare(b.event.id));
  const placed: {
    event: CalendarAppointment;
    top: number;
    height: number;
    column: number;
    columns: number;
  }[] = [];
  let group: typeof placed = [],
    until = 0,
    columns: number[] = [];
  function finish() {
    group.forEach((p) => (p.columns = columns.length));
    group = [];
    columns = [];
  }
  for (const row of rows) {
    const { event, top, height } = row,
      bottom = top + height;
    if (top >= until) finish();
    let column = columns.findIndex((t) => t <= top);
    if (column < 0) column = columns.length;
    columns[column] = bottom;
    until = Math.max(group.length ? until : 0, bottom);
    const p = { event, top, height, column, columns: 1 };
    group.push(p);
    placed.push(p);
  }
  finish();
  return placed;
}
