"use client";
import { CapabilityControl } from "../CapabilityControl";
import { useState } from "react";
import { actionItems, itemActionDisplays, getActionCapabilities, type PresentationCapability } from "../../actions/capabilities";
import type { ActionPresentation, ActionSlot, ContextualActions } from "../../actions/schema";
import { parseSection, type SectionInstance } from "../../composition/schemas";
import type { SiteDefinition } from "../../site/model";
import { resolveAction } from "../../site/actions";
import { resolveRoutes } from "../../site/routes";
import type { Action } from "../../site/action-schema";
import { ActionForm } from "./ActionEditor";
import { sectionCTAAnimation, type CTAAnimation } from "../../presentation/schema";

type Target = { key: string; label: string; presentation: PresentationCapability; group?: string; itemId?: string; displays?: readonly ("link" | "media" | "whole-item")[] };
export function ContextualActionsEditor({ site, section, onChange, onPreview }: { site: SiteDefinition; section: SectionInstance; onChange: (section: SectionInstance) => void; onPreview?: (section: SectionInstance | null) => void }) {
  const capability = getActionCapabilities(section.component);
  const targets: Target[] = [
    ...(capability.primary ? [{ key: "primary", label: "Primary CTA", presentation: capability.primary }] : []),
    ...(capability.secondary ? [{ key: "secondary", label: "Secondary CTA", presentation: capability.secondary }] : []),
    ...capability.items.flatMap(group => actionItems(section, group).map(record => ({ key: `${group.group}:${record.id}`, label: `${group.label}: ${record.label}`, presentation: group.presentation, group: group.group, itemId: record.id, displays: itemActionDisplays(section, group, record.id) }))),
  ];
  const [selected, setSelected] = useState(targets[0]?.key ?? "");
  const target = targets.find(target => target.key === selected) ?? targets[0];
  const configured = target?.group ? section.contextualActions?.items?.find(item => item.group === target.group && item.itemId === target.itemId) : undefined;
  const slot = target?.group ? configured?.slot : section.contextualActions?.[target?.key as "primary" | "secondary"];
  const group = capability.items.find(group => group.group === target?.group);
  const record = group ? actionItems(section, group).find(record => record.id === target?.itemId)?.record : undefined;
  const candidate = record?.destination ?? record?.detail ?? (target?.key === "primary" && "action" in section.content ? section.content.action : target?.key === "secondary" && "secondaryAction" in section.content ? section.content.secondaryAction : undefined);
  const fallback = candidate && typeof candidate === "object" && "href" in candidate && typeof candidate.href === "string" && "label" in candidate && typeof candidate.label === "string" ? {href:candidate.href,label:candidate.label} : undefined;
  const legacyBinding = section.actions?.find(binding => !target?.group && binding.path[1] === (target?.key === "secondary" ? "secondaryAction" : "action"));
  function actionCandidate(slot: ActionSlot | undefined, display: "link" | "media" | "whole-item" = "link") {
    const actions: ContextualActions = structuredClone(section.contextualActions ?? {});
    if (target.group) {
      actions.items = (actions.items ?? []).filter(item => item.group !== target.group || item.itemId !== target.itemId);
      if (slot) actions.items.push({ group: target.group, itemId: target.itemId!, display, slot });
    } else if (slot) actions[target.key as "primary" | "secondary"] = slot;
    else delete actions[target.key as "primary" | "secondary"];
    const next = parseSection({ ...section, contextualActions: actions });
    return next;
  }
  function commit(slot: ActionSlot | undefined, display: "link" | "media" | "whole-item" = "link") {
    const next = actionCandidate(slot, display);
    // Disable/remove remains possible even when another destination is broken.
    if (slot?.enabled) {
      const result = resolveAction(site, slot.action);
      if (result.issue) throw new Error(result.issue);
    }
    onChange(next);
  }
  const stale = section.contextualActions?.items?.filter(item => !targets.some(target => target.group === item.group && target.itemId === item.itemId)) ?? [];
  return <details className="composition-contextual-actions" open><summary>Contextual actions</summary>
    <p>{capability.classification} · {capability.reason}</p>
    {target && <><label>Action slot<select aria-label="Action slot" value={target.key} onChange={event => setSelected(event.target.value)}>{targets.map(target => <option key={target.key} value={target.key}>{target.label}</option>)}</select></label>
      <SlotEditor key={`${section.id}-${target.key}-${JSON.stringify(slot)}-${configured?.display}`} site={site} target={target} slot={slot} fallback={fallback} legacyAction={legacyBinding?.action} display={configured?.display} ctaAnimation={sectionCTAAnimation(section.presentation)} onCommit={commit} onPreview={(slot, display) => { try { onPreview?.(slot ? actionCandidate(slot, display) : null); } catch { onPreview?.(null); } }}/></>}
    {stale.length > 0 && <><p role="alert">Missing action items: {stale.map(item => item.itemId).join(", ")}. Choose a new item explicitly.</p><button type="button" onClick={() => onChange(parseSection({ ...section, contextualActions: { ...section.contextualActions, items: section.contextualActions?.items?.filter(item => !stale.includes(item)) } }))}>Remove missing item actions</button></>}
  </details>;
}
function SlotEditor({ site, target, slot, fallback, legacyAction, display: initialDisplay, ctaAnimation, onCommit, onPreview }: { site: SiteDefinition; target: Target; slot?: ActionSlot; fallback?: {href:string;label:string}; legacyAction?: Action; display?: "link" | "media" | "whole-item"; ctaAnimation?: CTAAnimation; onCommit: (slot?: ActionSlot, display?: "link" | "media" | "whole-item") => void; onPreview?: (slot?: ActionSlot, display?: "link" | "media" | "whole-item") => void }) {
  const [enabled, setEnabled] = useState(slot?.enabled ?? !!fallback);
  const [label, setLabel] = useState(slot?.label ?? fallback?.label ?? (target.group ? "Learn more" : target.key === "primary" ? "Start project" : "View work"));
  const [presentation, setPresentation] = useState<ActionPresentation>(slot?.presentation ?? {});
  const [display, setDisplay] = useState(initialDisplay ?? "link");
  const [error, setError] = useState("");
  const initial = slot?.action ?? legacyAction ?? (fallback ? actionForHref(site, fallback.href) : undefined);
  const resolved = initial ? resolveAction(site, initial) : undefined;
  function apply(action: Action) {
    try { onCommit({ enabled: true, label, action, presentation: display === "media" ? undefined : presentation }, display); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Invalid action configuration."); }
  }
  return <div className="composition-slot-editor">
    <label><input type="checkbox" aria-label="CTA enabled" checked={enabled} onChange={event => { setEnabled(event.target.checked); if (!event.target.checked) onCommit({ enabled: false, ...(label.trim() ? {label} : {}), ...(initial ? {action:initial} : {}), ...(display === "media" ? {} : {presentation}) }, display); }}/>CTA enabled</label>
    {enabled && <>
      <label>CTA label<input aria-label="CTA label" value={label} maxLength={120} onChange={event => setLabel(event.target.value)}/></label>
      {target.displays && target.displays.length > 1 && <label>Item interaction<select aria-label="Item interaction" value={display} onChange={event => setDisplay(event.target.value as typeof display)}>{target.displays.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
      {display !== "media" && <ActionPresentationControls capability={target.presentation} value={presentation} ctaAnimation={ctaAnimation} onChange={setPresentation} onPreview={value => onPreview?.(value ? {enabled:true,label,action:initial ?? {type:"page",pageId:site.navigation.homePageId},presentation:value} : undefined, display)}/>}
      <ActionForm key={JSON.stringify(initial)} site={site} initial={initial} onApply={apply}/>
      {initial && <><p>{resolved?.issue ?? `Opens ${resolved?.href}`}</p><button type="button" onClick={() => apply(initial)}>Apply CTA settings</button></>}
      <p role="alert">{error || resolved?.issue}</p>
    </>}
    {slot && <button type="button" onClick={() => onCommit()}>Restore component’s authored action</button>}
  </div>;
}
function actionForHref(site: SiteDefinition, href: string): Action | undefined {
  if (/^https?:\/\//.test(href)) return {type:"external",url:href};
  if (href.startsWith("mailto:")) return {type:"email",email:href.slice(7)};
  if (href.startsWith("tel:")) return {type:"phone",phone:href.slice(4)};
  const [route, sectionId] = href.split("#");
  const pageId = [...resolveRoutes(site)].find(([, value]) => value === route)?.[0];
  if (pageId) return sectionId ? {type:"section",pageId,sectionId} : {type:"page",pageId};
}
export function ActionPresentationControls({ capability, value, ctaAnimation, onChange, onPreview }: { capability: PresentationCapability; value: ActionPresentation; ctaAnimation?: CTAAnimation; onChange: (value: ActionPresentation) => void; onPreview?: (value: ActionPresentation | null) => void }) {
  const names: Record<string, string> = { variant: "CTA visual style", size: "CTA size", alignment: "CTA alignment", width: "CTA width", surface: "CTA surface", shape: "CTA shape", hover: "CTA hover" };
  function patch(key: keyof ActionPresentation, selected: string): ActionPresentation {
    const next = { ...value };
    if (!selected) delete next[key]; else Object.assign(next, { [key]: selected });
    return next;
  }
  return <div className="composition-action-presentation">
    {ctaAnimation !== undefined && <p>CTA animation is {ctaAnimation.replace(/-/g," ")} for this section. Edit it in Motion, or choose Inherit there for individual button hover styles.</p>}
    {Object.entries(capability).filter(([key, options]) => names[key] && options && options.length > 1 && (key !== "hover" || ctaAnimation === undefined)).map(([key, options]) => <CapabilityControl key={key} label={names[key]} value={String(value[key as keyof ActionPresentation] ?? "")} choices={[{value:"",label:"Component default"}, ...options!.map(option => ({value:String(option)}))]} onChange={selected => onChange(patch(key as keyof ActionPresentation, selected))} onPreview={selected => onPreview?.(selected === null ? null : patch(key as keyof ActionPresentation, selected))}/>)}
    {capability.icon && <CapabilityControl label="CTA icon" value={value.icon === undefined ? "" : value.icon ?? "none"} choices={[{value:"",label:"Component default"},{value:"none",label:"No icon"}, ...capability.icon.map(value => ({value:String(value)}))]} onChange={selected => onChange(selected === "none" ? {...value,icon:null} : patch("icon",selected))} onPreview={selected => onPreview?.(selected === null ? null : selected === "none" ? {...value,icon:null} : patch("icon",selected))}/> }
    {value.icon && capability.iconPosition && <CapabilityControl label="CTA icon position" value={value.iconPosition ?? "trailing"} choices={capability.iconPosition.map(value => ({value:String(value)}))} onChange={selected => onChange(patch("iconPosition",selected))} onPreview={selected => onPreview?.(selected === null ? null : patch("iconPosition",selected))}/>}
    <p>Component defaults inherit the page button settings. Choose a local style to override them.</p>
  </div>;
}

/** Shared hierarchy for every action picker, including Navigation's direct editor. */
export function sitePageChoices(site: SiteDefinition): { id: string; label: string }[] {
  const routes = resolveRoutes(site), choices: { id: string; label: string }[] = [];
  function branch(parentId: string | null, depth: number) {
    site.pages.filter(page => page.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).forEach(page => {
      choices.push({ id: page.id, label: `${"　".repeat(depth)}${depth ? "↳ " : ""}${page.title} · ${routes.get(page.id)}` });
      branch(page.id, depth + 1);
    });
  }
  branch(null, 0); return choices;
}
