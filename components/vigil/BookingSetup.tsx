import {
  BookingSetupWorkspace,
  BookingEditorCollection,
} from "./BookingWorkspace";
import { BookingExperienceEditor } from "./BookingExperienceEditor";
import { BookingGoogleCalendar } from "./BookingGoogleCalendar";
import { WeeklyAvailabilityEditor } from "./WeeklyAvailabilityEditor";
import { ActionButton, ActionForm } from "./ActionControls";
import { bookingTime } from "@/lib/vigil/bookings/contract";
import type { getBookings } from "@/lib/vigil/queries/bookings";
import type { calendarConnectionStatus } from "@/lib/vigil/bookings/google/service";
import {
  saveBookingResource,
  saveBookingService,
  saveBookingSettings,
  blockBookingDays,
  removeBookingBlock,
} from "@/lib/vigil/actions/bookings";
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

export function BookingSetup({
  data,
  website,
  canManage,
  calendarStatus,
  canConnect,
  notice,
}: {
  data: Extract<Awaited<ReturnType<typeof getBookings>>, { enabled: true }>;
  website: string;
  canManage: boolean;
  calendarStatus: Awaited<ReturnType<typeof calendarConnectionStatus>>;
  canConnect: boolean;
  notice?: string;
}) {
  return (
    <BookingSetupWorkspace
      key={website}
      initial={notice ? "connections" : undefined}
      panels={[
        <section key="rules" className="lead-detail-panel">
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
                Onboarding request: {approachLabels[data.bookingNeeds.approach]}{" "}
                · {modeLabels[data.bookingNeeds.mode]}.{" "}
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
                  <input type="checkbox" name="acknowledgeAvailability" />I
                  reviewed timezone and availability. I will keep all
                  unavailable time blocked in Vigil. Google Calendar is an
                  optional copy. Busy time from Google is not imported.
                </label>
                <p className="lead-footnote">
                  Customers receive an on-screen receipt and private management
                  link. Automated customer emails and reminders are not enabled.
                </p>
                {data.ctx.staffRole ? (
                  <>
                    <input type="hidden" name="componentReviewed" value="yes" />
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
        </section>,
        <section key="people" className="lead-detail-panel">
          <h2 className="lead-panel-heading">People & availability</h2>
          <div className="lead-panel-body">
            <p className="lead-settings-note">
              Set weekly hours for each person or appointment space. Use Time
              off for holidays and exceptions.
            </p>
            {(() => {
              const editor = (
                resource: (typeof data.resources)[number] | null,
              ) => (
                <div className="booking-item-form">
                  {" "}
                  {canManage && data.eligible ? (
                    <ActionForm
                      action={saveBookingResource.bind(null, website)}
                      submitLabel="Save availability"
                      className="lead-form"
                    >
                      {resource && (
                        <input name="id" type="hidden" value={resource.id} />
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
                </div>
              );
              return (
                <BookingEditorCollection
                  items={data.resources.map((resource) => ({
                    id: resource.id,
                    name: resource.name,
                    description: `${resource.active ? "Active" : "Inactive"} · ${(resource.hours as unknown[]).length} weekly windows`,
                    content: editor(resource),
                  }))}
                  add={canManage && data.eligible ? editor(null) : undefined}
                />
              );
            })()}
          </div>
        </section>,
        <section key="services" className="lead-detail-panel">
          <h2 className="lead-panel-heading">Services</h2>
          <div className="lead-panel-body">
            {(() => {
              const editor = (
                service: (typeof data.services)[number] | null,
              ) => (
                <div className="booking-item-form">
                  {" "}
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
                            <option value="instant">Confirm instantly</option>
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
                </div>
              );
              return (
                <BookingEditorCollection
                  items={data.services.map((service) => ({
                    id: service.id,
                    name: service.name,
                    description: `${service.duration} min · ${service.mode === "instant" ? "Instant" : "Approval"} · ${service.active ? "Available" : "Hidden"}`,
                    content: editor(service),
                  }))}
                  add={
                    canManage && data.eligible && data.resources.length > 0
                      ? editor(null)
                      : undefined
                  }
                />
              );
            })()}
            {!data.resources.length && (
              <p>
                Add a person or appointment space before creating a service.
              </p>
            )}
          </div>
        </section>,
        <section key="time-off" className="lead-detail-panel">
          <h2 className="lead-panel-heading">Blocked dates</h2>
          <div className="lead-panel-body">
            <p className="lead-settings-note">
              Block holidays or days away in your business timezone. Existing
              appointments remain recorded; contact those customers if their
              appointment must change.
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
                  {data.resources.find((r) => r.id === block.resource_id)?.name}{" "}
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
        </section>,
        <BookingExperienceEditor
          key="widget"
          website={website}
          initial={data.settings?.experience ?? null}
          canManage={canManage && data.eligible}
        />,
        <BookingGoogleCalendar
          key="connections"
          status={calendarStatus}
          website={website}
          canConnect={canConnect}
          notice={notice}
        />,
      ]}
    />
  );
}
