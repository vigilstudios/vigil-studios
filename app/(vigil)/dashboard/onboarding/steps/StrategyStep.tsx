"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { strategySchema, type Strategy } from "@/lib/vigil/onboarding/brief";
import { ChoiceCards, Field, StepFooter, TextArea, TextInput, useAutosave, VirtueAside, type SaveState } from "../wizard-ui";

type Props = {
  initial: Strategy | undefined;
  save: (data: Strategy, completed?: boolean) => Promise<boolean>;
  onSaveState: (state: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

const PAGE_OPTIONS: { value: Strategy["pages"][number]; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "products", label: "Products" },
  { value: "menu", label: "Menu" },
  { value: "portfolio", label: "Portfolio" },
  { value: "gallery", label: "Gallery" },
  { value: "testimonials", label: "Testimonials" },
  { value: "blog", label: "Blog" },
  { value: "faq", label: "FAQ" },
  { value: "contact", label: "Contact" },
  { value: "other", label: "Other" },
];

const FEATURE_OPTIONS: { value: Strategy["features"][number]; label: string }[] = [
  { value: "contact_form", label: "Contact or quote form" },
  { value: "multi_step_forms", label: "Multi-step form" },
  { value: "booking_embed", label: "Third-party booking link or embed" },
  { value: "simple_payments", label: "Simple payments or deposits" },
  { value: "maps_reviews", label: "Maps or review widgets" },
  { value: "analytics_tracking", label: "Analytics and conversion tracking" },
  { value: "email_crm", label: "Email marketing or standard CRM forms" },
  { value: "live_chat", label: "Live chat, WhatsApp or SMS contact" },
  { value: "social", label: "Social links or feeds" },
  { value: "cms_blog", label: "Blog, portfolio or other CMS content" },
  { value: "basic_automation", label: "Simple Zapier or Make trigger" },
  { value: "events", label: "Events" },
  { value: "gallery", label: "Gallery or portfolio" },
  { value: "multilingual", label: "Multiple languages" },
  { value: "ecommerce", label: "Advanced online store" },
  { value: "memberships", label: "Member accounts or customer portal" },
  { value: "native_booking", label: "New custom booking system" },
  { value: "custom_api", label: "Custom API or complex automation" },
  { value: "other", label: "Something else" },
];

export function StrategyStep({ initial, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<Strategy>(() => initial ?? strategySchema.parse({}));
  const [busy, setBusy] = useState(false);
  const { state, flush } = useAutosave(data, (value) => save(value));
  useEffect(() => onSaveState(state), [state, onSaveState]);
  const set = <K extends keyof Strategy>(key: K, value: Strategy[K]) => setData((current) => ({ ...current, [key]: value }));

  const toggle = <K extends "pages" | "features">(key: K, value: Strategy[K][number]) => {
    setData((current) => {
      const values = current[key] as string[];
      return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] } as Strategy;
    });
  };

  const continueNext = async () => {
    setBusy(true);
    const ok = await flush();
    const done = ok && (await save(data, true));
    setBusy(false);
    if (done) onNext();
  };

  return (
    <div className="space-y-6">
      <Field id="primary-goal" label="What is the main job of the new site?">
        <ChoiceCards
          name="Primary site goal"
          value={data.primaryGoal}
          onChange={(value) => set("primaryGoal", value)}
          options={[
            { value: "leads", label: "Generate enquiries", hint: "Calls, forms or quote requests" },
            { value: "sales", label: "Drive sales", hint: "Help visitors choose and buy" },
            { value: "bookings", label: "Get bookings", hint: "Appointments, tables or events" },
            { value: "inform", label: "Explain the business", hint: "Make information easy to find" },
            { value: "portfolio", label: "Showcase our work", hint: "Projects, results or case studies" },
            { value: "other", label: "Something else" },
          ]}
        />
      </Field>

      <Field id="success" label="What would make the site a success six months after launch?" optional>
        <TextArea id="success" rows={3} value={data.success} onChange={(event) => set("success", event.target.value)} maxLength={600} placeholder="For example: more qualified quote requests, fewer basic phone questions, or 20 online bookings a week." />
      </Field>

      <Field id="audience" label="Who are the most important people the site needs to speak to?" hint="Describe the customer, client or community in plain language.">
        <TextArea id="audience" rows={4} value={data.audience} onChange={(event) => set("audience", event.target.value)} maxLength={1000} />
      </Field>

      <fieldset>
        <legend className="text-[13px] font-medium">Which pages do you expect?</legend>
        <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">This is a starting point. We will confirm the final structure with you.</p>
        <div className="mt-3 max-w-[14rem]">
          <Field id="estimated-pages" label="Approximate primary pages" optional hint="Professional includes up to 8. Legal and utility pages do not count.">
            <TextInput id="estimated-pages" type="number" min={1} max={100} value={data.estimatedPageCount ?? ""} onChange={(event) => set("estimatedPageCount", event.target.value ? Number(event.target.value) : null)} />
          </Field>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAGE_OPTIONS.map((option) => <CheckOption key={option.value} checked={data.pages.includes(option.value)} label={option.label} onChange={() => toggle("pages", option.value)} />)}
        </div>
        {data.pages.includes("other") ? <TextArea className="mt-2" rows={2} value={data.otherPages} onChange={(event) => set("otherPages", event.target.value)} maxLength={500} placeholder="Other pages or sections you have in mind" /> : null}
        {(data.estimatedPageCount ?? 0) > 8 ? <div className="mt-3"><VirtueAside>Professional includes eight primary pages. Our team will review the additional pages and confirm any add-on before work begins.</VirtueAside></div> : null}
      </fieldset>

      <fieldset>
        <legend className="text-[13px] font-medium">What should visitors be able to do?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {FEATURE_OPTIONS.map((option) => <CheckOption key={option.value} checked={data.features.includes(option.value)} label={option.label} onChange={() => toggle("features", option.value)} />)}
        </div>
        <TextArea className="mt-2" rows={3} value={data.featureNotes} onChange={(event) => set("featureNotes", event.target.value)} maxLength={1000} placeholder="Tell us how these should work, including any tools you already use." />
        {data.features.some((feature) => ["ecommerce", "memberships", "native_booking", "custom_api"].includes(feature)) ? <div className="mt-3"><VirtueAside>That may need a custom or add-on scope. Our team will review it with you before the build begins; nothing extra is added without your approval.</VirtueAside></div> : null}
      </fieldset>

      <Field id="content-status" label="How ready is your written content?">
        <ChoiceCards
          name="Content readiness"
          value={data.contentStatus}
          onChange={(value) => set("contentStatus", value)}
          options={[
            { value: "ready", label: "Mostly ready", hint: "We have copy we can provide" },
            { value: "partial", label: "Some is ready", hint: "We need help shaping the rest" },
            { value: "needs_help", label: "We need writing help", hint: "Start from what we tell you" },
          ]}
        />
      </Field>

      <fieldset>
        <legend className="text-[13px] font-medium">Sites you like <span className="font-normal opacity-70">(optional)</span></legend>
        <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Up to three. Tell us what you like; we will not copy another site.</p>
        <div className="mt-2 space-y-3">
          {[0, 1, 2].map((index) => {
            const reference = data.references[index] ?? { url: "", notes: "" };
            return (
              <div key={index} className="grid gap-2 rounded-xl border border-[color:var(--border)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <TextInput aria-label={`Reference site ${index + 1}`} value={reference.url} onChange={(event) => set("references", updateReference(data.references, index, "url", event.target.value))} placeholder="https://example.com" />
                <TextInput aria-label={`What you like about reference ${index + 1}`} value={reference.notes} onChange={(event) => set("references", updateReference(data.references, index, "notes", event.target.value))} placeholder="What do you like about it?" />
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="approver-name" label="Who gives final approval?" optional>
          <TextInput id="approver-name" value={data.approver.name} onChange={(event) => set("approver", { ...data.approver, name: event.target.value })} maxLength={120} placeholder="Name" />
        </Field>
        <Field id="approver-email" label="Approval email" optional>
          <TextInput id="approver-email" type="email" value={data.approver.email} onChange={(event) => set("approver", { ...data.approver, email: event.target.value })} maxLength={160} placeholder="name@business.com" />
        </Field>
      </div>

      <Field id="target-launch" label="Is there a date or event you are working toward?" optional hint="This is not a confirmed launch date. We will agree the schedule after reviewing the brief.">
        <TextInput id="target-launch" value={data.targetLaunch} onChange={(event) => set("targetLaunch", event.target.value)} maxLength={120} placeholder="For example: opening in March, or no fixed date" />
      </Field>

      <Field id="strategy-notes" label="Anything else we should discuss before design starts?" optional>
        <TextArea id="strategy-notes" rows={4} value={data.notes} onChange={(event) => set("notes", event.target.value)} maxLength={1200} />
      </Field>

      <StepFooter onBack={onBack} onNext={continueNext} busy={busy} />
    </div>
  );
}

function CheckOption({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" aria-pressed={checked} onClick={onChange} className={clsx("min-h-11 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors", checked ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-[color:var(--border)] hover:border-[color:var(--text-secondary)]")}>
      <span className="mr-2 inline-block h-3.5 w-3.5 rounded border align-[-2px]" style={checked ? { background: "var(--accent)", borderColor: "var(--accent)" } : undefined} />
      {label}
    </button>
  );
}

function updateReference(references: Strategy["references"], index: number, key: "url" | "notes", value: string): Strategy["references"] {
  const next = Array.from({ length: Math.max(references.length, index + 1) }, (_, current) => references[current] ?? { url: "", notes: "" });
  next[index] = { ...next[index], [key]: value };
  while (next.length && !next[next.length - 1].url && !next[next.length - 1].notes) next.pop();
  return next;
}
