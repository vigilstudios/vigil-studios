import { parseSection, type SectionInstance } from "../../composition/schemas";
import type { NavigationDestination } from "../../navigation/schemas";
import type { Action, ActionBinding } from "../../site/action-schema";
import { materializeActions, resolveAction } from "../../site/actions";
import type { SiteDefinition } from "../../site/model";
import { deriveNavigation, navigationIssues, navigationLimits } from "../../site/navigation";
import { resolveRoutes } from "../../site/routes";

export type NavigationLinkDraft = { label: string; href: string; action?: Action; children?: NavigationLinkDraft[] };
export type NavigationContent = { home: string; links: NavigationDestination[]; action?: { label: string; href: string }; utilities?: { kind: string; label: string; href: string }[] };
export const navigationContent = (section: SectionInstance) => section.content as unknown as NavigationContent;

export function destinationAction(site: SiteDefinition, href: string): Action | undefined {
  const [route, sectionId] = href.split("#");
  const target = [...resolveRoutes(site)].find(([, value]) => value === route);
  if (!target) return undefined;
  const action: Action = sectionId ? { type: "section", pageId: target[0], sectionId } : { type: "page", pageId: target[0] };
  return resolveAction(site, action).issue ? undefined : action;
}

export function navigationLinkDrafts(site: SiteDefinition, section: SectionInstance): NavigationLinkDraft[] {
  if (section.navigationSource) return deriveNavigation(site, section.navigationSource).map(function copy(item): NavigationLinkDraft {
    return { label: item.label, href: item.href, action: item.action, ...(item.children ? { children: item.children.map(copy) } : {}) };
  });
  function copy(items: NavigationDestination[], parent: ActionBinding["path"]): NavigationLinkDraft[] {
    return items.map((item, index) => {
      const path = [...parent, index];
      const action = section.actions?.find(binding => JSON.stringify(binding.path) === JSON.stringify([...path, "href"]))?.action ?? destinationAction(site, item.href);
      return { label: item.label, href: item.href, ...(action ? { action } : {}), ...(item.children ? { children: copy(item.children, [...path, "children"]) } : {}) };
    });
  }
  return copy(navigationContent(section).links, ["content", "links"]);
}

export function resolvedDraftHref(site: SiteDefinition, draft: NavigationLinkDraft): string {
  if (!draft.action) {
    if (!draft.href) throw new Error(`Choose a destination for ${draft.label || "this menu item"}.`);
    return draft.href;
  }
  const resolved = resolveAction(site, draft.action);
  if (resolved.issue || !resolved.href) throw new Error(resolved.issue ?? "Choose a destination.");
  return resolved.href;
}

/** Rebuild array-index bindings with the edited tree; route strings are only renderer compatibility data. */
export function applyNavigationLinks(site: SiteDefinition, section: SectionInstance, drafts: NavigationLinkDraft[]): SectionInstance {
  const limits = navigationLimits(section.component);
  if (drafts.length < limits.min || drafts.length > limits.max) throw new Error(`This navbar needs ${limits.min}–${limits.max} main menu items.`);
  const actions = (section.actions ?? []).filter(binding => binding.path[1] !== "links");
  function links(items: NavigationLinkDraft[], parent: ActionBinding["path"], depth = 1): NavigationDestination[] {
    if (limits.maxDepth !== null && depth > limits.maxDepth) throw new Error(`This navbar supports ${limits.maxDepth} menu level(s). Remove a submenu or choose a navbar with deeper menus.`);
    if (depth > 1 && items.length > 6) throw new Error("A submenu supports up to six items.");
    if (new Set(items.map(item => item.label.trim())).size !== items.length) throw new Error("Menu items in the same group need different labels.");
    return items.map((draft, index) => {
      const path = [...parent, index];
      if (draft.action) actions.push({ path: [...path, "href"], action: draft.action });
      return { label: draft.label.trim(), href: resolvedDraftHref(site, draft), ...(draft.children?.length ? { children: links(draft.children, [...path, "children"], depth + 1) } : {}) };
    });
  }
  const content = { ...section.content, links: links(drafts, ["content", "links"]) };
  // When leaving automatic menus, retain the currently visible shared CTA as a stable section action.
  if (section.navigationSource && site.navigation.action) {
    const shared = site.navigation.action;
    Object.assign(content, { action: { label: shared.label, href: resolvedDraftHref(site, { label: shared.label, href: "", action: shared.action }) } });
    const index = actions.findIndex(binding => JSON.stringify(binding.path) === JSON.stringify(["content", "action", "href"]));
    if (index >= 0) actions.splice(index, 1);
    actions.push({ path: ["content", "action", "href"], action: shared.action });
  }
  const next = parseSection({ ...section, content, actions, navigationSource: undefined });
  parseSection(materializeActions(site, next));
  return next;
}

export function applyNavigationButton(site: SiteDefinition, section: SectionInstance, path: ActionBinding["path"], draft: NavigationLinkDraft): SectionInstance {
  const next = structuredClone(section), parentPath = path.slice(0, -1);
  let parent: unknown = next;
  for (const key of parentPath) parent = (parent as Record<string | number, unknown>)[key];
  if (!parent || typeof parent !== "object") throw new Error("This navbar button no longer exists.");
  if (path.length === 2 && path[1] === "home") Object.assign(parent, { home: resolvedDraftHref(site, draft) });
  else Object.assign(parent, { label: draft.label.trim(), href: resolvedDraftHref(site, draft) });
  next.actions = (next.actions ?? []).filter(binding => JSON.stringify(binding.path) !== JSON.stringify(path));
  if (draft.action) next.actions.push({ path, action: draft.action });
  const parsed = parseSection(next); parseSection(materializeActions(site, parsed)); return parsed;
}

export function restoreSiteTreeNavigation(site: SiteDefinition, section: SectionInstance, depth: "all" | "top-level"): SectionInstance {
  const next = parseSection({ ...section, actions: section.actions?.filter(binding => binding.path[1] !== "links" && !(site.navigation.action && binding.path[1] === "action")), navigationSource: { mode: "site", depth } });
  const issues = navigationIssues(site, next);
  if (issues.length) throw new Error(issues.join(" "));
  return next;
}
