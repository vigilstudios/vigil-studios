"use client";
import { useState } from "react";
import { getActionCapabilities, actionItems } from "../actions/capabilities";
import type { ContextualActions, ActionPresentation } from "../actions/schema";
import type { SectionInstance } from "../composition/schemas";
import { ActionPresentationControls } from "./composition/ContextualActionsEditor";
import { sectionCTAAnimation } from "../presentation/schema";
/** Design inspection uses a labelled external example; canonical destination editing belongs to Composition. */
export function ActionPreviewControls({ section, onChange }: { section: SectionInstance; onChange: (value?: ContextualActions) => void }) {
  const capability = getActionCapabilities(section.component);
  const [enabled, setEnabled] = useState(false), [value, setValue] = useState<ActionPresentation>({});
  const [target, setTarget] = useState(capability.primary ? "primary" : capability.secondary ? "secondary" : "item");
  const options = [capability.primary && "primary", capability.secondary && "secondary", capability.items.length > 0 && "item"].filter((value): value is string => !!value);
  function update(enabled: boolean, presentation: ActionPresentation, target: string) {
    if (!enabled) { onChange(undefined); return; }
    const slot = { enabled: true as const, label: "Explore example", action: { type: "external" as const, url: "https://example.com/" }, presentation };
    const group = capability.items[0], record = group && actionItems(section, group)[0];
    onChange(target === "item" && record ? { items: [{ group: group.group, itemId: record.id, display: "link", slot }] } : { [target]: slot });
  }
  const presentation = target === "item" ? capability.items[0]?.presentation : target === "primary" ? capability.primary : capability.secondary;
  return <details className="lab-control-wide"><summary>Preview contextual actions</summary><p>{capability.classification} · {capability.reason}</p>{presentation && <>
    <label><input type="checkbox" checked={enabled} onChange={event => { setEnabled(event.target.checked); update(event.target.checked, value, target); }}/>Preview example action</label>
    <label>Preview action slot<select value={target} onChange={event => { setTarget(event.target.value); setValue({}); update(enabled, {}, event.target.value); }}>{options.map(option => <option key={option}>{option}</option>)}</select></label>
    {enabled && <ActionPresentationControls capability={presentation} value={value} ctaAnimation={sectionCTAAnimation(section.presentation)} onPreview={next => update(enabled, next ?? value, target)} onChange={next => { setValue(next); update(enabled, next, target); }}/>}</>}
  </details>;
}
