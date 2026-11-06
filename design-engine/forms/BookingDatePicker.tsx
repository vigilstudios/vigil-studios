"use client";
import { useId, useState } from "react";
import { addDays, validDate } from "@/lib/vigil/bookings/calendar";

export function BookingDatePicker({
  value,
  min,
  max,
  onChange,
}: {
  value: string;
  min: string;
  max?: string;
  onChange: (day: string) => void;
}) {
  const [month, setMonth] = useState((value || min).slice(0, 7) + "-01");
  const labelId = useId();
  const first = addDays(month, -new Date(month + "T12:00:00Z").getUTCDay());
  const format = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(
      new Date(day + "T12:00:00Z"),
    );
  function shift(n: number) {
    const date = new Date(month + "T12:00:00Z");
    date.setUTCMonth(date.getUTCMonth() + n);
    return date.toISOString().slice(0, 10);
  }
  return (
    <div className="vb-date-picker" role="group" aria-labelledby={labelId}>
      <div className="vb-month-heading">
        <button
          type="button"
          aria-label="Previous month"
          disabled={shift(-1).slice(0, 7) < min.slice(0, 7)}
          onClick={() => setMonth(shift(-1))}
        >
          ‹
        </button>
        <strong id={labelId} aria-live="polite">
          {format(month, { month: "long", year: "numeric" })}
        </strong>
        <button
          type="button"
          aria-label="Next month"
          disabled={!!max && shift(1).slice(0, 7) > max.slice(0, 7)}
          onClick={() => setMonth(shift(1))}
        >
          ›
        </button>
      </div>
      <div className="vb-month-weekdays" aria-hidden="true">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="vb-month-days">
        {Array.from({ length: 42 }, (_, i) => {
          const day = addDays(first, i);
          return (
            <button
              type="button"
              key={day}
              aria-label={format(day, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              aria-pressed={day === value}
              data-outside={day.slice(0, 7) !== month.slice(0, 7)}
              disabled={day < min || (!!max && day > max) || !validDate(day)}
              onClick={() => {
                onChange(day);
                setMonth(day.slice(0, 7) + "-01");
              }}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>
      <p className="vb-note">Choose a date to check available times.</p>
    </div>
  );
}
