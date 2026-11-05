import { describe, it, expect } from "vitest";
import {
  businessDate,
  validDate,
  calendarRange,
  shiftCalendar,
  positionEvents,
  type CalendarAppointment,
} from "./calendar";
const zone = "America/New_York";
describe("business calendar boundaries", () => {
  it("queries complete local days across both daylight-saving transitions", () => {
    const spring = calendarRange("day", "2026-03-08", zone),
      fall = calendarRange("day", "2026-11-01", zone);
    expect([spring.start, spring.end]).toEqual([
      "2026-03-08T05:00:00.000Z",
      "2026-03-09T04:00:00.000Z",
    ]);
    expect(Date.parse(fall.end) - Date.parse(fall.start)).toBe(25 * 3600000);
    expect(businessDate("2026-11-05T02:00:00Z", zone)).toBe("2026-11-04");
  });
  it("includes spillover days in month and complete Sunday-based weeks", () => {
    const month = calendarRange("month", "2026-11-04", zone),
      week = calendarRange("week", "2026-11-04", zone);
    expect(month.days).toHaveLength(42);
    expect(month.days.at(-1)).toBe("2026-12-12");
    expect(week.days).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(shiftCalendar("2026-01-31", "month", 1)).toBe("2026-02-01");
    expect(shiftCalendar("2026-12-30", "week", 1)).toBe("2027-01-06");
  });
  it("rejects invalid dates and unbounded user-supplied years", () => {
    for (const date of [
      "2026-02-30",
      "0000-01-01",
      "9999-01-01",
      "2026-2-3",
      "invalid",
    ])
      expect(validDate(date)).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
  });
});
function event(id: string, start: string, end: string): CalendarAppointment {
  return {
    id,
    name: "Guest",
    service: "Consultation",
    status: "confirmed",
    resource: "room",
    start: `2026-11-04T${start}:00Z`,
    end: `2026-11-04T${end}:00Z`,
  };
}
describe("calendar event layout", () => {
  it("separates overlapping requests and reservations, then restores full width", () => {
    const result = positionEvents(
      [
        event("a", "15:00", "16:00"),
        event("b", "15:30", "16:30"),
        event("c", "17:00", "18:00"),
      ],
      "2026-11-04",
      zone,
    );
    expect(result.map((p) => [p.event.id, p.column, p.columns, p.top])).toEqual(
      [
        ["a", 0, 2, 600],
        ["b", 1, 2, 630],
        ["c", 0, 1, 720],
      ],
    );
  });
  it("clips overnight appointments into each local day and excludes out-of-period events", () => {
    const overnight = {
      ...event("overnight", "15:00", "16:00"),
      start: "2026-11-05T04:30:00Z",
      end: "2026-11-05T05:30:00Z",
    };
    const previous = positionEvents([overnight], "2026-11-04", zone)[0],
      next = positionEvents([overnight], "2026-11-05", zone)[0];
    expect([previous.top, previous.height]).toEqual([1410, 30]);
    expect([next.top, next.height]).toEqual([0, 40]);
    expect(positionEvents([overnight], "2026-11-06", zone)).toEqual([]);
  });
});

it("keeps repeated-hour appointments visible in separate columns", () => {
  const appointments = [
    {
      ...event("first", "15:00", "16:00"),
      start: "2026-11-01T05:00:00Z",
      end: "2026-11-01T05:30:00Z",
    },
    {
      ...event("second", "15:00", "16:00"),
      start: "2026-11-01T06:00:00Z",
      end: "2026-11-01T06:30:00Z",
    },
  ];
  expect(
    positionEvents(appointments, "2026-11-01", zone).map((p) => [
      p.top,
      p.column,
      p.columns,
    ]),
  ).toEqual([
    [60, 0, 2],
    [60, 1, 2],
  ]);
});
