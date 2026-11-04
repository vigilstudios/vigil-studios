"use client";
import { useState, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/vigil/auth/errors";
export function BookingRescheduleForm({
  action,
}: {
  action: (start: string) => Promise<ActionResult>;
}) {
  const zone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "your device timezone",
  );
  const [pending, start] = useTransition(),
    [error, setError] = useState(""),
    router = useRouter();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("start"));
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
          setError("Choose a valid time.");
          return;
        }
        const roundTrip = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        if (roundTrip !== value) {
          setError("That local time does not exist. Choose another time.");
          return;
        }
        setError("");
        start(async () => {
          const result = await action(date.toISOString());
          if (result.ok) router.refresh();
          else setError(result.error);
        });
      }}
      className="booking-reschedule"
    >
      <label className="lead-field">
        New time · {zone}
        <input type="datetime-local" name="start" required />
      </label>
      <button type="submit" className="lead-button" disabled={pending}>
        {pending ? "Saving…" : "Reschedule"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
