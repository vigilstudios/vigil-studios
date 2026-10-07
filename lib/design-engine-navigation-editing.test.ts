import { describe, expect, it } from "vitest";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import { makeSection } from "@/design-engine/preview/composition/fixtures";
import { applyNavigationButton, applyNavigationLinks, destinationAction, navigationLinkDrafts, resolvedDraftHref, restoreSiteTreeNavigation } from "@/design-engine/preview/composition/navigation-editing";
import { materializeActions } from "@/design-engine/site/actions";
import { materializeComposition } from "@/design-engine/site/navigation";
import { pageComposition } from "@/design-engine/site/model";
import { updatePage } from "@/design-engine/site/operations";
import { parseSection } from "@/design-engine/composition/schemas";

describe("Direct navbar destination editing", () => {
  it("shows the actual Site Tree labels, routes and stable targets rather than demo links", () => {
    const site = makeComplexSiteFixture();
    const links = navigationLinkDrafts(site, site.globals.navigation!);
    expect(links.map(item => item.label)).toEqual(["Home", "About", "Services", "Work", "Shop", "Contact"]);
    expect(links[4].children![0].children![0]).toMatchObject({ href: "/shop/apparel/product-alpha", action: { type: "page", pageId: "page-product-alpha" } });
  });
  it("converts edited automatic menus to custom menus without mutating pages or the original section", () => {
    const site = makeComplexSiteFixture(), before = JSON.stringify(site), section = site.globals.navigation!;
    const links = navigationLinkDrafts(site, section);
    links[1] = { label: "Talk to us", href: "", action: { type: "page", pageId: "page-contact" } };
    const next = applyNavigationLinks(site, section, links);
    expect(next.navigationSource).toBeUndefined();
    expect(next.content).toHaveProperty("links.1.href", "/contact");
    expect(next.actions).toContainEqual({ path: ["content", "links", 1, "href"], action: { type: "page", pageId: "page-contact" } });
    expect(JSON.stringify(site)).toBe(before);
  });
  it("rebuilds nested action indices after removing and reordering items", () => {
    const site = makeComplexSiteFixture(), section = site.globals.navigation!;
    const links = navigationLinkDrafts(site, section);
    const edited = [links[4], links[2], links[1], links[5], links[0]];
    edited[0].children![0].children!.reverse();
    const next = applyNavigationLinks(site, section, edited);
    expect(next.actions).toContainEqual({ path: ["content", "links", 0, "children", 0, "children", 0, "href"], action: { type: "page", pageId: "page-product-beta" } });
    const moved = updatePage(site, "page-product-beta", { slug: "new-product" });
    expect(materializeActions(moved, next).content).toHaveProperty("links.0.children.0.children.0.href", "/shop/apparel/new-product");
  });
  it("keeps the visible shared CTA and stable target when switching to a custom menu", () => {
    const site = makeComplexSiteFixture();
    site.navigation.action = { label: "Book a call", action: { type: "page", pageId: "page-contact" } };
    const next = applyNavigationLinks(site, site.globals.navigation!, navigationLinkDrafts(site, site.globals.navigation!));
    expect(next.content).toHaveProperty("action.label", "Book a call");
    expect(next.actions).toContainEqual({ path: ["content", "action", "href"], action: { type: "page", pageId: "page-contact" } });
  });
  it("recognizes authored internal page/section URLs and preserves external URLs", () => {
    const site = makeComplexSiteFixture();
    expect(destinationAction(site, "/services/web-design")).toEqual({ type: "page", pageId: "page-web-design" });
    expect(destinationAction(site, "/contact#section-contact-0")).toEqual({ type: "section", pageId: "page-contact", sectionId: "section-contact-0" });
    expect(destinationAction(site, "/contact#missing")).toBeUndefined();
    const section = makeSection("navigation.primary", "navigation");
    const authored = parseSection({ ...section, content: { ...section.content, links: [{ label: "Contact", href: "/contact" }, { label: "Partner", href: "https://example.com" }] } });
    const drafts = navigationLinkDrafts(site, authored);
    expect(drafts[0].action).toEqual({ type: "page", pageId: "page-contact" });
    expect(drafts[1].action).toBeUndefined();
    expect(applyNavigationLinks(site, authored, drafts).content).toHaveProperty("links.1.href", "https://example.com");
  });
  it("retains bound destinations instead of inferring a stale compatibility URL", () => {
    const site = makeComplexSiteFixture();
    const section = makeSection("navigation.primary", "navigation");
    section.actions = [{ path: ["content", "links", 0, "href"], action: { type: "page", pageId: "page-contact" } }];
    expect(navigationLinkDrafts(site, section)[0].action).toEqual({ type: "page", pageId: "page-contact" });
  });
  it("rejects missing targets and empty destinations without a silent fallback", () => {
    const site = makeComplexSiteFixture();
    expect(() => resolvedDraftHref(site, { label: "Broken", href: "/old-url", action: { type: "page", pageId: "missing" } })).toThrow(/Missing page/);
    expect(() => resolvedDraftHref(site, { label: "New item", href: "" })).toThrow(/Choose a destination/);
  });
  it("validates counts, hierarchy and sibling labels before committing a menu", () => {
    const site = makeComplexSiteFixture(), section = makeSection("navigation.primary", "navigation");
    const item = { label: "Contact", href: "", action: { type: "page" as const, pageId: "page-contact" } };
    expect(() => applyNavigationLinks(site, section, [item])).toThrow();
    expect(() => applyNavigationLinks(site, section, [item, item])).toThrow(/different labels/);
    expect(() => applyNavigationLinks(site, section, [item, { ...item, label: "About", children: [{ ...item, label: "Child" }] }])).toThrow();
  });
  it("edits a navbar button directly while preserving the menu and other action bindings", () => {
    const site = makeComplexSiteFixture(), section = makeSection("navigation.primary", "navigation");
    section.actions = [{ path: ["content", "links", 0, "href"], action: { type: "page", pageId: "page-about" } }];
    const next = applyNavigationButton(site, section, ["content", "action", "href"], { label: "Contact us", href: "", action: { type: "page", pageId: "page-contact" } });
    expect(next.content).toHaveProperty("action.label", "Contact us");
    expect(next.actions).toHaveLength(2);
    expect(next.content).toHaveProperty("links", section.content.links);
    expect(materializeActions(updatePage(site, "page-contact", { slug: "book" }), next).content).toHaveProperty("action.href", "/book");
  });
  it("rejects unsafe destination changes atomically", () => {
    const site = makeComplexSiteFixture(), section = makeSection("navigation.primary", "navigation"), before = JSON.stringify(section);
    expect(() => applyNavigationButton(site, section, ["content", "action", "href"], { label: "Unsafe", href: "javascript:alert(1)" })).toThrow();
    expect(JSON.stringify(section)).toBe(before);
  });
  it("links the logo to a stable page for both automatic and custom menus", () => {
    const site = makeComplexSiteFixture(), section = site.globals.navigation!;
    const next = applyNavigationButton(site, section, ["content", "home"], { label: "Logo", href: "", action: { type: "page", pageId: "page-about" } });
    const changed = updatePage(site, "page-about", { slug: "studio" });
    changed.globals.navigation = next;
    expect(materializeComposition(changed, pageComposition(changed, "page-home")).sections[0].content).toHaveProperty("home", "/studio");
    const custom = applyNavigationLinks(changed, next, navigationLinkDrafts(changed, next));
    expect(materializeActions(changed, custom).content).toHaveProperty("home", "/studio");
    expect(custom.content).not.toHaveProperty("href");
  });
  it("keeps home bindings restricted to Navigation", () => {
    const section = makeSection("hero.front-page", "hero");
    expect(() => parseSection({ ...section, actions: [{ path: ["content", "home"], action: { type: "page", pageId: "page-home" } }] })).toThrow(/Only Navigation/);
    expect(() => parseSection({ ...section, actions: [{ path: ["content", "title"], action: { type: "page", pageId: "page-home" } }] })).toThrow();
  });
  it("reports a broken home destination even with Site Tree menu derivation", () => {
    const site = makeComplexSiteFixture();
    site.globals.navigation!.actions = [{ path: ["content", "home"], action: { type: "page", pageId: "missing" } }];
    expect(() => materializeComposition(site, pageComposition(site, "page-home"))).toThrow(/Missing page/);
  });
  it("binds utility destinations independently and preserves their declared kind", () => {
    const site = makeComplexSiteFixture(), section = site.globals.navigation!;
    const next = applyNavigationButton(site, section, ["content", "utilities", 0, "href"], { label: "Find work", href: "", action: { type: "page", pageId: "page-work" } });
    expect(next.content).toHaveProperty("utilities.0.kind", "search");
    expect(next.content).toHaveProperty("utilities.0.href", "/work");
    expect(next.content).toHaveProperty("utilities.0.label", "Find work");
    expect(next.navigationSource).toEqual(section.navigationSource);
  });
  it("returns menu and shared CTA ownership to the site without retaining stale copied targets", () => {
    const site = makeComplexSiteFixture(), section = site.globals.navigation!;
    const custom = applyNavigationLinks(site, section, navigationLinkDrafts(site, section));
    custom.actions!.push({ path: ["content", "home"], action: { type: "page", pageId: "page-home" } });
    site.navigation.action = { label: "Services", action: { type: "page", pageId: "page-services" } };
    const restored = restoreSiteTreeNavigation(site, custom, "all");
    expect(restored.actions).toEqual([{ path: ["content", "home"], action: { type: "page", pageId: "page-home" } }]);
    expect(restored.navigationSource).toEqual({ mode: "site", depth: "all" });
  });
});
