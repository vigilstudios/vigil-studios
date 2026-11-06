"use client";
import { useState } from "react";
import { ActionForm } from "./ActionControls";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
import {
  bookingExperience,
  type BookingExperience,
} from "@/lib/vigil/bookings/contract";
import { saveBookingExperience } from "@/lib/vigil/actions/bookings";

export function BookingExperienceEditor({
  website,
  initial,
  canManage,
}: {
  website: string;
  initial: unknown;
  canManage: boolean;
}) {
  const [value, setValue] = useState(() => bookingExperience(initial));
  const [showPreview, setShowPreview] = useState(false);
  function set<K extends keyof BookingExperience>(
    key: K,
    next: BookingExperience[K],
  ) {
    setValue((v) => ({ ...v, [key]: next }));
  }
  return (
    <div className="booking-widget-editor">
      <div
        className="booking-widget-switch"
        role="group"
        aria-label="Website widget workspace"
      >
        <button
          type="button"
          aria-pressed={!showPreview}
          onClick={() => setShowPreview(false)}
        >
          Customize
        </button>
        <button
          type="button"
          aria-pressed={showPreview}
          onClick={() => setShowPreview(true)}
        >
          Customer preview
        </button>
      </div>
      <section className="lead-detail-panel" hidden={showPreview}>
        <div className="lead-panel-body">
          <p className="lead-settings-note">
            Choose how customers book on a compatible website. Publishing these
            preferences does not activate online bookings.
          </p>
          {canManage ? (
            <ActionForm
              action={saveBookingExperience.bind(null, website)}
              submitLabel="Save website experience"
              resetOnSuccess={false}
              className="lead-form"
            >
              <div className="lead-form-fields">
                <label className="lead-field">
                  Display
                  <select
                    name="presentation"
                    value={value.presentation}
                    onChange={(e) =>
                      set(
                        "presentation",
                        e.target.value as BookingExperience["presentation"],
                      )
                    }
                  >
                    <option value="inline">Embedded in the page</option>
                    <option value="popup">Button opens a popup</option>
                  </select>
                </label>
                <label className="lead-field">
                  Date selection
                  <select
                    name="datePicker"
                    value={value.datePicker}
                    onChange={(e) =>
                      set(
                        "datePicker",
                        e.target.value as BookingExperience["datePicker"],
                      )
                    }
                  >
                    <option value="calendar">Monthly calendar</option>
                    <option value="date">Simple date field</option>
                  </select>
                </label>
                <label className="lead-field">
                  Heading
                  <input
                    name="title"
                    required
                    maxLength={80}
                    value={value.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </label>
                <label className="lead-field">
                  Button text
                  <input
                    name="buttonLabel"
                    required
                    maxLength={40}
                    value={value.buttonLabel}
                    onChange={(e) => set("buttonLabel", e.target.value)}
                  />
                </label>
                <label className="lead-field">
                  Accent
                  <select
                    name="accent"
                    value={value.accent}
                    onChange={(e) =>
                      set(
                        "accent",
                        e.target.value as BookingExperience["accent"],
                      )
                    }
                  >
                    <option value="royal">Royal blue</option>
                    <option value="graphite">Graphite</option>
                    <option value="plum">Plum</option>
                  </select>
                </label>
                <label className="lead-field">
                  Person or space label
                  <input
                    name="resourceLabel"
                    required
                    maxLength={30}
                    value={value.resourceLabel}
                    onChange={(e) => set("resourceLabel", e.target.value)}
                  />
                </label>
              </div>
              <label className="booking-check">
                <input
                  name="showResource"
                  type="checkbox"
                  checked={value.showResource}
                  onChange={(e) => set("showResource", e.target.checked)}
                />
                Let customers filter services by person or space
              </label>
              <label className="lead-field">
                Introduction
                <textarea
                  name="introduction"
                  maxLength={160}
                  rows={2}
                  value={value.introduction}
                  onChange={(e) => set("introduction", e.target.value)}
                />
              </label>
            </ActionForm>
          ) : (
            <p>An owner or manager can change website preferences.</p>
          )}
        </div>
      </section>
      <section
        className="booking-widget-preview"
        aria-label="Website experience preview"
        hidden={!showPreview}
      >
        <span className="booking-eyebrow">
          CUSTOMER PREVIEW · FICTIONAL AVAILABILITY
        </span>
        <BookingWidget preview experience={value} />
      </section>
    </div>
  );
}
