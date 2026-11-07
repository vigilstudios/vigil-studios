"use client";
import { useState } from "react";
type AvailabilityWindow = { day: number; start: string; end: string };
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function WeeklyAvailabilityEditor({
  initial,
  id,
}: {
  initial: AvailabilityWindow[];
  id: string;
}) {
  const [hours, setHours] = useState(initial);
  function update(index: number, field: "start" | "end", value: string) {
    setHours((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }
  return (
    <div className="booking-weekly">
      <input type="hidden" name="hours" value={JSON.stringify(hours)} />
      {days.map((day, n) => {
        const rows = hours
          .map((row, index) => ({ ...row, index }))
          .filter((row) => row.day === n);
        return (
          <div className="booking-weekday-row" key={day}>
            <div className="booking-weekday-label">
              <label>
                <input
                  type="checkbox"
                  checked={!!rows.length}
                  onChange={(event) =>
                    setHours((all) =>
                      event.target.checked
                        ? [...all, { day: n, start: "09:00", end: "17:00" }]
                        : all.filter((row) => row.day !== n),
                    )
                  }
                />
                {day}
              </label>
            </div>
            <div className="booking-weekday-windows">
              {!rows.length ? (
                <span className="lead-footnote">Unavailable</span>
              ) : (
                <>
                  <div className="booking-hours">
                    {rows.map((row) => (
                      <div key={row.index}>
                        <input
                          aria-label={`${day} available from ${rows.indexOf(row) + 1}`}
                          id={`${id}-${n}-${row.index}-start`}
                          type="time"
                          required
                          value={row.start}
                          onChange={(e) =>
                            update(row.index, "start", e.target.value)
                          }
                        />
                        <span>to</span>
                        <input
                          aria-label={`${day} available until ${rows.indexOf(row) + 1}`}
                          type="time"
                          required
                          value={row.end}
                          onChange={(e) =>
                            update(row.index, "end", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="lead-button"
                          onClick={() =>
                            setHours((all) =>
                              all.filter((_, i) => i !== row.index),
                            )
                          }
                          aria-label={`Remove ${day} window ${rows.indexOf(row) + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="lead-button"
                    disabled={
                      rows.length >= 4 ||
                      hours.length >= 28 ||
                      rows.some((r) => r.end > "22:00")
                    }
                    onClick={() =>
                      setHours((all) => {
                        const end = rows.reduce(
                          (v, r) => (r.end > v ? r.end : v),
                          "00:00",
                        );
                        const startMinutes =
                          Number(end.slice(0, 2)) * 60 +
                          Number(end.slice(3)) +
                          30;
                        const time = (v: number) =>
                          `${Math.floor(v / 60)
                            .toString()
                            .padStart(
                              2,
                              "0",
                            )}:${(v % 60).toString().padStart(2, "0")}`;
                        return [
                          ...all,
                          {
                            day: n,
                            start: time(startMinutes),
                            end: time(startMinutes + 60),
                          },
                        ];
                      })
                    }
                  >
                    + Add hours
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
