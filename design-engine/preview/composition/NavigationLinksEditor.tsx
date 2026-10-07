"use client";
import { sitePageChoices } from "./ContextualActionsEditor";
import { useState, type ReactNode } from "react";
import { parseSection, type SectionInstance } from "../../composition/schemas";
import type { Action, ActionBinding } from "../../site/action-schema";
import { hrefFields, resolveAction } from "../../site/actions";
import { effectiveSections, type SiteDefinition } from "../../site/model";
import { navigationLimits } from "../../site/navigation";
import { resolveRoutes } from "../../site/routes";
import { applyNavigationButton, applyNavigationLinks, destinationAction, navigationContent, navigationLinkDrafts, resolvedDraftHref, restoreSiteTreeNavigation, type NavigationLinkDraft } from "./navigation-editing";

export function NavigationLinksEditor({ site, section, onChange, onSiteChange, onOpenPages }: { site: SiteDefinition; section: SectionInstance; onChange: (section: SectionInstance) => void; onSiteChange?: (site: SiteDefinition) => void; onOpenPages?: () => void }) {
  const [links, setLinks] = useState(() => navigationLinkDrafts(site, section));
  const [error, setError] = useState("");
  const limits = navigationLimits(section.component), content = navigationContent(section);
  function attempt(operation: () => void) { try { operation(); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Could not update navbar links."); } }
  function group(items: NavigationLinkDraft[], path: number[] = []): ReactNode {
    const updateGroup = (next: NavigationLinkDraft[]) => {
      if (!path.length) { setLinks(next); return; }
      const copy = structuredClone(links); let branch = copy;
      for (let index = 0; index < path.length - 1; index++) branch = branch[path[index]].children!;
      const parent = branch[path.at(-1)!];
      if (next.length) parent.children = next; else delete parent.children;
      setLinks(copy);
    };
    const depth = path.length + 1;
    return <ol className="composition-navbar-items">{items.map((item, index) => {
      const number = [...path, index].map(value => value + 1).join("."), title = item.label || `Menu item ${number}`;
      const edit = (next: NavigationLinkDraft) => updateGroup(items.map((value, at) => at === index ? next : value));
      const move = (direction: -1 | 1) => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; updateGroup(next); };
      return <li key={number}><fieldset><legend>{title}</legend>
        <label>Menu label<input aria-label={`Menu label ${number}`} value={item.label} maxLength={80} required onChange={event => edit({ ...item, label: event.target.value })}/></label>
        <DestinationControl site={site} draft={item} label={`Destination ${number}`} onChange={next => edit(next)}/>
        <div className="composition-page-tools"><button type="button" disabled={index === 0} aria-label={`Move ${title} up`} onClick={() => move(-1)}>↑</button><button type="button" disabled={index === items.length - 1} aria-label={`Move ${title} down`} onClick={() => move(1)}>↓</button><button type="button" aria-label={`Remove menu item ${number}`} onClick={() => updateGroup(items.filter((_, at) => at !== index))}>Remove</button>
          {(limits.maxDepth === null || depth < limits.maxDepth) && (item.children?.length ?? 0) < 6 && <button type="button" onClick={() => edit({ ...item, children: [...(item.children ?? []), { label: "", href: "" }] })}>Add submenu item</button>}
        </div></fieldset>{item.children?.length ? group(item.children, [...path, index]) : null}</li>;
    })}</ol>;
  }
  const shared = section.navigationSource ? site.navigation.action : undefined;
  const buttons: { name: string; path: ActionBinding["path"]; draft: NavigationLinkDraft; shared?: boolean }[] = [];
  const homeAction = section.actions?.find(binding => binding.path.length === 2 && binding.path[1] === "home")?.action;
  const homeHref = section.navigationSource && !homeAction ? resolveRoutes(site).get(site.navigation.homePageId)! : content.home;
  buttons.push({ name: "Logo / home link", path: ["content", "home"], draft: { label: "Logo / home", href: homeHref, action: homeAction ?? destinationAction(site, homeHref) } });
  if (shared || content.action) {
    const action = shared?.action ?? section.actions?.find(binding => JSON.stringify(binding.path) === JSON.stringify(["content", "action", "href"]))?.action;
    const draft = shared ? { label: shared.label, href: resolveAction(site, shared.action).href ?? "", action: shared.action } : { ...content.action!, action: action ?? destinationAction(site, content.action!.href) };
    buttons.push({ name: "Navbar button", path: ["content", "action", "href"], draft, shared: Boolean(shared) });
  }
  content.utilities?.forEach((item, index) => {
    const path = ["content", "utilities", index, "href"];
    buttons.push({ name: `${item.kind[0].toUpperCase()}${item.kind.slice(1)} link`, path, draft: { ...item, action: section.actions?.find(binding => JSON.stringify(binding.path) === JSON.stringify(path))?.action ?? destinationAction(site, item.href) } });
  });
  return <section className="composition-panel composition-navbar-editor"><h2>Navbar links</h2>
    <p>Give each menu item a label and choose the page it opens.</p>
    {onOpenPages && <button type="button" onClick={onOpenPages}>Manage pages</button>}
    <p className="lab-layer-note">{section.navigationSource ? "This menu follows the Site Tree. Applying item edits creates a custom menu; your pages stay unchanged." : "Custom menu. Page destinations stay linked when their URLs change."}</p>
    <form onSubmit={event => { event.preventDefault(); attempt(() => onChange(applyNavigationLinks(site, section, links))); }}>
      {group(links)}<button type="button" disabled={links.length >= limits.max} onClick={() => setLinks([...links, { label: "", href: "" }])}>Add menu item</button>
      <p className="lab-layer-note">This navbar supports {limits.min}–{limits.max} main menu items{limits.maxDepth === 1 ? " and no submenus" : limits.maxDepth === null ? " and nested submenus" : ` and ${limits.maxDepth - 1} submenu level`}.</p>
      <button type="submit">Apply navbar links</button>
    </form>
    <details><summary>Use pages from the Site Tree</summary><p>Replace this menu with visible pages in their Site Tree order. Labels come from each page’s Navigation label.</p><form onSubmit={event => { event.preventDefault(); attempt(() => {
      const depth = new FormData(event.currentTarget).get("depth") as "all" | "top-level";
      onChange(restoreSiteTreeNavigation(site, section, depth));
    }); }}><label>Include<select aria-label="Site Tree menu structure" name="depth" defaultValue={section.navigationSource?.depth ?? (limits.maxDepth === 1 ? "top-level" : "all")}><option value="all">Pages and their nested pages</option><option value="top-level">Top-level pages only</option></select></label><button type="submit">Use Site Tree menu</button></form></details>
    {buttons.map(button => <NavbarButtonEditor key={JSON.stringify(button)} name={button.name} site={site} initial={button.draft} onApply={draft => attempt(() => {
      if (button.shared && onSiteChange) {
        resolvedDraftHref(site, draft);
        if (!draft.action) throw new Error("Choose a page or another destination type for this shared button.");
        if (!draft.label.trim()) throw new Error("Enter a button label.");
        onSiteChange({ ...site, navigation: { ...site.navigation, action: { label: draft.label.trim(), action: draft.action } } });
      } else onChange(applyNavigationButton(site, section, button.path, draft));
    })}/>)}
    {section.actions?.some(binding => !hrefFields(section).some(field => JSON.stringify(field.path) === JSON.stringify(binding.path))) && <button type="button" onClick={() => attempt(() => onChange(parseSection({ ...section, actions: section.actions?.filter(binding => hrefFields(section).some(field => JSON.stringify(field.path) === JSON.stringify(binding.path))) })))}>Remove missing link bindings</button>}
    <p role="alert">{error}</p>
  </section>;
}

function NavbarButtonEditor({ name, site, initial, onApply }: { name: string; site: SiteDefinition; initial: NavigationLinkDraft; onApply: (draft: NavigationLinkDraft) => void }) {
  const [draft, setDraft] = useState(initial);
  return <form className="composition-navbar-button" onSubmit={event => { event.preventDefault(); onApply(draft); }}><h3>{name}</h3>{name !== "Logo / home link" && <label>{name === "Navbar button" ? "Button label" : "Link label"}<input aria-label={`${name} label`} value={draft.label} maxLength={80} required onChange={event => setDraft({ ...draft, label: event.target.value })}/></label>}<DestinationControl site={site} draft={draft} label={`${name} destination`} onChange={setDraft}/><button type="submit">Apply {name.toLowerCase()}</button></form>;
}

function DestinationControl({ site, draft, label, onChange }: { site: SiteDefinition; draft: NavigationLinkDraft; label: string; onChange: (draft: NavigationLinkDraft) => void }) {
  const action = draft.action;
  const selected = action?.type === "page" ? `page:${action.pageId}` : action?.type ?? (draft.href ? "authored" : "");
  const pageLabel = (id: string) => { const page = site.pages.find(page => page.id === id); return page?.navLabel ?? page?.title ?? ""; };
  const choose = (value: string) => {
    let next: Action | undefined;
    if (value.startsWith("page:")) next = { type: "page", pageId: value.slice(5) };
    else if (value === "section") next = { type: "section", pageId: action && "pageId" in action ? action.pageId : site.navigation.homePageId, sectionId: "" };
    else if (value === "external") next = { type: "external", url: "" };
    else if (value === "email") next = { type: "email", email: "" };
    else if (value === "phone") next = { type: "phone", phone: "" };
    else if (value === "download") next = { type: "download", url: "" };
    const defaultLabel = next?.type === "page" && (!draft.label || action?.type === "page" && draft.label === pageLabel(action.pageId)) ? pageLabel(next.pageId) : draft.label;
    onChange({ ...draft, label: defaultLabel, action: next });
  };
  let href = "", issue = "";
  try { href = resolvedDraftHref(site, draft); } catch (error) { issue = error instanceof Error ? error.message : "Choose a destination."; }
  const targetPage = action?.type === "section" ? site.pages.find(page => page.id === action.pageId) : undefined;
  return <div className="composition-navbar-destination"><label>Destination<select aria-label={label} value={selected} required onChange={event => choose(event.target.value)}>
    <option value="" disabled>Choose a page…</option>
    {action?.type === "page" && !site.pages.some(page => page.id === action.pageId) && <option value={selected}>Missing page — choose a replacement</option>}
    <optgroup label="Pages">{sitePageChoices(site).map(page => <option key={page.id} value={`page:${page.id}`}>{page.label}</option>)}</optgroup>
    <optgroup label="Other destinations"><option value="external">External website</option><option value="section">Section on a page</option><option value="email">Email</option><option value="phone">Phone</option><option value="download">Download</option>{!action && draft.href && <option value="authored">Existing URL</option>}</optgroup>
  </select></label>
    {action?.type === "section" && <><label>Page<select aria-label={`${label} page`} value={action.pageId} onChange={event => onChange({ ...draft, action: { type: "section", pageId: event.target.value, sectionId: "" } })}>{!targetPage && <option value={action.pageId}>Missing page</option>}{sitePageChoices(site).map(page => <option key={page.id} value={page.id}>{page.label}</option>)}</select></label><label>Section<select aria-label={`${label} section`} value={action.sectionId} required onChange={event => onChange({ ...draft, action: { ...action, sectionId: event.target.value } })}><option value="">Choose a section…</option>{targetPage && effectiveSections(site, targetPage).map((section, index) => <option key={section.id} value={section.id}>{index + 1}. {section.component.replace(/^[^.]+\./, "").replaceAll("-", " ")}</option>)}</select></label></>}
    {action && ["external", "email", "phone", "download"].includes(action.type) && <label>{action.type === "email" ? "Email address" : action.type === "phone" ? "Phone number" : "URL"}<input aria-label={`${label} value`} type={action.type === "email" ? "email" : "text"} required value={"url" in action ? action.url : "email" in action ? action.email : "phone" in action ? action.phone : ""} onChange={event => onChange({ ...draft, action: action.type === "email" ? { ...action, email: event.target.value } : action.type === "phone" ? { ...action, phone: event.target.value } : { ...action, url: event.target.value } as Action })}/></label>}
    {action?.type === "download" && <label>Filename (optional)<input aria-label={`${label} filename`} value={action.filename ?? ""} onChange={event => onChange({ ...draft, action: { ...action, filename: event.target.value || undefined } })}/></label>}
    {!action && draft.href && <label>URL<input aria-label={`${label} URL`} value={draft.href} onChange={event => onChange({ ...draft, href: event.target.value })}/></label>}
    {href ? <p className="composition-navbar-route">Opens {href}</p> : issue && <p className="lab-layer-note">{issue}</p>}
  </div>;
}
