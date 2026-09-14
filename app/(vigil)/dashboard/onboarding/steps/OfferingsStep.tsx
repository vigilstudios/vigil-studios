"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { offeringsSchema, type Offerings } from "@/lib/vigil/onboarding/brief";
import { ChoiceCards, Field, StepFooter, TextArea, TextInput, useAutosave, type SaveState } from "../wizard-ui";

type Props = {
  initial: Offerings | undefined;
  save: (data: Offerings, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const NOUNS = {
  services: { label: "Services", item: "service", hint: "Haircuts, repairs, consultations…" },
  menu: { label: "Menu", item: "dish or drink", hint: "Food, drinks, cigars…" },
  products: { label: "Products", item: "product", hint: "Things you sell" },
  other: { label: "Something else", item: "item", hint: "Classes, memberships, rooms…" },
} as const;

export function OfferingsStep({ initial, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<Offerings>(() => {
    const base = initial ?? offeringsSchema.parse({});
    return base.sections.length === 0 ? { ...base, sections: [{ id: uid(), name: "", items: [{ id: uid(), name: "", description: "", price: "" }] }] } : base;
  });
  const [busy, setBusy] = useState(false);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const setSection = (si: number, patch: Partial<Offerings["sections"][number]>) => setData((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) }));
  const setItem = (si: number, ii: number, patch: Partial<Offerings["sections"][number]["items"][number]>) =>
    setSection(si, { items: data.sections[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });
  const addItem = (si: number) => setSection(si, { items: [...data.sections[si].items, { id: uid(), name: "", description: "", price: "" }] });
  const removeItem = (si: number, ii: number) => setSection(si, { items: data.sections[si].items.filter((_, j) => j !== ii) });
  const addSection = () => setData((d) => ({ ...d, sections: [...d.sections, { id: uid(), name: "", items: [{ id: uid(), name: "", description: "", price: "" }] }] }));
  const removeSection = (si: number) => setData((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== si) }));

  const continueNext = async () => {
    setBusy(true);
    // Drop empty rows so the brief stays clean.
    const cleaned: Offerings = { ...data, sections: data.sections.map((s) => ({ ...s, items: s.items.filter((it) => it.name.trim()) })).filter((s) => s.items.length > 0 || s.name.trim()) };
    const ok = await flush();
    const done = ok && (await save(cleaned, true));
    setBusy(false);
    if (done) onNext();
  };

  const noun = NOUNS[data.noun];
  const multi = data.sections.length > 1;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-[color:var(--text-secondary)]">What should we call them on the site?</p>
        <ChoiceCards name="Type of offering" value={data.noun} onChange={(v) => setData((d) => ({ ...d, noun: v }))} options={(Object.keys(NOUNS) as (keyof typeof NOUNS)[]).map((k) => ({ value: k, label: NOUNS[k].label, hint: NOUNS[k].hint }))} />
      </div>

      {data.sections.map((section, si) => (
        <div key={section.id} className="rounded-xl border border-[color:var(--border)] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <TextInput aria-label="Section name" placeholder={multi ? "Section name, e.g. “Starters”" : "Section name (optional), e.g. “Starters”"} value={section.name} onChange={(e) => setSection(si, { name: e.target.value })} maxLength={80} className="!min-h-10 font-medium" />
            {multi ? (
              <button type="button" aria-label="Remove section" onClick={() => removeSection(si)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:text-[color:var(--status-bad)]">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <ul className="mt-3 space-y-3">
            {section.items.map((item, ii) => (
              <li key={item.id} className="grid gap-2 rounded-lg bg-[color:var(--bg-surface-soft)] p-2.5 sm:grid-cols-[1fr_7rem_auto] sm:items-start">
                <div className="grid gap-2">
                  <TextInput aria-label={`${noun.item} name`} placeholder={`Name of the ${noun.item}`} value={item.name} onChange={(e) => setItem(si, ii, { name: e.target.value })} maxLength={120} className="!min-h-10" />
                  <TextInput aria-label="Short description" placeholder="Short description (optional)" value={item.description} onChange={(e) => setItem(si, ii, { description: e.target.value })} maxLength={400} className="!min-h-10" />
                </div>
                <TextInput aria-label="Price" placeholder="Price (opt.)" inputMode="decimal" value={item.price} onChange={(e) => setItem(si, ii, { price: e.target.value })} maxLength={40} className="!min-h-10" />
                <button type="button" aria-label="Remove row" onClick={() => removeItem(si, ii)} disabled={section.items.length === 1 && !item.name} className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-md text-[color:var(--text-secondary)] hover:text-[color:var(--status-bad)] disabled:opacity-40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => addItem(si)} className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]">
            <Plus className="h-3.5 w-3.5" /> Add {noun.item}
          </button>
        </div>
      ))}
      <button type="button" onClick={addSection} className="inline-flex min-h-10 items-center gap-1 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        <Plus className="h-3.5 w-3.5" /> Add a section (for grouping, e.g. “Drinks”, “Memberships”)
      </button>

      <Field id="offerNotes" label="Anything else about what you offer" optional hint="Already have a menu or price list as a file? Upload it in the next-but-one step.">
        <TextArea id="offerNotes" rows={3} value={data.notes} onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))} maxLength={600} />
      </Field>

      <StepFooter onBack={onBack} onNext={continueNext} busy={busy} />
    </div>
  );
}
