import { makeBlankComposition, makeSection } from "./fixtures";
import { adaptSectionToPageLayers } from "./addition";
import { siteFromComposition, pageComposition, type SiteDefinition } from "../../site/model";
import { hrefFields } from "../../site/actions";
import { parseSiteDefinition } from "../../site/persistence";
import type { SectionId } from "../../composition/schemas";
/** Realistic manual QA data, not a recipe or customer sitemap generator. */
export function makeComplexSiteFixture(): SiteDefinition {
  const site = siteFromComposition(makeBlankComposition()); site.id = "site-complex-qa"; site.title = "Page architecture QA";
  const rows: [string, string, string, string | null, import("../../registry/types").PageType, SectionId[]][] = [
    ["home", "Home", "/", null, "home", ["hero.front-page", "story.open-letter", "proof.margin-voice"]],
    ["about", "About", "about", null, "about", ["hero.between-acts", "story.material-relay"]],
    ["services", "Services", "services", null, "services-index", ["hero.statement", "services.offering-index"]],
    ["web-design", "Web Design", "web-design", "services", "service-detail", ["hero.statement", "services.capability-desk", "work.light-table"]],
    ["seo", "SEO", "seo", "services", "service-detail", ["hero.open-circuit", "services.expandable-offerings"]],
    ["automation", "Automation", "automation", "services", "service-detail", ["hero.assembly", "services.connected-capabilities"]],
    ["work", "Work", "work", null, "portfolio-index", ["hero.front-page", "work.project-chapters"]],
    ["project-alpha", "Project Alpha", "project-alpha", "work", "project-detail", ["hero.comparison", "work.light-table", "proof.change-dossier"]],
    ["project-beta", "Project Beta", "project-beta", "work", "project-detail", ["hero.object-study", "work.viewport-gallery"]],
    ["shop", "Shop", "shop", null, "shop", ["hero.assembly", "commerce.merchant-edit"]],
    ["apparel", "Apparel", "apparel", "shop", "collection", ["hero.between-acts", "commerce.catalog-ledger"]],
    ["product-alpha", "Product Alpha", "product-alpha", "apparel", "product-detail", ["hero.object-study", "commerce.material-anatomy"]],
    ["product-beta", "Product Beta", "product-beta", "apparel", "product-detail", ["hero.object-study", "commerce.origin-receipt"]],
    ["accessories", "Accessories", "accessories", "shop", "collection", ["hero.statement", "commerce.collection-atlas"]],
    ["contact", "Contact", "contact", null, "contact", ["hero.statement", "proof.in-conversation"]],
  ];
  site.pages = rows.map(([id, title, slug, parentId, pageType, components], order) => ({ id: `page-${id}`, title, slug, parentId: parentId ? `page-${parentId}` : null, order, pageType, showInNavigation: true, status: "draft", seo: {}, slots: { navigation: { mode: "inherit" }, footer: { mode: "inherit" } }, previousRoutes: [], sections: components.map((component, index) => makeSection(component, `section-${id}-${index}`)) }));
  site.navigation.homePageId = "page-home";
  site.globals.navigation = { ...makeSection("navigation.channel-directory", "global-navigation"), navigationSource: { mode: "site", depth: "all" } };
  for (const page of site.pages) page.sections = page.sections.map(section => adaptSectionToPageLayers(pageComposition(site, page.id), section));
  for (const page of site.pages) for (const section of page.sections) {
    const fields = hrefFields(section);
    if (fields.length) section.actions = fields.map((field, index) => ({
      path: field.path,
      action: { type: "page", pageId: section.component.startsWith("services.") ? ["page-web-design", "page-seo", "page-automation"][index % 3] : section.component.startsWith("commerce.") ? ["page-product-alpha", "page-product-beta"][index % 2] : "page-contact" },
    }));
  }
  site.pages.find(page => page.id === "page-web-design")!.sections[0].actions = [{ path: ["content", "action", "href"], action: { type: "section", pageId: "page-services", sectionId: "section-services-1" } }];
  site.navigation.action = { label: "Contact", action: { type: "page", pageId: "page-contact" } };
  return parseSiteDefinition(site);
}
