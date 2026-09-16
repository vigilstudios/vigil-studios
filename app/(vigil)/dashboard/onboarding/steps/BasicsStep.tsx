"use client";

import { useEffect, useState } from "react";
import { basicsSchema, DAYS, DAY_LABELS, emptyBasics, type Basics } from "@/lib/vigil/onboarding/brief";
import { Field, StepFooter, TextInput, Toggle, useAutosave, type SaveState } from "../wizard-ui";

type Props = {
  initial: Basics | undefined;
  businessName: string;
  save: (data: Basics, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

export function BasicsStep({ initial, businessName, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<Basics>(() => initial ?? emptyBasics(businessName));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const set = <K extends keyof Basics>(key: K, value: Basics[K]) => setData((d) => ({ ...d, [key]: value }));
  const setAddress = (key: keyof Basics["address"], value: string) => set("address", { ...data.address, [key]: value });
  const setDay = (i: number, patch: Partial<Basics["hours"]["days"][number]>) =>
    set("hours", { ...data.hours, days: data.hours.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const applySame = () => {
    const first = data.hours.days.find((d) => !d.closed) ?? data.hours.days[0];
    set("hours", { ...data.hours, sameEveryDay: true, days: data.hours.days.map((d) => ({ ...d, open: first.open, close: first.close })) });
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
    <div className="space-y-5">
      <Field id="businessName" label="Business name" error={error}>
        <TextInput id="businessName" value={data.businessName} onChange={(e) => set("businessName", e.target.value)} autoComplete="organization" />
      </Field>
      <Field id="tagline" label="Tagline" optional hint="One line under the name, e.g. “Hand-rolled cigars and a quiet place to enjoy them.”">
        <TextInput id="tagline" value={data.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={160} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="phone" label="Phone" optional>
          <TextInput id="phone" type="tel" inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
        </Field>
        <Field id="email" label="Public email" optional hint="The address customers should write to.">
          <TextInput id="email" type="email" inputMode="email" value={data.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1 block text-xs font-medium text-[color:var(--text-secondary)]">Address <span className="font-normal opacity-70">(optional; leave blank if you have no public location)</span></legend>
        <div className="grid gap-3">
          <TextInput aria-label="Street address" placeholder="Street address" value={data.address.line1} onChange={(e) => setAddress("line1", e.target.value)} autoComplete="address-line1" />
          <TextInput aria-label="Suite, unit" placeholder="Suite, unit (optional)" value={data.address.line2} onChange={(e) => setAddress("line2", e.target.value)} autoComplete="address-line2" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TextInput aria-label="City" placeholder="City" value={data.address.city} onChange={(e) => setAddress("city", e.target.value)} autoComplete="address-level2" className="col-span-2 sm:col-span-1" />
            <TextInput aria-label="State or region" placeholder="State" value={data.address.region} onChange={(e) => setAddress("region", e.target.value)} autoComplete="address-level1" />
            <TextInput aria-label="Postal code" placeholder="ZIP" value={data.address.postal} onChange={(e) => setAddress("postal", e.target.value)} autoComplete="postal-code" />
            <TextInput aria-label="Country" placeholder="Country" value={data.address.country} onChange={(e) => setAddress("country", e.target.value)} autoComplete="country-name" className="col-span-2 sm:col-span-1" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 block text-xs font-medium text-[color:var(--text-secondary)]">Opening hours</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <Toggle id="byAppointment" checked={data.hours.byAppointment} onChange={(v) => set("hours", { ...data.hours, byAppointment: v })} label="By appointment only" />
          <Toggle id="sameEveryDay" checked={data.hours.sameEveryDay} onChange={(v) => (v ? applySame() : set("hours", { ...data.hours, sameEveryDay: false }))} label="Same every day" />
        </div>
        {!data.hours.byAppointment ? (
          <ul className="mt-2 divide-y divide-[color:var(--border)] rounded-lg border border-[color:var(--border)]">
            {data.hours.days.map((d, i) => {
              const hidden = data.hours.sameEveryDay && i > 0;
              if (hidden) return null;
              return (
                <li key={d.day} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="w-24 text-[13px] font-medium">{data.hours.sameEveryDay ? "Every day" : DAY_LABELS[DAYS[i]]}</span>
                  <Toggle id={`closed-${d.day}`} checked={d.closed} onChange={(v) => (data.hours.sameEveryDay ? set("hours", { ...data.hours, days: data.hours.days.map((x) => ({ ...x, closed: v })) }) : setDay(i, { closed: v }))} label="Closed" />
                  {!d.closed ? (
                    <span className="ml-auto flex items-center gap-1.5 text-xs">
                      <input aria-label={`${DAY_LABELS[d.day]} opens`} type="time" value={d.open} onChange={(e) => (data.hours.sameEveryDay ? set("hours", { ...data.hours, days: data.hours.days.map((x) => ({ ...x, open: e.target.value })) }) : setDay(i, { open: e.target.value }))} className="min-h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 text-[13px]" />
                      <span className="text-[color:var(--text-secondary)]">to</span>
                      <input aria-label={`${DAY_LABELS[d.day]} closes`} type="time" value={d.close} onChange={(e) => (data.hours.sameEveryDay ? set("hours", { ...data.hours, days: data.hours.days.map((x) => ({ ...x, close: e.target.value })) }) : setDay(i, { close: e.target.value }))} className="min-h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 text-[13px]" />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        <TextInput aria-label="Notes about hours" placeholder="Anything else about hours, e.g. “Closed on public holidays”" value={data.hours.notes} onChange={(e) => set("hours", { ...data.hours, notes: e.target.value })} className="mt-2" maxLength={300} />
      </fieldset>

      <StepFooter onBack={onBack} onNext={continueNext} busy={busy} />
    </div>
  );
}
