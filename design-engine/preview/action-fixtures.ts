import { adaptSectionToPageLayers } from "./composition/addition";
import { pageComposition } from "../site/model";
import { actionItems, getActionCapabilities } from "../actions/capabilities";
import type { ActionPresentation, ContextualActions } from "../actions/schema";
import { makeSection } from "./composition/fixtures";
import { makeComplexSiteFixture } from "./composition/site-fixture";
import { parseSection, type SectionId, type SectionInstance } from "../composition/schemas";
import type { SiteDefinition } from "../site/model";
/** Separate QA variants preserve every authored legacy composition and creative reference. */
export function makeActionSection(component: SectionId, presentation: ActionPresentation = {}): SectionInstance {
  const section = makeSection(component, "action-subject"), capability = getActionCapabilities(component);
  const slot = (label: string, pageId: string) => ({ enabled: true as const, label, action: { type: "page" as const, pageId } });
  const contextualActions: ContextualActions = {};
  if (capability.primary) contextualActions.primary = { ...slot("Start a project with our team", "page-contact"), presentation };
  if (capability.secondary) contextualActions.secondary = { ...slot("Explore selected work", "page-work"), presentation: { variant: "underline", icon: "arrow-up-right", iconPosition: "trailing" } };
  contextualActions.items = capability.items.flatMap(group => actionItems(section, group).map((record, index) => ({ group: group.group, itemId: record.id, display: "link" as const, slot: { ...slot(`Explore ${record.label}`, component.startsWith("services.") ? ["page-web-design", "page-seo", "page-automation"][index % 3] : component.startsWith("commerce.") ? ["page-product-alpha", "page-product-beta"][index % 2] : ["page-project-alpha", "page-project-beta"][index % 2]), presentation: { variant: "underline" as const, icon: "arrow-up-right" as const } } })));
  return parseSection({ ...section, contextualActions });
}
export function makeConnectedActionFixture(): SiteDefinition {
  const site = makeComplexSiteFixture(); site.title = "Connected production journeys QA";
  const home = site.pages.find(page => page.id === "page-home")!;
  const hero = home.sections[0];
  hero.contextualActions = { primary: {enabled:true,label:"Start project",action:{type:"page",pageId:"page-contact"},presentation:{variant:"outline",icon:"arrow-up-right"}}, secondary: {enabled:true,label:"View work",action:{type:"page",pageId:"page-work"},presentation:{variant:"text"}} };
  const add = (component: SectionId, id: string) => parseSection({...makeActionSection(component),id});
  home.sections.push(add("services.offering-index","connected-services"),add("work.gallery-hanging","connected-work"),add("proof.outcome-equation","connected-result"));
  home.sections.at(-1)!.contextualActions = {primary:{enabled:true,label:"Read case study",action:{type:"page",pageId:"page-project-beta"},presentation:{variant:"underline"}}};
  home.sections = home.sections.map(section => adaptSectionToPageLayers(pageComposition(site,home.id),section));
  return site;
}
