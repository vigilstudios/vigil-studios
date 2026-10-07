import { materializeFooter, footerNavigationIssues } from "./footer";
import { getSectionContract } from "../composition/catalog";
import { parseSection, type PageComposition, type SectionInstance } from "../composition/schemas";
import { architectureFor, navigationHierarchyDepth, navigationIds, type ExpansionNavigationId } from "../navigation/capabilities";
import type { NavigationDestination } from "../navigation/schemas";
import type { Action, NavigationSource } from "./action-schema";
import { materializeActions, resolveAction } from "./actions";
import { pageComposition, type SiteDefinition } from "./model";
import { resolveRoutes, siblings } from "./routes";
export type SiteDestination = NavigationDestination & { pageId: string; action: Action; children?: SiteDestination[] };
export function deriveNavigation(site: SiteDefinition, source: NavigationSource = { mode: "site", depth: "all" }): SiteDestination[] {
  const routes = resolveRoutes(site);
  function branch(parentId: string | null): SiteDestination[] {
    return siblings(site, parentId).filter(page => page.showInNavigation && (site.navigation.includeDrafts || page.status === "published")).map(page => {
      const children = branch(page.id);
      return { pageId: page.id, label: page.navLabel ?? page.title, action: { type: "page" as const, pageId: page.id }, href: routes.get(page.id)!, ...(children.length ? { children } : {}) };
    });
  }
  let tree = branch(null);
  if (source.pageIds) {
    const all = new Map<string, SiteDestination>();
    const collect = (items: SiteDestination[]) => items.forEach(item => { all.set(item.pageId, item); if (item.children) collect(item.children); }); collect(tree);
    tree = source.pageIds.flatMap(id => all.has(id) ? [all.get(id)!] : []);
  }
  return source.depth === "top-level" ? tree.map(item => ({ pageId: item.pageId, label: item.label, action: item.action, href: item.href })) : tree;
}
export function navigationLimits(component: SectionInstance["component"]): { maxDepth: number | null; min: number; max: number } {
  if (navigationIds.includes(component as ExpansionNavigationId)) {
    const architecture = architectureFor(component as ExpansionNavigationId);
    return { maxDepth: navigationHierarchyDepth(architecture), min: architecture.destinations[0], max: architecture.destinations[1] };
  }
  return { maxDepth: 1, min: 2, max: component === "navigation.island" ? 4 : 7 };
}
export function navigationIssues(site: SiteDefinition, section: SectionInstance): string[] {
  if (!section.navigationSource) return [];
  if(section.component.startsWith("footer.")) return footerNavigationIssues(site,section);
  const links = deriveNavigation(site, section.navigationSource), limit = navigationLimits(section.component), result: string[] = [];
  if (links.length < limit.min || links.length > limit.max) result.push(`${section.component} supports ${limit.min}–${limit.max} top-level destinations; this selection has ${links.length}. Choose an explicit page selection or another Navigation.`);
  if (section.navigationSource.pageIds?.some(id => !site.pages.some(page => page.id === id))) result.push("Navigation selection references a missing page.");
  if (section.navigationSource.pageIds && new Set(section.navigationSource.pageIds).size !== section.navigationSource.pageIds.length) result.push("Navigation page selection contains duplicates.");
  function check(items: SiteDestination[], depth: number) {
    if (limit.maxDepth !== null && depth > limit.maxDepth) result.push(`${section.component} supports ${limit.maxDepth} navigation level(s); the site has level ${depth}. Choose top-level destinations explicitly or a deeper Navigation.`);
    if (new Set(items.map(item => item.label)).size !== items.length) result.push("Sibling navigation labels must be unique for this Navigation. Edit custom labels.");
    if (items.some(item => item.label.length > 80)) result.push("Navigation labels support at most 80 characters. Set a shorter custom Navigation label.");
    for (const item of items) if (item.children) {
      if (item.children.length > 6) result.push(`${item.label} exceeds the supported six children per group.`);
      check(item.children, depth + 1);
    }
  }
  check(links, 1); return [...new Set(result)];
}
export function materializeNavigation(site: SiteDefinition, section: SectionInstance): SectionInstance {
  if (!section.navigationSource) return section;
  if(section.component.startsWith("footer.")) return materializeFooter(site,section);
  if (getSectionContract(section.component).category !== "navigation") throw new Error("Only Navigation can derive the site tree.");
  const issues = navigationIssues(site, section); if (issues.length) throw new Error(issues.join(" "));
  const strip = (items: SiteDestination[]): NavigationDestination[] => items.map(item => ({ label: item.label, href: item.href, ...(item.children ? { children: strip(item.children) } : {}) }));
  const homeAction = section.actions?.find(binding => binding.path.length === 2 && binding.path[1] === "home")?.action;
  const home = homeAction ? resolveAction(site, homeAction) : { href: resolveRoutes(site).get(site.navigation.homePageId) };
  if (home.issue) throw new Error(home.issue);
  const navigationAction = site.navigation.action ? resolveAction(site, site.navigation.action.action) : undefined;
  if (navigationAction?.issue) throw new Error(navigationAction.issue);
  return parseSection({ ...section, content: { ...section.content, home: home.href, links: strip(deriveNavigation(site, section.navigationSource)), ...(site.navigation.action ? { action: { label: site.navigation.action.label, href: navigationAction!.href } } : {}) } });
}
export function materializeComposition(site: SiteDefinition, composition: PageComposition): PageComposition {
  return { ...composition, sections: composition.sections.map(section => materializeNavigation(site, materializeActions(site, section))) };
}
export function resolvePageComposition(site: SiteDefinition, pageId: string): PageComposition { return materializeComposition(site, pageComposition(site, pageId)); }
