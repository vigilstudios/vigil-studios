"use client";
import { useId, useState } from "react";
import type { PageComposition, SectionId, SectionInstance } from "../../composition/schemas";
import { designComponents } from "../../registry/components";
import { prepareSectionAddition } from "./addition";
import { sectionOptionGroups } from "./options";

const groups = sectionOptionGroups(designComponents);

export function AddSectionCard({ composition, onAdd, onPreview }: {
  composition: PageComposition;
  onAdd: (composition: PageComposition, section: SectionInstance) => void;
  onPreview?: (component: SectionId | null) => void;
}) {
  const [category, setCategory] = useState("");
  const availabilityId = useId();
  const choices = groups.map(group => ({ ...group, options: group.options.map(option => ({
    ...option, addition: prepareSectionAddition(composition, option.value),
  })) }));
  const group = choices.find(group => group.category === category);
  const available = group?.options.filter(option => !option.addition.reason) ?? [];
  return <section className="composition-add-section" aria-label="Add a section">
    <h3>Add a section</h3>
    <label className="composition-control">Section type<select aria-label="Section type" value={category} onChange={event => { onPreview?.(null); setCategory(event.target.value); }}>
      <option value="" disabled>Choose a section type…</option>
      {choices.map(group => {
        const count = group.options.filter(option => !option.addition.reason).length;
        return <option key={group.category} value={group.category}>{group.label}{count ? ` · ${count} available` : " — unavailable"}</option>;
      })}
    </select></label>
    <p id={availabilityId}>{composition.sections.length >= 20 ? "This composition has reached the 20-section limit." : group ? `${available.length} of ${group.options.length} styles available. Hover or focus to preview; click to add.` : "Choose a section type to browse styles."}</p>
    {group && <div className="composition-style-list" role="group" aria-label="Section styles" aria-describedby={availabilityId}
      onPointerLeave={() => onPreview?.(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onPreview?.(null); }}
      onKeyDown={event => { if (event.key === "Escape") { onPreview?.(null); event.currentTarget.querySelector<HTMLButtonElement>(":focus")?.blur(); } }}>
      {group.options.map(option => <button key={option.value} type="button" aria-disabled={Boolean(option.addition.reason)}
        onPointerEnter={event => { if (event.pointerType !== "touch") onPreview?.(option.addition.reason ? null : option.value); }}
        onFocus={() => onPreview?.(option.addition.reason ? null : option.value)}
        onClick={() => {
          const addition = prepareSectionAddition(composition, option.value);
          if (addition.reason) return;
          onPreview?.(null); onAdd(addition.composition, addition.section);
        }}>
        <span>{option.label}</span>
        {option.addition.reason ? <small>{option.addition.reason}</small> : Object.keys(option.addition.section.overrides ?? {}).length > 0 ? <small>Local layers: {Object.values(option.addition.section.overrides ?? {}).join(" · ")}</small> : null}
      </button>)}
    </div>}
  </section>;
}
