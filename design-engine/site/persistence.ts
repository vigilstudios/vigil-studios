import { getSectionContract } from "../composition/catalog";
import { effectiveSections, siteDefinitionSchema, type SiteDefinition } from "./model";
import { resolveRoutes } from "./routes";
export const siteDraftKey = "vigil-design-engine:site:v1";
export function parseSiteDefinition(input: unknown): SiteDefinition {
  const site = siteDefinitionSchema.parse(input);
  resolveRoutes(site);
  if (!site.pages.some(page => page.id === site.navigation.homePageId)) throw new Error("Navigation home page must exist.");
  const globalIds = Object.values(site.globals).map(section => section.id);
  if (new Set(globalIds).size !== globalIds.length) throw new Error("Global section IDs must be unique.");
  for (const name of ["navigation", "footer"] as const) if (site.globals[name] && getSectionContract(site.globals[name].component).category !== name) throw new Error(`Global ${name} must use a ${name} component.`);
  for (const page of site.pages) {
    for (const name of ["navigation", "footer"] as const) if (page.slots[name].mode === "replace" && getSectionContract(page.slots[name].section.component).category !== name) throw new Error(`Page ${name} replacement must use a ${name} component.`);
    if (page.sections.some(section => ["navigation", "footer"].includes(getSectionContract(section.component).category))) throw new Error("Persistent sections belong in explicit page slots.");
    const sections = effectiveSections(site, page);
    if (new Set([page.id, ...sections.map(section => section.id)]).size !== sections.length + 1) throw new Error(`Section IDs on ${page.title} must be unique, including inherited slots.`);
    if (sections.length > 20) throw new Error("A page supports up to 20 effective sections.");
  }
  return site;
}
export function serializeSite(site: SiteDefinition): string { return JSON.stringify(parseSiteDefinition(site), null, 2); }
export function deserializeSite(json: string): SiteDefinition { return parseSiteDefinition(JSON.parse(json)); }
