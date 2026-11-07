"use client";

import { useEffect, useState } from "react";
import { Building2, Contact, MapPin, Clock3, CalendarDays } from "lucide-react";
import {
  basicsSchema,
  DAYS,
  DAY_LABELS,
  emptyBasics,
  type Basics,
} from "@/lib/vigil/onboarding/brief";
import {
  OnboardingSection,
  ChoiceCards,
  Field,
  StepFooter,
  TextInput,
  Toggle,
  useAutosave,
  type SaveState,
} from "../wizard-ui";

type Props = {
  initial: Basics | undefined;
  businessName: string;
  save: (data: Basics, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

export function BasicsStep({
  initial,
  businessName,
  save,
  onSaveState,
  onBack,
  onNext,
}: Props) {
  const [data, setData] = useState<Basics>(() =>
    initial ? basicsSchema.parse(initial) : emptyBasics(businessName),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const set = <K extends keyof Basics>(key: K, value: Basics[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setAddress = (key: keyof Basics["address"], value: string) =>
    set("address", { ...data.address, [key]: value });
  const setDay = (i: number, patch: Partial<Basics["hours"]["days"][number]>) =>
    set("hours", {
      ...data.hours,
      days: data.hours.days.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    });

  const applySame = () => {
    const first = data.hours.days.find((d) => !d.closed) ?? data.hours.days[0];
    set("hours", {
      ...data.hours,
      sameEveryDay: true,
      days: data.hours.days.map((d) => ({
        ...d,
        open: first.open,
        close: first.close,
      })),
    });
  };

  const continueNext = async () => {
    const parsed = basicsSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await flush();
    const done = ok && (await save(parsed.data, true));
    setBusy(false);
    if (done) onNext();
  };

  return (
    <div className="space-y-6">
      <OnboardingSection
        icon={Building2}
        title="Your business"
        description="Start with the name and introduction customers will see."
      >
        <Field id="businessName" label="Business name">
          <TextInput
            id="businessName"
            value={data.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            autoComplete="organization"
          />
        </Field>
        <Field
          id="tagline"
          label="Tagline"
          optional
          hint="A short line under your business name that describes what you do."
        >
          <TextInput
            id="tagline"
            value={data.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            maxLength={160}
          />
        </Field>
      </OnboardingSection>

      <OnboardingSection
        icon={Contact}
        title="Contact details"
        description="How should customers get in touch?"
        optional
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Phone" optional>
            <TextInput
              id="phone"
              type="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              autoComplete="tel"
            />
          </Field>
          <Field
            id="email"
            label="Public email"
            optional
            hint="The address customers should write to."
          >
            <TextInput
              id="email"
              type="email"
              inputMode="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
            />
          </Field>
        </div>
      </OnboardingSection>

      <OnboardingSection
        icon={MapPin}
        title="Public location"
        description="Leave this blank if you work online or do not have a public address."
        optional
      >
        <div className="grid gap-3">
          <Field id="address-line1" label="Street address">
            <TextInput
              id="address-line1"
              placeholder="Street address"
              value={data.address.line1}
              onChange={(e) => setAddress("line1", e.target.value)}
              autoComplete="address-line1"
            />
          </Field>
          <Field id="address-line2" label="Suite or unit" optional>
            <TextInput
              id="address-line2"
              placeholder="Suite, unit"
              value={data.address.line2}
              onChange={(e) => setAddress("line2", e.target.value)}
              autoComplete="address-line2"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="address-city" label="City">
              <TextInput
                id="address-city"
                placeholder="City"
                value={data.address.city}
                onChange={(e) => setAddress("city", e.target.value)}
                autoComplete="address-level2"
              />
            </Field>
            <Field id="address-region" label="State or region">
              <TextInput
                id="address-region"
                placeholder="State"
                value={data.address.region}
                onChange={(e) => setAddress("region", e.target.value)}
                autoComplete="address-level1"
              />
            </Field>
            <Field id="address-postal" label="Postal code">
              <TextInput
                id="address-postal"
                placeholder="ZIP"
                value={data.address.postal}
                onChange={(e) => setAddress("postal", e.target.value)}
                autoComplete="postal-code"
              />
            </Field>
            <Field id="address-country" label="Country">
              <TextInput
                id="address-country"
                placeholder="Country"
                value={data.address.country}
                onChange={(e) => setAddress("country", e.target.value)}
                autoComplete="country-name"
              />
            </Field>
          </div>
        </div>
      </OnboardingSection>

      <OnboardingSection
        icon={Clock3}
        title="Opening hours"
        description="Add your public hours, or skip the schedule if it does not apply to your business."
      >
        <Toggle
          id="hoursNotApplicable"
          checked={data.hours.notApplicable}
          onChange={(v) => set("hours", { ...data.hours, notApplicable: v })}
          label="Opening hours don't apply to my business"
        />
        {!data.hours.notApplicable ? (
          <>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Toggle
                id="byAppointment"
                checked={data.hours.byAppointment}
                onChange={(v) =>
                  set("hours", { ...data.hours, byAppointment: v })
                }
                label="By appointment only"
              />
              <Toggle
                id="sameEveryDay"
                checked={data.hours.sameEveryDay}
                onChange={(v) =>
                  v
                    ? applySame()
                    : set("hours", { ...data.hours, sameEveryDay: false })
                }
                label="Same every day"
              />
            </div>
            {!data.hours.byAppointment ? (
              <ul className="mt-2 divide-y divide-[color:var(--border)] rounded-lg border border-[color:var(--border)]">
                {data.hours.days.map((d, i) => {
                  const hidden = data.hours.sameEveryDay && i > 0;
                  if (hidden) return null;
                  return (
                    <li
                      key={d.day}
                      className="flex flex-wrap items-center gap-2 px-3 py-2"
                    >
                      <span className="w-24 text-[13px] font-medium">
                        {data.hours.sameEveryDay
                          ? "Every day"
                          : DAY_LABELS[DAYS[i]]}
                      </span>
                      <Toggle
                        id={`closed-${d.day}`}
                        checked={d.closed}
                        onChange={(v) =>
                          data.hours.sameEveryDay
                            ? set("hours", {
                                ...data.hours,
                                days: data.hours.days.map((x) => ({
                                  ...x,
                                  closed: v,
                                })),
                              })
                            : setDay(i, { closed: v })
                        }
                        label="Closed"
                      />
                      {!d.closed ? (
                        <span className="ml-auto flex items-center gap-1.5 text-xs">
                          <input
                            aria-label={`${DAY_LABELS[d.day]} opens`}
                            type="time"
                            value={d.open}
                            onChange={(e) =>
                              data.hours.sameEveryDay
                                ? set("hours", {
                                    ...data.hours,
                                    days: data.hours.days.map((x) => ({
                                      ...x,
                                      open: e.target.value,
                                    })),
                                  })
                                : setDay(i, { open: e.target.value })
                            }
                            className="min-h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 text-[13px]"
                          />
                          <span className="text-[color:var(--text-secondary)]">
                            to
                          </span>
                          <input
                            aria-label={`${DAY_LABELS[d.day]} closes`}
                            type="time"
                            value={d.close}
                            onChange={(e) =>
                              data.hours.sameEveryDay
                                ? set("hours", {
                                    ...data.hours,
                                    days: data.hours.days.map((x) => ({
                                      ...x,
                                      close: e.target.value,
                                    })),
                                  })
                                : setDay(i, { close: e.target.value })
                            }
                            className="min-h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 text-[13px]"
                          />
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <TextInput
              aria-label="Notes about hours"
              placeholder="Anything else about hours, e.g. “Closed on public holidays”"
              value={data.hours.notes}
              onChange={(e) =>
                set("hours", { ...data.hours, notes: e.target.value })
              }
              className="mt-2"
              maxLength={300}
            />
          </>
        ) : null}
      </OnboardingSection>

      <OnboardingSection
        icon={CalendarDays}
        title="How should customers contact or book with you?"
        description="Express sites start with contact only. Vigil appointments and table reservations are available on compatible sites with Care or higher, after setup."
      >
        <ChoiceCards
          name="Booking approach"
          value={data.booking.approach}
          onChange={(approach) => set("booking", { ...data.booking, approach })}
          options={[
            {
              value: "contact",
              label: "Contact only",
              hint: "Customers send a message or call to arrange a visit.",
            },
            {
              value: "vigil",
              label: "Vigil bookings",
              hint: "Appointments, table reservations and approval requests managed in Bookings. Care or higher required.",
            },
            {
              value: "existing",
              label: "My existing booking service",
              hint: "Keep a supported booking link or embed. Its calendar remains separate.",
            },
            {
              value: "custom",
              label: "Specialized scheduling",
              hint: "Table combinations, waitlists, classes, group sessions or deposits. Discuss the scope with Vigil.",
            },
          ]}
        />
        {data.booking.approach === "vigil" && (
          <>
            <ChoiceCards
              name="Appointment confirmation"
              value={data.booking.mode}
              onChange={(mode) => set("booking", { ...data.booking, mode })}
              options={[
                {
                  value: "instant",
                  label: "Confirm instantly",
                  hint: "Customers choose an available time.",
                },
                {
                  value: "approval",
                  label: "Approve requests first",
                  hint: "Your team accepts or declines each request.",
                },
                {
                  value: "both",
                  label: "Choose per service",
                  hint: "Use either approach for each service.",
                },
              ]}
            />
            <Field
              id="booking-timezone"
              label="Business timezone"
              optional
              hint="For example, America/New_York. We’ll verify this during setup."
            >
              <TextInput
                id="booking-timezone"
                value={data.booking.timeZone}
                maxLength={100}
                onChange={(e) =>
                  set("booking", { ...data.booking, timeZone: e.target.value })
                }
              />
            </Field>
            <Field
              id="booking-services"
              label="What can customers book?"
              optional
              hint="List services and any requirements. Service durations and availability are reviewed in Lead Hub."
            >
              <TextInput
                id="booking-services"
                value={data.booking.services}
                maxLength={600}
                onChange={(e) =>
                  set("booking", { ...data.booking, services: e.target.value })
                }
              />
            </Field>
            <p className="text-xs leading-5 text-[color:var(--text-secondary)]">
              This records your setup request. Your public hours do not become
              bookable availability, and appointments stay off until an owner or
              manager enables them.
            </p>
          </>
        )}
        {data.booking.approach === "existing" && (
          <Field id="booking-provider" label="Existing booking link" optional>
            <TextInput
              id="booking-provider"
              type="url"
              value={data.booking.providerUrl}
              maxLength={2048}
              onChange={(e) =>
                set("booking", { ...data.booking, providerUrl: e.target.value })
              }
            />
          </Field>
        )}
      </OnboardingSection>

      {error && (
        <p role="alert" className="text-sm text-[color:var(--status-bad)]">
          {error}
        </p>
      )}
      <StepFooter onBack={onBack} onNext={continueNext} busy={busy} />
    </div>
  );
}
