import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionContracts, getSectionContract } from "@/design-engine/composition/catalog";
import { validateSectionContract } from "@/design-engine/composition/contract-validation";
import { sectionSchemas, parseSection, typographyIds, artIds } from "@/design-engine/composition/schemas";
import { typographyProfiles } from "@/design-engine/foundations/typography/profiles";
import { artDirections } from "@/design-engine/foundations/art-direction";
import { assertComposition, inspectComposition, resolveCreativeLayers } from "@/design-engine/composition/validation";
import { CompositionPreview, renderSection } from "@/design-engine/composition/render";
import { CompositionLab } from "@/design-engine/preview/composition/CompositionLab";
import { compositionFixtures, makeSection } from "@/design-engine/preview/composition/fixtures";
import { designComponents } from "@/design-engine/registry/components";
import { mediaGeometries, mediaTones } from "@/design-engine/media/types";
import { TreatedImage } from "@/design-engine/media/TreatedImage";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";

describe("Composition Engine contracts and rendering", () => {
  it("keeps component contracts serializable and preserves existing approval statuses", () => {
    expect(Object.keys(sectionContracts).sort()).toEqual(Object.keys(sectionSchemas).sort());
    expect(typographyIds).toEqual(typographyProfiles.map(profile => profile.id));
    expect(artIds).toEqual(artDirections.map(direction => direction.id));
    for (const [id, contract] of Object.entries(sectionContracts)) {
      expect(validateSectionContract(contract)).toEqual([]);
      expect(designComponents.find(entry => entry.id === id)).toHaveProperty("composition", contract);
      expect(JSON.parse(JSON.stringify(contract))).toEqual(contract);
    }
    expect(designComponents.slice(0, 29).every(entry => entry.status === "experimental")).toBe(true);
    expect(designComponents.slice(0, 36).filter(entry => "sourceConcept" in entry).map(entry => entry.sourceConcept)).toEqual(["N01", "N02", "H17", "H18", "H22", "H24", "H12"]);
    expect(validateSectionContract({ ...sectionContracts["hero.front-page"], overrides: ["brand"] }).length).toBeGreaterThan(0);
  });
  it("applies site, page and section settings in the correct order", () => {
    const site = compositionFixtures[0].site;
    expect(resolveCreativeLayers(site, { artDirection: "gallery", motion: "expressive" }, { typography: "poster", motion: "none" })).toEqual({ typography: "poster", artDirection: "gallery", motion: "none" });
    const page = structuredClone(compositionFixtures[0]);
    page.overrides = { typography: "technical" };
    page.sections[1].overrides = { typography: "fashion" };
    const html = renderToStaticMarkup(createElement(CompositionPreview, { composition: page }));
    expect(html).toContain('data-typography="fashion"');
    expect(html.match(/data-typography="technical"/g)).toHaveLength(2);
    expect(html.match(/--de-accent:#7d3140/g)).toHaveLength(3);
  });
  it("renders every sample composition and supported typography/art combination", () => {
    const seen = new Set<string>();
    for (const fixture of compositionFixtures) {
      expect(inspectComposition(JSON.parse(JSON.stringify(fixture))).issues).toEqual([]);
      const html = renderToStaticMarkup(createElement(CompositionPreview, { composition: fixture }));
      expect(html).toContain(`id="${fixture.id}"`);
      expect(html).not.toContain("<main");
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      const stillHtml = renderToStaticMarkup(createElement(CompositionPreview, { composition: { ...fixture, site: { ...fixture.site, motion: "none" } } }));
      expect(stillHtml).not.toMatch(/opacity:0(?:;|")/);
      seen.add(fixture.sections[1].component);
    }
    expect(seen.size).toBe(10);
  }, 15000);
  it.each(Object.keys(sectionSchemas) as (keyof typeof sectionSchemas)[])("renders %s under every declared typography/art combination", id => {
    const section = makeSection(id, "standalone"), contract = getSectionContract(id);
    for (const typography of contract.typography.profiles) for (const artDirection of contract.artDirections) {
      const html = renderToStaticMarkup(createElement(DesignThemeProvider, { typography, artDirection, motion: "none" }, renderSection(section)));
      expect(html).toContain(`data-typography="${typography}"`);
      expect(html).not.toMatch(/opacity:0(?:;|")/);
    }
  });
  it("rejects unsupported styles, content fields, overrides and behaviors", () => {
    const page = structuredClone(compositionFixtures[0]);
    expect(inspectComposition({ ...page, site: { ...page.site, arbitraryCSS: "anything" } }).issues[0].code).toBe("schema");
    expect(inspectComposition({ ...page, overrides: { brand: { accent: "red" } } }).issues[0].code).toBe("schema");
    expect(() => parseSection({ ...page.sections[1], overrides: { icons: "other" } })).toThrow();
    expect(() => parseSection({ ...page.sections[1], motion: "parallax" })).toThrow();
    expect(() => parseSection({ ...page.sections[1], structure: "generic-split" })).toThrow();
    page.sections[0].overrides = { typography: "poster" };
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("override");
    const technical = structuredClone(compositionFixtures[1]);
    technical.site.artDirection = "salon";
    expect(inspectComposition(technical).issues.map(issue => issue.code)).toContain("art-direction");
    technical.sections[1].overrides = { artDirection: "publication" };
    expect(inspectComposition(technical).issues).toEqual([]);
    expect(() => assertComposition(page)).toThrow(/Invalid composition/);
  });
  it("rejects invalid section order, duplicate IDs and incompatible navigation overlays", () => {
    const page = structuredClone(compositionFixtures[0]);
    [page.sections[0], page.sections[1]] = [page.sections[1], page.sections[0]];
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("order");
    page.sections.push(makeSection("hero.statement", "opening"));
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("identifier");
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("landmarks");
    const overlay = structuredClone(compositionFixtures[4]);
    expect(inspectComposition(overlay).issues).toEqual([]);
    overlay.sections[1] = makeSection("hero.front-page", "opening");
    expect(inspectComposition(overlay).issues.map(issue => issue.code)).toContain("navigation-overlay");
    const portable = renderToStaticMarkup(createElement(CompositionPreview, { composition: compositionFixtures[0], embedded: false }));
    expect(portable.match(/<main/g)).toHaveLength(1);
    expect(portable.indexOf("<nav")).toBeLessThan(portable.indexOf("<main"));
  });
  it("accepts supported image treatments and rejects incompatible combinations", () => {
    const section = makeSection("hero.front-page", "opening");
    for (const geometry of mediaGeometries) for (const tone of mediaTones) {
      const html = renderToStaticMarkup(createElement(TreatedImage, { image: { ...section.media.image, caption: "Authored caption", mobileSrc: "/mobile.webp" }, treatment: { geometry, tone }, priority: true }));
      expect(html).toContain(`de-treated--${geometry}`);
      expect(html).toContain(`de-treated__frame--${tone}`);
      expect(html).toContain('width="1800"');
      expect(html).toContain('loading="eager"');
      expect(html).toContain('srcSet="/mobile.webp"');
      expect(html).toContain("Authored caption");
    }
    const page = structuredClone(compositionFixtures[0]);
    page.sections[1] = { ...section, treatment: { geometry: "portrait-emphasis", tone: "natural" } };
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("media-treatment");
    expect(() => parseSection({ ...makeSection("hero.open-circuit", "opening"), treatment: { geometry: "panorama", tone: "natural" } })).toThrow();
    expect(() => parseSection({ ...section, media: { image: { ...section.media.image, alt: "" } } })).toThrow();
  });
  it("validates comparison image dimensions and signal data sources", () => {
    const page = structuredClone(compositionFixtures[4]), comparison = makeSection("hero.comparison", "opening");
    comparison.media.after.mobileFocal = { x: 0, y: 0 }; page.sections[1] = comparison;
    expect(inspectComposition(page).issues.map(issue => issue.code)).toContain("comparison-geometry");
    const signal = makeSection("hero.open-circuit", "signal");
    signal.media.signal.samples = [{ label: "A", value: -4 }, { label: "B", value: -4 }, { label: "C", value: -4 }];
    const html = renderToStaticMarkup(renderSection(signal));
    expect(html).not.toContain("NaN"); expect(html).not.toContain("Infinity");
    expect(html).toContain("Illustrative data"); expect(html).toContain("Read signal values");
    signal.media.signal.samples = [{ label: "A", value: -1e308 }, { label: "B", value: 0 }, { label: "C", value: 1e308 }];
    expect(renderToStaticMarkup(renderSection(signal))).not.toMatch(/NaN|Infinity/);
    expect(() => parseSection({ ...signal, media: { signal: { ...signal.media.signal, source: "" } } })).toThrow();
    const assembly = makeSection("hero.assembly", "opening"); assembly.media.assembly.parts[1].id = "A";
    const duplicate = structuredClone(compositionFixtures[3]); duplicate.sections[1] = assembly;
    expect(inspectComposition(duplicate).issues.map(issue => issue.code)).toContain("parts");
  });
  it("accepts new content and media without changing the section structure", () => {
    for (const id of ["hero.front-page", "hero.open-circuit", "hero.between-acts", "hero.assembly", "hero.comparison"] as const) {
      const section = makeSection(id, "opening"); section.content.title = "An entirely different client's headline";
      section.content.description = "A short new description.";
      const html = renderToStaticMarkup(renderSection(section));
      expect(html).toContain("An entirely different client&#x27;s headline");
      expect(html).not.toContain("Where the land meets possibility");
      const long = parseSection({ ...section, content: { ...section.content, title: "A much longer proposition with a clear purpose and enough context for the visitor to understand the work before selecting a destination" } });
      expect(() => renderToStaticMarkup(renderSection(long))).not.toThrow();
    }
    for (const file of ["FrontPageHero", "OpenCircuitHero", "BetweenActsHero", "AssemblyHero", "ComparisonHero"]) {
      const source = readFileSync(`design-engine/sections/heroes/${file}.tsx`, "utf8");
      expect(source).not.toMatch(/@\/docs|preview\/|#[0-9a-f]{6}/i);
    }
    const html = renderToStaticMarkup(createElement(CompositionLab));
    expect(html).toContain("Page overrides"); expect(html).toContain("Layout");
    expect(html).toContain("Compatibility"); expect(html).toContain("Blank canvas");
    expect(html).toContain("Footers can be shared globally or overridden per page.");
  });
});
