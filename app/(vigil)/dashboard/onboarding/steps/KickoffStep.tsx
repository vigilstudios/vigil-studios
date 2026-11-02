"use client";

import { useEffect, useState } from "react";
import { Check, Compass, CalendarDays } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { kickoffSchema, type Kickoff } from "@/lib/vigil/onboarding/brief";
import { OnboardingSection, ChoiceCards, StepFooter, VirtueAside, useAutosave, type SaveState } from "../wizard-ui";

type Props = {
  initial: Kickoff | undefined;
  save: (data: Kickoff, completed?: boolean) => Promise<boolean>;
  onSaveState: (state: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
  onFinishWithCall: () => void;
};

export function KickoffStep({ initial, save, onSaveState, onBack, onNext, onFinishWithCall }: Props) {
  const [data, setData] = useState<Kickoff>(() => initial ?? kickoffSchema.parse({}));
  const [busy, setBusy] = useState(false);
  const { state } = useAutosave(data, (value) => save(value));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const finish = async (next: "guided" | "call") => {
    setBusy(true);
    const value = { ...data, mode: next === "guided" && data.callBooked ? "both" : next } satisfies Kickoff;
    setData(value);
    const saved = await save(value, true);
    setBusy(false);
    if (!saved) return;
    if (next === "guided") onNext();
    else onFinishWithCall();
  };

  const booked = async () => {
    const value = { mode: "call", callBooked: true } satisfies Kickoff;
    setData(value);
    await save(value);
  };

  return (
    <div className="space-y-6">
      <OnboardingSection icon={Compass} title="How would you like to begin?" description="Work through the brief at your pace, or talk it through with our team.">
      <ChoiceCards
        name="How to begin"
        value={data.mode}
        onChange={(mode) => setData((current) => ({ ...current, mode }))}
        options={[
          { value: "guided", label: "Continue with Virtue", hint: "Work through goals, pages, style, files and requirements at your pace." },
          { value: "call", label: "Book a kickoff call", hint: "Talk through the project directly with our team." },
        ]}
      />

      {data.mode === "guided" ? (
        <VirtueAside>I&apos;ll turn your answers and uploads into one organized brief for the Vigil design team.</VirtueAside>
      ) : null}

      </OnboardingSection>

      {data.mode === "call" ? (
        <OnboardingSection icon={CalendarDays} title="Choose a time with our team" description="Once the call is booked, you can finish for now or add ideas and files while you wait.">
          <CalendlyPopup onEventScheduled={() => void booked()} className="btn-primary mt-4 min-h-11 w-full !px-4 text-sm sm:w-auto">{data.callBooked ? "Choose a different time" : "Open calendar"}</CalendlyPopup>
          {!data.callBooked ? <button type="button" onClick={() => void booked()} className="ml-0 mt-2 min-h-11 px-3 text-xs underline sm:ml-2 sm:mt-0">I already booked my call</button> : null}
          {data.callBooked ? <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[color:var(--status-good)]"><Check className="h-3.5 w-3.5" /> Kickoff call booked</p> : null}
        </OnboardingSection>
      ) : null}

      {data.mode === "call" && data.callBooked ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => void finish("call")} disabled={busy} className="btn-secondary min-h-11 !px-5 text-sm">{busy ? "Saving…" : "Finish for now"}</button>
          <button type="button" onClick={() => void finish("guided")} disabled={busy} className="btn-primary min-h-11 !px-5 text-sm">Add details while I wait</button>
        </div>
      ) : (
        <StepFooter onBack={onBack} onNext={data.mode === "guided" ? () => void finish("guided") : undefined} nextDisabled={!data.mode} busy={busy} />
      )}
    </div>
  );
}
