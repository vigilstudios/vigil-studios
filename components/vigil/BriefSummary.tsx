"use client";

import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { REGISTRAR_GUIDES } from "@/lib/vigil/domain-guides";
import { DAY_LABELS, type Brief, type ProjectKind, type StepKey } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import type { DomainStatus } from "@/lib/vigil/types";
import { StatusLine } from "./widgets";

export type BriefDomainView = { hostname: string; status: string };

/**
 * Everything in the brief, section by section. Read-only by default; the
 * wizard's review step adds "Edit" links, the admin customer page shows it
 * as submitted.
 */
export function BriefSummary({ brief, projectKind = "express", assets, domain, onEdit }: { brief: Brief; projectKind?: ProjectKind; assets: SignedAsset[]; domain: BriefDomainView | null; onEdit?: (step: StepKey) => void }) {
  const b = brief.basics;
  const strategy = brief.strategy;
  const o = brief.offerings;
  const a = brief.about;
  const br = brief.brand;
  const d = brief.domain;
  const itemCount = (o?.sections ?? []).reduce((n, s) => n + s.items.length, 0);
  const photos = assets.filter((x) => x.kind === "photo").length;
  const logos = assets.filter((x) => x.kind === "logo").length;
  const docs = assets.filter((x) => x.kind === "document").length;
  const inspiration = assets.filter((x) => x.kind === "other").length;
  const domainStatus = domain ? describeDomainStatus(domain.status as DomainStatus) : null;

  const hours = b?.hours.byAppointment
    ? "By appointment"
    : b?.hours.sameEveryDay
      ? (b.hours.days[0].closed ? "Closed" : `Every day ${b.hours.days[0].open || "?"}–${b.hours.days[0].close || "?"}`)
      : (b?.hours.days ?? []).filter((x) => x.closed || x.open || x.close).map((x) => `${DAY_LABELS[x.day].slice(0, 3)} ${x.closed ? "closed" : `${x.open || "?"}–${x.close || "?"}`}`).join(" · ");

  return (
    <div className="space-y-4">
      <Section title="Business basics" onEdit={onEdit ? () => onEdit("basics") : undefined}>
        {!b ? <Empty /> : null}
        <Row label="Name" value={b?.businessName} />
        <Row label="Tagline" value={b?.tagline} />
        <Row label="Phone" value={b?.phone} />
        <Row label="Email" value={b?.email} />
        <Row label="Address" value={[b?.address.line1, b?.address.line2, b?.address.city, b?.address.region, b?.address.postal, b?.address.country].filter(Boolean).join(", ")} />
        <Row label="Hours" value={hours} />
        <Row label="Hours notes" value={b?.hours.notes} />
      </Section>

      {projectKind !== "express" ? (
        <Section title="How the project begins" onEdit={onEdit && !brief.kickoff?.callBooked ? () => onEdit("kickoff") : undefined}>
          <Row label="Onboarding choice" value={brief.kickoff?.mode === "call" ? "Kickoff call with our team" : brief.kickoff?.mode === "both" ? "Kickoff call and guided brief" : brief.kickoff?.mode === "guided" ? "Guided brief with Virtue" : undefined} />
          <Row label="Call" value={brief.kickoff?.callBooked ? "Booked" : undefined} />
          {!brief.kickoff?.mode ? <Empty text="Not chosen yet" /> : null}
        </Section>
      ) : null}

      {projectKind !== "express" || strategy ? (
        <Section title="Site goals and scope" onEdit={onEdit ? () => onEdit("strategy") : undefined}>
          {!strategy ? <Empty /> : null}
          <Row label="Primary goal" value={strategy?.primaryGoal ? GOAL_LABELS[strategy.primaryGoal] : undefined} />
          <Row label="Success looks like" value={strategy?.success} multiline />
          <Row label="Audience" value={strategy?.audience} multiline />
          <Row label="Approximate primary pages" value={strategy?.estimatedPageCount ? String(strategy.estimatedPageCount) : undefined} />
          <Row label="Pages" value={strategy?.pages.map((page) => PAGE_LABELS[page]).join(", ")} />
          <Row label="Other pages" value={strategy?.otherPages} multiline />
          <Row label="Functionality" value={strategy?.features.map((feature) => FEATURE_LABELS[feature]).join(", ")} />
          <Row label="Function notes" value={strategy?.featureNotes} multiline />
          <Row label="Content" value={strategy?.contentStatus ? CONTENT_LABELS[strategy.contentStatus] : undefined} />
          {(strategy?.references ?? []).filter((reference) => reference.url || reference.notes).map((reference, index) => (
            <Row key={`${reference.url}-${index}`} label={`Reference ${index + 1}`} value={[reference.url, reference.notes].filter(Boolean).join(" — ")} multiline />
          ))}
          <Row label="Final approver" value={[strategy?.approver.name, strategy?.approver.email].filter(Boolean).join(" · ")} />
          <Row label="Target timing" value={strategy?.targetLaunch} />
          <Row label="Discussion notes" value={strategy?.notes} multiline />
        </Section>
      ) : null}

      <Section title="What you offer" onEdit={onEdit ? () => onEdit("offerings") : undefined}>
        {itemCount === 0 && !o?.notes ? <Empty /> : null}
        {(o?.sections ?? []).map((s) => (
          <div key={s.id} className="py-1.5">
            {s.name ? <p className="text-xs font-semibold">{s.name}</p> : null}
            <ul className="mt-0.5 space-y-0.5">
              {s.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 text-[13px]">
                  <span className="min-w-0">
                    {it.name}
                    {it.description ? <span className="text-[color:var(--text-secondary)]"> — {it.description}</span> : null}
                  </span>
                  {it.price ? <span className="shrink-0 text-[color:var(--text-secondary)]">{it.price}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Row label="Notes" value={o?.notes} />
      </Section>

      <Section title="About you" onEdit={onEdit ? () => onEdit("about") : undefined}>
        {!a?.story && !a?.different && !a?.hero ? <Empty /> : null}
        <Row label="Story" value={a?.story} multiline />
        <Row label="Different" value={a?.different} multiline />
        <Row label="Headline" value={a?.hero} />
      </Section>

      <Section title="Brand and photos" onEdit={onEdit ? () => onEdit("brand") : undefined}>
        <Row label="Logo" value={logos ? `${logos} file${logos === 1 ? "" : "s"}` : "None (team proposes a wordmark)"} />
        <Row label="Colours" value={br?.colours.mode === "pick" ? [br.colours.primary, br.colours.secondary].filter(Boolean).join(", ") || "To pick" : br?.colours.mode === "vigil" ? "Vigil chooses" : "From the logo"} />
        <Row label="Photos" value={photos ? `${photos}` : "None yet"} />
        <Row label="Documents" value={docs ? `${docs}` : undefined} />
        <Row label="Layout and style references" value={inspiration ? `${inspiration} file${inspiration === 1 ? "" : "s"}` : undefined} />
        <Row label="Visual direction" value={br?.direction} multiline />
        <Row label="Avoid" value={br?.avoid} multiline />
        <Row label="Social" value={Object.entries(br?.social ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")} />
        <Row label="Notes" value={br?.notes} />
      </Section>

      <Section title="Domain" onEdit={onEdit ? () => onEdit("domain") : undefined}>
        {!d?.answer ? <Empty text="Not decided yet" /> : null}
        {d?.answer === "own" ? (
          <>
            <Row label="Domain" value={d.hostname || "Not entered"} />
            <Row label="Managed at" value={d.registrar ? REGISTRAR_GUIDES[d.registrar].name : undefined} />
            {domainStatus ? (
              <div className="flex items-center justify-between py-1.5 text-[13px]">
                <span className="text-[color:var(--text-secondary)]">Connection</span>
                <StatusLine tone={domainStatus.tone} label={domainStatus.label} size="sm" />
              </div>
            ) : null}
            {d.delegate ? <Row label="DNS changes" value="Vigil will make them (temporary access)" /> : null}
            {d.later ? <Row label="Records" value="To add later, from the Domain page" /> : null}
          </>
        ) : null}
        {d?.answer === "need" ? <Row label="Preferred names" value={d.preferredNames.filter(Boolean).join(", ") || "None given"} /> : null}
        {d?.answer === "unsure" ? <Row label="Answer" value="Not sure yet — the team will help" /> : null}
      </Section>

    </div>
  );
}

const GOAL_LABELS = { leads: "Generate enquiries", sales: "Drive sales", bookings: "Get bookings", inform: "Explain the business", portfolio: "Showcase work", other: "Other" } as const;
const PAGE_LABELS = { home: "Home", about: "About", services: "Services", products: "Products", menu: "Menu", portfolio: "Portfolio", gallery: "Gallery", testimonials: "Testimonials", blog: "Blog", faq: "FAQ", contact: "Contact", other: "Other" } as const;
const FEATURE_LABELS = { contact_form: "Contact or quote form", multi_step_forms: "Multi-step form", booking: "Booking or scheduling", booking_embed: "Third-party booking link or embed", payments: "Online payments", simple_payments: "Simple payments or deposits", maps_reviews: "Maps or review widgets", analytics_tracking: "Analytics and conversion tracking", email_crm: "Email marketing or CRM forms", live_chat: "Live chat or messaging", social: "Social links or feeds", cms_blog: "CMS content", newsletter: "Email signup", blog: "Blog or news", events: "Events", gallery: "Gallery or portfolio", multilingual: "Multiple languages", basic_automation: "Simple Zapier or Make trigger", ecommerce: "Advanced online store", memberships: "Member accounts or portal", native_booking: "Custom booking system", custom_api: "Custom API or complex automation", other: "Other" } as const;
const CONTENT_LABELS = { ready: "Mostly ready", partial: "Some is ready", needs_help: "Needs writing help" } as const;

function Section({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[color:var(--border)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        ) : null}
      </div>
      <div className="mt-1 divide-y divide-[color:var(--border)]">{children}</div>
    </section>
  );
}

function Row({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  if (!value) return null;
  return (
    <div className={multiline ? "py-1.5 text-[13px]" : "flex justify-between gap-3 py-1.5 text-[13px]"}>
      <span className="shrink-0 text-[color:var(--text-secondary)]">{label}</span>
      <span className={multiline ? "mt-0.5 block whitespace-pre-wrap" : "min-w-0 text-right"}>{value}</span>
    </div>
  );
}

function Empty({ text = "Nothing added" }: { text?: string }) {
  return <p className="py-1.5 text-[13px] text-[color:var(--text-secondary)]">{text}</p>;
}
