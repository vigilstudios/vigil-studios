import {
  saveBookingDiningHours,
  saveBookingTable,
} from "@/lib/vigil/actions/bookings";
import type { Database } from "@/types/database.types";
import { ActionForm } from "./ActionControls";
import {
  BookingEditorCollection,
  BookingDiningPanels,
} from "./BookingWorkspace";
import { WeeklyAvailabilityEditor } from "./WeeklyAvailabilityEditor";

type Resource = Database["public"]["Tables"]["booking_resources"]["Row"];
export function BookingTablesSetup({
  website,
  resources,
  hours,
  timeZone,
  canManage,
}: {
  website: string;
  resources: Resource[];
  hours: unknown;
  timeZone: string;
  canManage: boolean;
}) {
  const tables = resources.filter((r) => r.kind === "table");
  const editor = (table: Resource | null) => (
    <ActionForm
      action={saveBookingTable.bind(null, website)}
      submitLabel="Save table"
      className="lead-form"
    >
      {table && <input type="hidden" name="id" value={table.id} />}
      <label className="lead-field">
        Table name
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={table?.name ?? ""}
          placeholder="Table 1"
        />
      </label>
      <div className="lead-form-fields">
        <label className="lead-field">
          Smallest party
          <input
            name="minParty"
            type="number"
            min={1}
            max={30}
            required
            defaultValue={table?.min_party ?? 1}
          />
        </label>
        <label className="lead-field">
          Seats
          <input
            name="maxParty"
            type="number"
            min={1}
            max={30}
            required
            defaultValue={table?.max_party ?? 4}
          />
        </label>
      </div>
      <label className="booking-check">
        <input
          name="active"
          type="checkbox"
          defaultChecked={table?.active ?? true}
        />
        Available for assignment
      </label>
      <p className="lead-footnote">
        Vigil assigns the smallest available table that fits the party. Tables
        are never combined. Existing reservations remain when a table is paused.
      </p>
    </ActionForm>
  );
  return (
    <section className="lead-detail-panel">
      <h2 className="lead-panel-heading">Tables & dining hours</h2>
      <div className="lead-panel-body">
        <p className="lead-settings-note">
          For restaurant reservations, add each table and set your dining hours.
          Then add a service with automatic table assignment. Customers choose
          their party size and an available time.
        </p>
        <BookingDiningPanels
          tables={
            <>
              <BookingEditorCollection
                items={tables.map((t) => ({
                  id: t.id,
                  name: t.name,
                  description: `${t.min_party}–${t.max_party} guests · ${t.active ? "Available" : "Paused"}`,
                  content: canManage ? (
                    editor(t)
                  ) : (
                    <p>
                      {t.min_party}–{t.max_party} guests
                    </p>
                  ),
                }))}
                add={canManage ? editor(null) : undefined}
              />
            </>
          }
          hours={
            <>
              <p className="lead-footnote">
                Shared by your tables · {timeZone}. Use Time off to block an
                individual table. No times are offered until hours and a dining
                service are saved.
              </p>
              {canManage ? (
                <ActionForm
                  action={saveBookingDiningHours.bind(null, website)}
                  submitLabel="Save dining hours"
                  className="lead-form"
                >
                  <WeeklyAvailabilityEditor
                    id="dining"
                    initial={
                      (hours ?? []) as {
                        day: number;
                        start: string;
                        end: string;
                      }[]
                    }
                  />
                </ActionForm>
              ) : (
                <p>An owner or manager can edit dining hours.</p>
              )}
            </>
          }
        />
      </div>
    </section>
  );
}
