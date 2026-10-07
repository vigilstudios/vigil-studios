"use client";
import { ContextualActionsEditor, sitePageChoices } from "./ContextualActionsEditor";
import { useState } from "react";
import { parseSection, type SectionInstance } from "../../composition/schemas";
import { actionSchema, type Action } from "../../site/action-schema";
import { hrefFields, materializeActions, resolveAction } from "../../site/actions";
import { effectiveSections, type SiteDefinition } from "../../site/model";
import { NavigationLinksEditor } from "./NavigationLinksEditor";
export function ActionEditor({ site, section, onChange, onSiteChange, onOpenPages, onPreview }: { site: SiteDefinition; section: SectionInstance; onChange: (section: SectionInstance) => void; onSiteChange?: (site: SiteDefinition) => void; onOpenPages?: () => void; onPreview?: (section: SectionInstance | null) => void }) {
  const fields = hrefFields(section), [path, setPath] = useState(fields[0] ? JSON.stringify(fields[0].path) : "");
  const [error, setError] = useState("");
  const binding = section.actions?.find(binding => JSON.stringify(binding.path) === path);
  const isNavigation = section.component.startsWith("navigation.");
  if (isNavigation) return <><ContextualActionsEditor site={site} section={section} onChange={onChange} onPreview={onPreview}/><NavigationLinksEditor key={JSON.stringify({ content: section.content, actions: section.actions, source: section.navigationSource, pages: site.pages.map(page => [page.id, page.title, page.navLabel, page.slug, page.parentId, page.routeOverride, page.showInNavigation, page.status]), navigation: site.navigation })} site={site} section={section} onChange={onChange} onSiteChange={onSiteChange} onOpenPages={onOpenPages}/></>;
  function apply(action?: Action) {
    try {
      const actions = (section.actions ?? []).filter(binding => JSON.stringify(binding.path) !== path);
      if (action) actions.push({ path: JSON.parse(path), action: actionSchema.parse(action) });
      const next = parseSection({ ...section, actions }); parseSection(materializeActions(site, next)); onChange(next); setError("");
    } catch (error) { setError(String(error)); }
  }
  return <><ContextualActionsEditor site={site} section={section} onChange={onChange} onPreview={onPreview}/><details className="composition-action-editor"><summary>Page-aware actions</summary>
    {fields.length > 0 ? <><label>Action field<select aria-label="Action field" value={path} onChange={event => setPath(event.target.value)}>{fields.map(field => <option key={JSON.stringify(field.path)} value={JSON.stringify(field.path)}>{field.label} · {field.path.join(".")}</option>)}</select></label><ActionForm key={`${section.id}-${path}-${JSON.stringify(binding?.action)}`} site={site} initial={binding?.action} onApply={action => apply(action)}/><button type="button" disabled={!binding} onClick={() => apply()}>Use authored href for this field</button></> : <p>This structure has no direct href fields. Host-resolved destination keys remain supported by its existing contract.</p>}
    {(section.actions ?? []).some(binding => !fields.some(field => JSON.stringify(field.path) === JSON.stringify(binding.path))) && <button type="button" onClick={() => onChange(parseSection({ ...section, actions: section.actions?.filter(binding => fields.some(field => JSON.stringify(field.path) === JSON.stringify(binding.path))) }))}>Remove bindings for missing fields</button>}
    <p role="alert">{error}</p>
  </details></>;
}
export function ActionForm({ site, initial, onApply }: { site: SiteDefinition; initial?: Action; onApply: (action: Action) => void }) {
  const [type, setType] = useState<Action["type"]>(initial?.type ?? "page"), [pageId, setPageId] = useState(initial && "pageId" in initial ? initial.pageId : site.navigation.homePageId);
  const [error, setError] = useState("");
  return <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const value = String(data.get("value") ?? ""); const input = type === "page" ? { type, pageId } : type === "section" ? { type, pageId, sectionId: data.get("sectionId") } : type === "external" ? { type, url: value } : type === "email" ? { type, email: value } : type === "phone" ? { type, phone: value } : { type, url: value, ...(data.get("filename") ? { filename: data.get("filename") } : {}) }; try { const action = actionSchema.parse(input); const result = resolveAction(site, action); if (result.issue) throw new Error(result.issue); onApply(action); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Invalid action"); } }}>
    <label>Action type<select aria-label="Action type" value={type} onChange={event => setType(event.target.value as Action["type"])}>{["page", "section", "external", "email", "phone", "download"].map(value => <option key={value}>{value}</option>)}</select></label>
    {(type === "page" || type === "section") ? <><label>Target page<select aria-label="Target page" value={pageId} onChange={event => setPageId(event.target.value)}>{!site.pages.some(page => page.id === pageId) && <option value={pageId}>Missing: {pageId}</option>}{sitePageChoices(site).map(page => <option key={page.id} value={page.id}>{page.label}</option>)}</select></label>{type === "section" && <label>Target section<select key={pageId} aria-label="Target section" name="sectionId" defaultValue={initial?.type === "section" && initial.pageId === pageId ? initial.sectionId : ""}><option value="">Choose section</option>{initial?.type === "section" && initial.pageId === pageId && site.pages.some(page => page.id === pageId) && !effectiveSections(site, site.pages.find(page => page.id === pageId)!).some(section => section.id === initial.sectionId) && <option value={initial.sectionId}>Missing: {initial.sectionId}</option>}{site.pages.find(page => page.id === pageId) && effectiveSections(site, site.pages.find(page => page.id === pageId)!).map(section => <option key={section.id} value={section.id}>{section.id} · {section.component}</option>)}</select></label>}</> : <><label>{type === "email" ? "Email address" : type === "phone" ? "Phone number" : "Destination URL"}<input key={type} name="value" required defaultValue={initial && "url" in initial ? initial.url : initial?.type === "email" ? initial.email : initial?.type === "phone" ? initial.phone : ""}/></label>{type === "download" && <label>Download filename (optional)<input name="filename" defaultValue={initial?.type === "download" ? initial.filename : ""}/></label>}</>}
    <button type="submit">Apply typed action</button><p role="alert">{error}</p>
  </form>;
}
export function SiteActionControl({ site, onChange }: { site: SiteDefinition; onChange: (site: SiteDefinition) => void }) {
  const [label, setLabel] = useState(site.navigation.action?.label ?? "Contact");
  return <details><summary>Global Navigation action</summary><label>Action label<input value={label} onChange={event => setLabel(event.target.value)}/></label><ActionForm key={JSON.stringify(site.navigation.action)} site={site} initial={site.navigation.action?.action} onApply={action => onChange({ ...site, navigation: { ...site.navigation, action: { label, action } } })}/><button type="button" onClick={() => onChange({ ...site, navigation: { ...site.navigation, action: undefined } })}>Use Navigation section’s own action</button></details>;
}
