import { sectionContentDestinations } from "./actions";
import { contextualSlots } from "../actions/schema";
import { getSectionContract } from "../composition/catalog";
import type { PageComposition, SectionInstance } from "../composition/schemas";
import { effectiveSections, type SiteDefinition, type SitePage } from "./model";
import { parseSiteDefinition } from "./persistence";
import { descendantIds, normalizeRoute, normalizeSlug, resolveRoutes, siblings } from "./routes";
export function stableId(prefix: string): string { return `${prefix}-${crypto.randomUUID()}`; }
function nextSiblingOrder(site: SiteDefinition, parentId: string | null, excludeId?: string): number {
  return Math.max(-1, ...siblings(site, parentId).filter(page => page.id !== excludeId).map(page => page.order)) + 1;
}
function recordRoutes(before: SiteDefinition, after: SiteDefinition): SiteDefinition {
  const old = resolveRoutes(before), next = resolveRoutes(after);
  return parseSiteDefinition({ ...after, pages: after.pages.map(page => ({ ...page, previousRoutes: old.has(page.id) && old.get(page.id) !== next.get(page.id) ? [...new Set([...page.previousRoutes, old.get(page.id)!])] : page.previousRoutes })) });
}
export function updatePage(site: SiteDefinition, pageId: string, patch: Partial<Omit<SitePage, "id">>): SiteDefinition {
  if (!site.pages.some(page => page.id === pageId)) throw new Error("Page does not exist.");
  const next = structuredClone(site), page = next.pages.find(page => page.id === pageId)!;
  const parentChanged = Object.hasOwn(patch, "parentId") && patch.parentId !== page.parentId;
  Object.assign(page, patch);
  if (patch.slug !== undefined) page.slug = normalizeSlug(patch.slug);
  if (patch.routeOverride !== undefined) page.routeOverride = patch.routeOverride.trim() ? normalizeRoute(patch.routeOverride) : undefined;
  if (parentChanged) page.order = nextSiblingOrder(next, page.parentId, page.id);
  return recordRoutes(site, next);
}
export function movePage(site: SiteDefinition, pageId: string, direction: -1 | 1): SiteDefinition {
  const next = structuredClone(site), page = next.pages.find(page => page.id === pageId);
  if (!page) throw new Error("Page does not exist.");
  const group = siblings(next, page.parentId), index = group.findIndex(page => page.id === pageId), target = index + direction;
  if (target < 0 || target >= group.length) return site;
  [group[index], group[target]] = [group[target], group[index]];
  group.forEach((page, order) => { page.order = order; }); return parseSiteDefinition(next);
}
function uniqueSlug(site: SiteDefinition, parentId: string | null, base: string): string {
  base = base.slice(0, 170).replace(/[-/]+$/, "");
  const routes = resolveRoutes(site), existing = new Set(routes.values());
  const parentRoute = parentId ? routes.get(parentId) : "";
  for (let index = 1; index <= site.pages.length + 2; index++) {
    const slug = `${base}${index === 1 ? "" : `-${index}`}`;
    const route = `${parentRoute === "/" ? "" : parentRoute}/${slug}`;
    if (!existing.has(route)) return slug;
  }
  throw new Error("No unique route available.");
}
export function addPage(site: SiteDefinition, title = "New page", parentId: string | null = null): { site: SiteDefinition; pageId: string } {
  if (parentId && !site.pages.some(page => page.id === parentId)) throw new Error("Parent does not exist.");
  const id = stableId("page");
  const page: SitePage = { id, title, slug: uniqueSlug(site, parentId, normalizeSlug(title)), parentId, order: nextSiblingOrder(site, parentId), pageType: "standard", showInNavigation: true, status: "draft", sections: [], seo: {}, slots: { navigation: { mode: "inherit" }, footer: { mode: "inherit" } }, previousRoutes: [] };
  return { site: parseSiteDefinition({ ...site, pages: [...site.pages, page] }), pageId: id };
}
export function duplicatePage(site: SiteDefinition, pageId: string): { site: SiteDefinition; pageId: string } {
  const original = site.pages.find(page => page.id === pageId);
  if (!original) throw new Error("Page does not exist.");
  const copy = structuredClone(original), id = stableId("page");
  copy.id = id; copy.title = `${original.title.slice(0, 175)} copy`; copy.navLabel = original.navLabel ? `${original.navLabel.slice(0, 75)} copy` : undefined; copy.status = "draft"; copy.slug = uniqueSlug(site, copy.parentId, `${original.slug === "/" ? "home" : original.slug}-copy`); copy.routeOverride = undefined; copy.order = nextSiblingOrder(site, copy.parentId); copy.previousRoutes = [];
  const sections = [...copy.sections, ...Object.values(copy.slots).flatMap(slot => slot.mode === "replace" ? [slot.section] : [])];
  const sectionIds = new Map(sections.map(section => [section.id, stableId("section")]));
  for (const section of sections) {
    section.id = sectionIds.get(section.id)!;
    for (const binding of [...sectionContentDestinations(section).map(action=>({action})), ...(section.actions ?? []), ...contextualSlots(section.contextualActions).flatMap(slot => slot.action ? [{action:slot.action}] : [])]) if ((binding.action.type === "page" || binding.action.type === "section") && binding.action.pageId === pageId) {
      binding.action.pageId = id;
      if (binding.action.type === "section") binding.action.sectionId = sectionIds.get(binding.action.sectionId) ?? binding.action.sectionId;
    }
  }
  return { site: parseSiteDefinition({ ...site, pages: [...site.pages, copy] }), pageId: id };
}
export function deletionImpact(site: SiteDefinition, pageId: string, strategy: "subtree" | "reparent") {
  const removed = new Set([pageId, ...(strategy === "subtree" ? descendantIds(site, pageId) : [])]);
  const incoming = site.pages.filter(page => !removed.has(page.id)).flatMap(page => effectiveSections(site, page).flatMap(section => [...sectionContentDestinations(section).map(action=>({action})), ...(section.actions ?? []), ...contextualSlots(section.contextualActions).flatMap(slot => slot.action ? [{action:slot.action}] : [])].filter(binding => "pageId" in binding.action && removed.has(binding.action.pageId)).map(() => `${page.title} / ${section.id}`)));
  if (site.navigation.action && "pageId" in site.navigation.action.action && removed.has(site.navigation.action.action.pageId)) incoming.push("Site Navigation action");
  return { removed, incoming, children: descendantIds(site, pageId).size };
}
export function deletePage(site: SiteDefinition, pageId: string, strategy: "subtree" | "reparent"): SiteDefinition {
  const page = site.pages.find(page => page.id === pageId);
  if (!page) throw new Error("Page does not exist.");
  const { removed } = deletionImpact(site, pageId, strategy);
  if (removed.has(site.navigation.homePageId)) throw new Error("Choose a different site home page before deleting it.");
  const next = structuredClone(site);
  next.pages = next.pages.filter(page => !removed.has(page.id));
  const existing = nextSiblingOrder(next, page.parentId);
  let order = existing;
  for (const child of siblings(next, pageId)) { child.parentId = page.parentId; child.order = order++; }
  // Missing explicit navigation references are removed; incoming actions remain visible diagnostics.
  const clean = (section: SectionInstance) => { if (section.navigationSource?.pageIds) section.navigationSource.pageIds = section.navigationSource.pageIds.filter(id => !removed.has(id)); };
  Object.values(next.globals).forEach(clean); next.pages.forEach(page => effectiveSections(next, page).forEach(clean));
  return recordRoutes(site, next);
}
/** Update the old renderer projection back into the single canonical document. */
export function applyPageComposition(site: SiteDefinition, pageId: string, composition: PageComposition): SiteDefinition {
  const next = structuredClone(site), page = next.pages.find(page => page.id === pageId);
  if (!page) throw new Error("Page does not exist.");
  next.settings = structuredClone(composition.site); page.overrides = structuredClone(composition.overrides); page.title = composition.label;
  for (const name of ["navigation", "footer"] as const) {
    const instance = composition.sections.find(section => getSectionContract(section.component).category === name);
    if (!instance) { if (effectiveSections(site, site.pages.find(page => page.id === pageId)!).some(section => getSectionContract(section.component).category === name)) page.slots[name] = { mode: "omit" }; }
    else if (page.slots[name].mode === "inherit" && next.globals[name]?.id === instance.id) next.globals[name] = structuredClone(instance);
    else page.slots[name] = { mode: "replace", section: structuredClone(instance) };
  }
  page.sections = structuredClone(composition.sections.filter(section => !["navigation", "footer"].includes(getSectionContract(section.component).category)));
  return parseSiteDefinition(next);
}
