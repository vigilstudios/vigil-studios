"use client";

import { useEffect, useState } from "react";
import { aboutSchema, type About } from "@/lib/vigil/onboarding/brief";
import { Field, StepFooter, TextArea, TextInput, useAutosave, type SaveState } from "../wizard-ui";

type Props = {
  initial: About | undefined;
  businessName: string;
  save: (data: About, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

export function AboutStep({ initial, businessName, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<About>(() => initial ?? aboutSchema.parse({}));
  const [busy, setBusy] = useState(false);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);
  const set = <K extends keyof About>(k: K, v: About[K]) => setData((d) => ({ ...d, [k]: v }));

  const continueNext = async () => {
    setBusy(true);
    const ok = await flush();
    const done = ok && (await save(data, true));
    setBusy(false);
    if (done) onNext();
  };

  return (
    <div className="space-y-5">
      <Field id="story" label={`The story of ${businessName}`} hint="How it started, who runs it, what you care about. Bullet points are fine.">
        <TextArea id="story" rows={6} value={data.story} onChange={(e) => set("story", e.target.value)} maxLength={2000} placeholder="We opened in 2019 because…" />
      </Field>
      <Field id="different" label="What makes you different from the place down the road?" optional>
        <TextArea id="different" rows={3} value={data.different} onChange={(e) => set("different", e.target.value)} maxLength={1000} />
      </Field>
      <Field id="hero" label="If your site could say one sentence to a new visitor, what would it be?" optional hint="This often becomes the headline at the top of the page.">
        <TextInput id="hero" value={data.hero} onChange={(e) => set("hero", e.target.value)} maxLength={200} placeholder="The neighbourhood's living room, with better cigars." />
      </Field>
      <StepFooter onBack={onBack} onNext={continueNext} busy={busy} />
    </div>
  );
}
