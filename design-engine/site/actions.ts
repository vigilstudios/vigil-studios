import { contextualSlots } from "../actions/schema";
import { actionItems, getActionCapabilities } from "../actions/capabilities";
import type { SectionInstance } from "../composition/schemas";
import { actionSchema, type Action, type ActionBinding } from "./action-schema";
import { effectiveSections, type SiteDefinition } from "./model";
import { resolveRoutes } from "./routes";
export function resolveAction(site: SiteDefinition | undefined, input: Action): { href?: string; download?: string | true; issue?: string } {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return { issue: "Invalid action destination." };
  const action = parsed.data;
  switch (action.type) {
    case "page": case "section": {
      if (!site) return { issue: "A Site Definition is required to resolve this internal action." };
      const page = site.pages.find(page => page.id === action.pageId);
      if (!page) return { issue: `Missing page target: ${action.pageId}` };
      if (action.type === "section" && !effectiveSections(site, page).some(section => section.id === action.sectionId)) return { issue: `Missing section target: ${action.sectionId} on ${page.title}` };
      return { href: `${resolveRoutes(site).get(page.id)}${action.type === "section" ? `#${action.sectionId}` : ""}` };
    }
    case "external": return { href: action.url };
    case "email": return { href: `mailto:${action.email}` };
    case "phone": return { href: `tel:${action.phone.replace(/[(). -]/g, "")}` };
    case "download": return { href: action.url, download: action.filename ?? true };
  }
}
export function valueAtPath(value: unknown, path: ActionBinding["path"]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, key)) return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}
export function hrefFields(section: SectionInstance): { path: ActionBinding["path"]; label: string; href: string }[] {
  const result: { path: ActionBinding["path"]; label: string; href: string }[] = [];
  if (section.component.startsWith("navigation.") && "home" in section.content && typeof section.content.home === "string") result.push({ path: ["content", "home"], label: "Logo / home link", href: section.content.home });
  function walk(value: unknown, path: ActionBinding["path"]) {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      const next = [...path, Array.isArray(value) ? Number(key) : key];
      if (key === "href" && typeof item === "string") result.push({ path: next, label: String((value as { label?: string }).label ?? path.join(".")), href: item });
      else walk(item, next);
    }
  }
  walk(section.content, ["content"]); return result;
}
/** Typed content destinations (footer, contact and submission handoff) join existing action diagnostics. */
export function contentDestinations(value: unknown): Action[] {
  if(!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key,item]) => {
    if(key === "destination") { const action=actionSchema.safeParse(item); return action.success ? [item as Action] : []; }
    return contentDestinations(item);
  });
}
export function sectionContentDestinations(section: SectionInstance): Action[] {
  const content=section.navigationSource && section.component.startsWith("footer.") ? {...section.content,groups:[]} : section.content;
  return contentDestinations(content);
}
export function actionIssues(site: SiteDefinition): { pageId?: string; sectionId?: string; message: string }[] {
  const result: { pageId?: string; sectionId?: string; message: string }[] = [];
  for (const page of site.pages) for (const section of effectiveSections(site, page)) for (const binding of section.actions ?? []) {
    const issue = typeof valueAtPath(section, binding.path) !== "string" ? `Action field no longer exists: ${binding.path.join(".")}` : resolveAction(site, binding.action).issue;
    if (issue) result.push({ pageId: page.id, sectionId: section.id, message: issue });
  }
  for (const page of site.pages) for (const section of effectiveSections(site, page)) {
    for(const destination of sectionContentDestinations(section)) { const issue=resolveAction(site,destination).issue; if(issue)result.push({pageId:page.id,sectionId:section.id,message:issue}); }
    for (const slot of contextualSlots(section.contextualActions)) if (slot.enabled) {
      const issue = resolveAction(site, slot.action).issue;
      if (issue) result.push({ pageId: page.id, sectionId: section.id, message: issue });
    }
    for (const item of section.contextualActions?.items ?? []) {
      const group = getActionCapabilities(section.component).items.find(group => group.group === item.group);
      if (!group || !actionItems(section, group).some(record => record.id === item.itemId)) result.push({ pageId: page.id, sectionId: section.id, message: `Missing action item: ${item.group} / ${item.itemId}` });
    }
  }
  if (site.navigation.action) {
    const issue = resolveAction(site, site.navigation.action.action).issue;
    if (issue) result.push({ message: issue });
  }
  return result;
}
export function materializeActions(site: SiteDefinition, section: SectionInstance): SectionInstance {
  const copy = structuredClone(section);
  for(const destination of sectionContentDestinations(copy)) {const issue=resolveAction(site,destination).issue;if(issue)throw new Error(issue);}
  for (const slot of contextualSlots(copy.contextualActions)) if (slot.enabled) {
    const resolved = resolveAction(site, slot.action);
    if (resolved.issue) throw new Error(resolved.issue);
  }
  for (const item of copy.contextualActions?.items ?? []) {
    const group = getActionCapabilities(copy.component).items.find(group => group.group === item.group);
    if (!group || !actionItems(copy, group).some(record => record.id === item.itemId)) throw new Error(`Missing action item: ${item.group} / ${item.itemId}`);
  }
  for (const binding of copy.actions ?? []) {
    const resolved = resolveAction(site, binding.action);
    if (resolved.issue) throw new Error(resolved.issue);
    if (typeof valueAtPath(copy, binding.path) !== "string") throw new Error(`Missing action field: ${binding.path.join(".")}`);
    const parent = valueAtPath(copy, binding.path.slice(0, -1)) as Record<string | number, unknown>;
    parent[binding.path.at(-1)!] = resolved.href;
  }
  return copy;
}
