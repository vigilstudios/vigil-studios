"use client";

import { useEffect, useId, useState } from "react";
import { Plus, Trash2, Layers3, ShoppingBag, StickyNote } from "lucide-react";
import { offeringsSchema, type Offerings } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { OfferingImages } from "./OfferingImages";
import { OfferingDocuments } from "./OfferingDocuments";
import { OnboardingSection, ChoiceCards, Field, StepFooter, TextArea, TextInput, useAutosave, type SaveState } from "../wizard-ui";

type Props = {
  initial: Offerings | undefined;
  projectId: string; organizationId: string; assets: SignedAsset[]; onAssets: (assets: SignedAsset[]) => void;
  save: (data: Offerings, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const NOUNS = {
  services: { label: "Services", item: "service", hint: "Haircuts, repairs, consultations…", section: "Consultations", grouping: "Consultations, packages or treatments" },
  menu: { label: "Menu", item: "dish or drink", hint: "Food, drinks, cigars…", section: "Starters", grouping: "Starters, drinks or desserts" },
  products: { label: "Products", item: "product", hint: "Things you sell", section: "Skincare", grouping: "Skincare, clothing or accessories" },
  other: { label: "Something else", item: "item", hint: "Classes, memberships, rooms…", section: "Memberships", grouping: "Classes, memberships or rooms" },
} as const;

export function OfferingsStep({ initial, projectId, organizationId, assets, onAssets, save, onSaveState, onBack, onNext }: Props) {
  // Accessibility IDs must match on hydration; unsaved item identities are generated independently.
  const fieldPrefix = useId();
  const [data, setData] = useState<Offerings>(() => {
    const base = initial ?? offeringsSchema.parse({});
    return base.sections.length === 0 ? { ...base, sections: [{ id: uid(), name: "", items: [{ id: uid(), name: "", description: "", price: "", imageAssetIds: [] }] }] } : base;
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);

  const setSection = (si: number, patch: Partial<Offerings["sections"][number]>) => setData((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) }));
  const setItem = (si: number, ii: number, patch: Partial<Offerings["sections"][number]["items"][number]>) =>
    setSection(si, { items: data.sections[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });
  const addItem = (si: number) => setSection(si, { items: [...data.sections[si].items, { id: uid(), name: "", description: "", price: "", imageAssetIds: [] }] });
  const removeItem = (si: number, ii: number) => setSection(si, { items: data.sections[si].items.filter((_, j) => j !== ii) });
  const addSection = () => setData((d) => ({ ...d, sections: [...d.sections, { id: uid(), name: "", items: [{ id: uid(), name: "", description: "", price: "", imageAssetIds: [] }] }] }));
  const removeSection = (si: number) => setData((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== si) }));

  const continueNext = async () => {
    if (data.sections.some(s => s.items.some(item => !item.name.trim() && item.imageAssetIds.length))) { setError("Give each item with images a name before continuing."); return; }
    setError(null);
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
    <fieldset disabled={uploading || busy} className="min-w-0 space-y-6">
      <OnboardingSection icon={Layers3} title="What do you offer?" description="Choose how we should describe your offerings on the website.">
        <ChoiceCards name="Type of offering" value={data.noun} onChange={(v) => setData((d) => ({ ...d, noun: v }))} options={(Object.keys(NOUNS) as (keyof typeof NOUNS)[]).map((k) => ({ value: k, label: NOUNS[k].label, hint: NOUNS[k].hint }))} />
      </OnboardingSection>

      <OnboardingSection icon={ShoppingBag} title={data.noun === "other" ? "Your offerings" : `Your ${noun.label.toLowerCase()}`} description="Add names, descriptions, prices and images. With Care or higher, you can update these in Content Hub after launch. Your uploads stay in Files.">
      {data.sections.map((section, si) => (
        <div key={section.id} className="rounded-xl border border-[color:var(--border)] p-3 sm:p-4">
          <h3 className="mb-3 text-sm font-semibold">{section.name || `Group ${si + 1}`}</h3>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1"><Field id={`offering-${fieldPrefix}-group-${si}`} label="Section name" optional>
            <TextInput id={`offering-${fieldPrefix}-group-${si}`} aria-label="Section name" placeholder={`Section name${multi ? "" : " (optional)"}, e.g. “${noun.section}”`} value={section.name} onChange={(e) => setSection(si, { name: e.target.value })} maxLength={80} className="!min-h-10 font-medium" /></Field>
            </div>
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
                  <Field id={`offering-${fieldPrefix}-name-${si}-${ii}`} label="Name"><TextInput id={`offering-${fieldPrefix}-name-${si}-${ii}`} aria-label={`${noun.item} name`} placeholder={`Name of the ${noun.item}`} value={item.name} onChange={(e) => setItem(si, ii, { name: e.target.value })} maxLength={120} className="!min-h-10" /></Field>
                  <Field id={`offering-${fieldPrefix}-description-${si}-${ii}`} label="Short description" optional><TextInput id={`offering-${fieldPrefix}-description-${si}-${ii}`} aria-label="Short description" placeholder="Short description (optional)" value={item.description} onChange={(e) => setItem(si, ii, { description: e.target.value })} maxLength={400} className="!min-h-10" /></Field>
                </div>
                <Field id={`offering-${fieldPrefix}-price-${si}-${ii}`} label="Price" optional><TextInput id={`offering-${fieldPrefix}-price-${si}-${ii}`} aria-label="Price" placeholder="Price (opt.)" inputMode="decimal" value={item.price} onChange={(e) => setItem(si, ii, { price: e.target.value })} maxLength={40} className="!min-h-10" /></Field>
                <button type="button" aria-label="Remove row" onClick={() => removeItem(si, ii)} disabled={section.items.length === 1 && !item.name} className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-md text-[color:var(--text-secondary)] hover:text-[color:var(--status-bad)] disabled:opacity-40">
                  <Trash2 className="h-4 w-4" />
                </button>
                <OfferingImages itemName={item.name || `${noun.item} ${ii + 1}`} ids={item.imageAssetIds} onChange={imageAssetIds => setItem(si, ii, { imageAssetIds })} projectId={projectId} organizationId={organizationId} assets={assets} onAssets={onAssets} disabled={uploading || busy} onBusy={setUploading} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => addItem(si)} className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs hover:border-[color:var(--accent)]">
            <Plus className="h-3.5 w-3.5" /> Add {noun.item}
          </button>
        </div>
      ))}
      <button type="button" onClick={addSection} className="inline-flex min-h-10 items-center gap-1 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        <Plus className="h-3.5 w-3.5" /> Add a section (e.g. {noun.grouping})
      </button>

      </OnboardingSection>

      <OfferingDocuments projectId={projectId} organizationId={organizationId} assets={assets} onAssets={onAssets} disabled={uploading || busy} onBusy={setUploading} />

      <OnboardingSection icon={StickyNote} title="Additional details" description="Share anything that needs a little more explanation." optional>
      <Field id="offerNotes" label="Anything else about what you offer" optional>
        <TextArea id="offerNotes" rows={3} value={data.notes} onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))} maxLength={600} />
      </Field>

      </OnboardingSection>

      {error && <p role="alert" className="text-xs text-[color:var(--status-bad)]">{error}</p>}
      <StepFooter onBack={onBack} onNext={continueNext} nextDisabled={uploading} busy={busy} />
    </fieldset>
  );
}
