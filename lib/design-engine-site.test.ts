import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import { makeBlankComposition, makeSection, compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { effectiveSections, pageComposition, siteFromComposition } from "@/design-engine/site/model";
import { addPage, applyPageComposition, deletePage, deletionImpact, duplicatePage, movePage, updatePage } from "@/design-engine/site/operations";
import { deserializeSite, parseSiteDefinition, serializeSite } from "@/design-engine/site/persistence";
import { descendantIds, normalizeSlug, resolveRoutes, siblings } from "@/design-engine/site/routes";
import { actionIssues, materializeActions, resolveAction } from "@/design-engine/site/actions";
import { actionSchema } from "@/design-engine/site/action-schema";
import { deriveNavigation, materializeNavigation, navigationIssues, resolvePageComposition } from "@/design-engine/site/navigation";
import { SitePagePreview } from "@/design-engine/site/render";
import { navigationIds } from "@/design-engine/navigation/capabilities";
import { inspectComposition } from "@/design-engine/composition/validation";
import { parseSection } from "@/design-engine/composition/schemas";
import { validateDesignRegistry } from "@/design-engine/registry/validation";
import { designComponents } from "@/design-engine/registry/components";
import { pageTypes } from "@/design-engine/registry/types";

const fixture = makeComplexSiteFixture;
describe("Page & Site Architecture Foundation", () => {
 it("round-trips the portable complex document, with no transient editor state", () => {
  const site = fixture(); expect(site.pages).toHaveLength(15);
  expect(deserializeSite(serializeSite(site))).toEqual(site);
  expect(resolveRoutes(site).get("page-product-alpha")).toBe("/shop/apparel/product-alpha");
  expect(resolveRoutes(site).get("page-home")).toBe("/");
  for (const page of site.pages) { expect(inspectComposition(resolvePageComposition(site, page.id)).issues).toEqual([]); expect(renderToStaticMarkup(createElement(SitePagePreview, { site, pageId: page.id }))).toContain("de-composition"); }
 });
 it("preserves all legacy QA compositions through migration", () => {
  for (const original of compositionFixtures) {
   const site = siteFromComposition(original); expect(inspectComposition(pageComposition(site, "page-home")).issues).toEqual([]);
   expect(pageComposition(site, "page-home").sections).toEqual(original.sections);
  }
 });
 it("supports new semantic types while retaining existing registry vocabulary", () => { expect(pageTypes).toEqual(expect.arrayContaining(["home", "standard", "services-index", "service-detail", "portfolio-index", "project-detail", "product-detail", "blog-index", "article", "custom", "portfolio", "services"])); });
 it.each([[" Web Désign! ", "web-design"], ["/Services//Web Design/", "services/web-design"], ["/", "/"], ["Café & Work", "cafe-work"]])("normalizes %s to %s", (value, result) => expect(normalizeSlug(value)).toBe(result));
 it.each(["", "???", "foo/???", ".."])('rejects empty/unusable slug %s', value => expect(() => normalizeSlug(value)).toThrow());
 it("rejects self-parent, ancestor cycles, missing parents and root nesting atomically", () => {
  const site = fixture(), before = serializeSite(site);
  for (const [id, parentId] of [["page-services", "page-services"], ["page-services", "page-web-design"], ["page-about", "missing"], ["page-home", "page-services"]]) expect(() => updatePage(site, id, { parentId })).toThrow();
  expect(serializeSite(site)).toBe(before);
 });
 it("rejects duplicate routes across siblings, absolute overrides and descendant moves", () => {
  const site = fixture();
  expect(() => updatePage(site, "page-about", { slug: "contact" })).toThrow(/Duplicate route/);
  expect(() => updatePage(site, "page-about", { routeOverride: "/shop/apparel/product-alpha" })).toThrow(/Duplicate route/);
  const reserved = updatePage(site, "page-about", { routeOverride: "/apparel/product-alpha" });
  expect(() => updatePage(reserved, "page-apparel", { parentId: null })).toThrow(/Duplicate route/);
 });
 it("moves a subtree, resolves descendant routes and records previous paths", () => {
  const next = updatePage(fixture(), "page-apparel", { parentId: "page-services" });
  expect(resolveRoutes(next).get("page-product-beta")).toBe("/services/apparel/product-beta");
  expect(next.pages.find(page => page.id === "page-product-beta")?.previousRoutes).toContain("/shop/apparel/product-beta");
  const detached = updatePage(next, "page-apparel", { parentId: null }); expect(resolveRoutes(detached).get("page-product-beta")).toBe("/apparel/product-beta");
 });
 it("supports explicit route overrides and clearing them", () => {
  const site = updatePage(fixture(), "page-apparel", { routeOverride: "/new-store/clothing" });
  expect(resolveRoutes(site).get("page-product-alpha")).toBe("/new-store/clothing/product-alpha");
  expect(resolveRoutes(updatePage(site, "page-apparel", { routeOverride: "" })).get("page-product-alpha")).toBe("/shop/apparel/product-alpha");
 });
 it("preserves typed page and section actions through slug/parent changes", () => {
  const site = fixture(), target = "page-contact";
  const changed = updatePage(site, target, { slug: "book-a-call", parentId: "page-services" });
  expect(resolveAction(changed, { type: "page", pageId: target }).href).toBe("/services/book-a-call");
  expect(resolveAction(changed, { type: "section", pageId: target, sectionId: "section-contact-0" }).href).toBe("/services/book-a-call#section-contact-0");
  expect(resolvePageComposition(changed, "page-home").sections[1].content).toHaveProperty("action.href", "/services/book-a-call");
  expect(actionIssues(changed)).toEqual([]);
 });
 it.each(["external", "email", "phone", "download"] as const)("resolves %s actions centrally", type => {
  const action = type === "external" ? { type, url: "https://example.com/path" } : type === "email" ? { type, email: "hello@example.com" } : type === "phone" ? { type, phone: "+1 (555) 123-4567" } : { type, url: "/files/guide.pdf", filename: "guide.pdf" };
  expect(resolveAction(fixture(), action).issue).toBeUndefined();
  if (type === "download") expect(resolveAction(fixture(), action).download).toBe("guide.pdf");
 });
 it.each(["javascript:alert(1)", "https://example.com/\\evil", "https://example.com/ bad", "//example.com"])("rejects unsafe external action %s", url => expect(actionSchema.safeParse({ type: "external", url }).success).toBe(false));
 it("detects deleted pages and sections instead of falling back to stale hrefs", () => {
  const removed = deletePage(fixture(), "page-contact", "subtree");
  expect(actionIssues(removed).length).toBeGreaterThan(0); expect(() => resolvePageComposition(removed, "page-home")).toThrow();
  expect(resolveAction(fixture(), { type: "section", pageId: "page-contact", sectionId: "missing" }).issue).toMatch(/Missing section/);
 });
 it("detects disappeared content fields and prevents duplicate/prototype bindings", () => {
  const site = fixture(); site.pages[0].sections[0].actions![0].path = ["content", "missing", "href"];
  expect(actionIssues(site)[0].message).toMatch(/no longer exists/);
  expect(() => materializeActions(site, site.pages[0].sections[0])).toThrow(/Missing action field/);
  const section = fixture().pages[0].sections[0];
  expect(() => parseSection({ ...section, actions: [section.actions![0], section.actions![0]] })).toThrow(/unique/);
  expect(() => parseSection({ ...section, actions: [{ path: ["content", "constructor", "href"], action: { type: "page", pageId: "page-home" } }] })).toThrow();
 });
 it("adds pages with unique stable IDs and safe route suffixes", () => {
  const a = addPage(fixture(), "Contact"), b = addPage(a.site, "Contact");
  expect(a.pageId).not.toBe(b.pageId); expect(resolveRoutes(b.site).get(b.pageId)).toBe("/contact-3");
  expect(b.site.pages.find(page => page.id === b.pageId)?.sections).toEqual([]);
 });
 it("appends additions, duplicates and reparented children after sparse sibling orders", () => {
  const site = fixture();
  const moved = updatePage(site, "page-apparel", { parentId: "page-services" });
  expect(siblings(moved, "page-services").at(-1)?.id).toBe("page-apparel");
  const added = addPage(site, "New service", "page-services"); expect(siblings(added.site, "page-services").at(-1)?.id).toBe(added.pageId);
  const copied = duplicatePage(site, "page-web-design"); expect(siblings(copied.site, "page-services").at(-1)?.id).toBe(copied.pageId);
  const removed = deletePage(site, "page-shop", "reparent"); expect(siblings(removed, null).slice(-2).map(page => page.id)).toEqual(["page-apparel", "page-accessories"]);
 });
 it("reorders siblings without crossing their parent", () => {
  const site = movePage(fixture(), "page-seo", -1);
  expect(siblings(site, "page-services").map(page => page.id)).toEqual(["page-seo", "page-web-design", "page-automation"]);
  expect(siblings(site, null).map(page => page.id)).toEqual(siblings(fixture(), null).map(page => page.id));
 });
 it("duplicates mutable page/section data and rewrites self actions without copying children", () => {
  let site = fixture(); const home = site.pages[0]; home.sections[0].actions = [{ path: ["content", "action", "href"], action: { type: "section", pageId: home.id, sectionId: home.sections[0].id } }];
  const result = duplicatePage(site, home.id), copy = result.site.pages.find(page => page.id === result.pageId)!;
  expect(copy.id).not.toBe(home.id); expect(copy.sections[0].id).not.toBe(home.sections[0].id);
  expect(copy.sections[0].actions![0].action).toEqual({ type: "section", pageId: copy.id, sectionId: copy.sections[0].id });
  expect(resolveRoutes(result.site).get(copy.id)).toBe("/home-copy");
  Object.assign(copy.sections[0].content, { title: "Copy only" });
  expect(home.sections[0].content).not.toHaveProperty("title", "Copy only");
  const parentCopy = duplicatePage(site, "page-shop"); expect(descendantIds(parentCopy.site, parentCopy.pageId).size).toBe(0);
  site = updatePage(result.site, copy.id, { title: "Different" }); expect(site.pages[0].title).toBe("Home");
 });
 it("isolates page composition and overrides while sharing site settings intentionally", () => {
  const site = fixture(), page = pageComposition(site, "page-web-design"), other = structuredClone(site.pages.find(page => page.id === "page-seo"));
  const changed = applyPageComposition(site, page.id, { ...page, overrides: { typography: "technical" }, sections: page.sections.filter(section => section.component !== "work.light-table") });
  expect(changed.pages.find(page => page.id === "page-seo")).toEqual(other); expect(site.pages.find(page => page.id === page.id)?.sections).toHaveLength(3);
  const layers = applyPageComposition(changed, page.id, { ...pageComposition(changed, page.id), site: { ...changed.settings, brand: { theme: "technical" } } });
  expect(pageComposition(layers, "page-home").site.brand.theme).toBe("technical");
 });
 it("stores shared Navigation once and supports explicit omit/replace", () => {
  const site = fixture(); expect(site.pages.every(page => page.sections.every(section => !section.component.startsWith("navigation.")))).toBe(true);
  const omitted = updatePage(site, "page-about", { slots: { ...site.pages[1].slots, navigation: { mode: "omit" } } });
  expect(effectiveSections(omitted, omitted.pages[1]).some(section => section.component.startsWith("navigation."))).toBe(false);
  const replaced = updatePage(site, "page-about", { slots: { ...site.pages[1].slots, navigation: { mode: "replace", section: makeSection("navigation.primary", "about-navigation") } } });
  expect(effectiveSections(replaced, replaced.pages[1])[0].id).toBe("about-navigation");
  expect(site.globals.navigation?.id).toBe("global-navigation");
 });
 it("deletes subtrees or reparents children, reports incoming actions, and protects the site home", () => {
  const site = fixture(); expect(() => deletePage(site, "page-home", "subtree")).toThrow(/home page/);
  const removed = deletePage(site, "page-shop", "subtree"); expect(removed.pages).toHaveLength(10);
  const retained = deletePage(site, "page-shop", "reparent"); expect(retained.pages).toHaveLength(14); expect(resolveRoutes(retained).get("page-product-alpha")).toBe("/apparel/product-alpha");
  expect(deletionImpact(site, "page-contact", "subtree").incoming).toContain("Home / section-home-0");
  expect(parseSiteDefinition(retained)).toEqual(retained);
 });
 it("derives labels, visibility, status and ordered nested destinations", () => {
  let site = updatePage(fixture(), "page-services", { navLabel: "What we do" });
  expect(deriveNavigation(site)[2].label).toBe("What we do"); expect(deriveNavigation(site)[4].children?.[0].children).toHaveLength(2);
  site = updatePage(site, "page-shop", { showInNavigation: false }); expect(deriveNavigation(site).some(item => item.pageId === "page-shop")).toBe(false);
  site.navigation.includeDrafts = false; expect(deriveNavigation(site)).toHaveLength(0);
  site = updatePage(site, "page-services", { status: "published" }); expect(deriveNavigation(site).map(item => item.pageId)).toEqual(["page-services"]);
 });
 it("supports arbitrary tree depth without confusing route identity", () => {
  let site = fixture(), parent = "page-product-alpha";
  for (let index = 0; index < 8; index++) { const result = addPage(site, `Deep ${index}`, parent); site = result.site; parent = result.pageId; }
  expect(resolveRoutes(site).get(parent)).toContain("deep-0/deep-1/deep-2/deep-3/deep-4/deep-5/deep-6/deep-7");
  expect(navigationIssues(site, site.globals.navigation!)).toEqual([]); expect(() => resolvePageComposition(site, "page-home")).not.toThrow();
 });
 it.each(navigationIds)("declares explicit site hierarchy/count behavior for %s", component => {
  const site = fixture(), section = { ...makeSection(component, "nav-test"), navigationSource: { mode: "site" as const, depth: "all" as const } };
  const issues = navigationIssues(site, section);
  if (component === "navigation.atlas-hall" || component === "navigation.channel-directory") { expect(issues).toEqual([]); expect(() => materializeNavigation(site, section)).not.toThrow(); }
  else { expect(issues.length).toBeGreaterThan(0); expect(() => materializeNavigation(site, section)).toThrow(); }
 });
 it("honors an intentional flat selection without silently truncating the source", () => {
  const site = fixture(), section = { ...makeSection("navigation.pocket-dock", "nav-test"), navigationSource: { mode: "site" as const, depth: "top-level" as const, pageIds: ["page-home", "page-services", "page-contact"] } };
  expect(navigationIssues(site, section)).toEqual([]); expect(materializeNavigation(site, section).content).toHaveProperty("links", [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Contact", href: "/contact" }]);
  expect(deriveNavigation(site)[4].children?.[0].children).toHaveLength(2);
 });
 it("rejects malformed imports, unknown versions, global category errors, duplicate IDs and unsafe section data", () => {
  const site = fixture();
  expect(() => deserializeSite("bad-json")).toThrow(); expect(() => parseSiteDefinition({ ...site, version: 2 })).toThrow();
  expect(() => parseSiteDefinition({ ...site, globals: { navigation: makeSection("hero.statement", "wrong") } })).toThrow();
  expect(() => parseSiteDefinition({ ...site, pages: [...site.pages, site.pages[0]] })).toThrow();
  expect(() => parseSiteDefinition({ ...site, pages: [{ ...site.pages[0], overrides: { brand: "wrong" } }, ...site.pages.slice(1)] })).toThrow();
 });
 it("accepts semantic page roles in existing component metadata without inventing templates", () => {
  expect(validateDesignRegistry([{ ...designComponents[0], pageTypes: ["service-detail", "article", "custom"] }])).toEqual([]);
 });
 it("binds Services and Commerce destinations to page entities and validates resolved props", () => {
  const site = updatePage(fixture(), "page-services", { slug: "capabilities" });
  const services = resolvePageComposition(site, "page-services").sections.find(section => section.component === "services.offering-index")!;
  expect(services.content).toHaveProperty("entries.0.detail.href", "/capabilities/web-design");
  const shop = resolvePageComposition(site, "page-shop").sections.find(section => section.component === "commerce.merchant-edit")!;
  expect(shop.content).toHaveProperty("items.0.product.destination.href", "/shop/apparel/product-alpha");
  expect(resolvePageComposition(site, "page-web-design").sections[1].content).toHaveProperty("action.href", "/capabilities#section-services-1");
  expect(site.pages.find(page => page.id === "page-services")!.sections[1].content).toHaveProperty("entries.0.detail.href", "https://example.com/offerings/c01-architecture-detail-0");
 });
 it("duplicates maximum-length labels/titles/slugs safely, as unpublished independent drafts", () => {
  let site = updatePage(fixture(), "page-about", { title: "A".repeat(180), navLabel: "B".repeat(80), slug: "c".repeat(180), status: "published" });
  const result = duplicatePage(site, "page-about"), copy = result.site.pages.find(page => page.id === result.pageId)!;
  expect(copy.title.length).toBeLessThanOrEqual(180); expect(copy.navLabel!.length).toBeLessThanOrEqual(80); expect(copy.slug.length).toBeLessThanOrEqual(180); expect(copy.status).toBe("draft");
  site = result.site; expect(navigationIssues(site, site.globals.navigation!)).toEqual([]);
 });
 it("keeps blank drafts valid and the Labs conceptually separate", () => {
  const blank = siteFromComposition(makeBlankComposition()); expect(parseSiteDefinition(blank)).toEqual(blank); expect(resolvePageComposition(blank, "page-home").sections).toEqual([]);
 });
});
