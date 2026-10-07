import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSectionContract } from "@/design-engine/composition/catalog";
import type { SectionId } from "@/design-engine/composition/schemas";
import { inspectComposition } from "@/design-engine/composition/validation";
import { CompositionPreview } from "@/design-engine/composition/render";
import { designComponents } from "@/design-engine/registry/components";
import { AddSectionCard } from "@/design-engine/preview/composition/AddSectionCard";
import { adaptSectionToPageLayers, prepareSectionAddition } from "@/design-engine/preview/composition/addition";
import { compositionFixtures, makeBlankComposition, makeSection } from "@/design-engine/preview/composition/fixtures";
import { sectionOptionGroups } from "@/design-engine/preview/composition/options";

const groups = sectionOptionGroups(designComponents);
const ids = groups.flatMap(group => group.options.map(option => option.value));

describe("compatible section additions", () => {
  it.each(compositionFixtures.map(page => [page.id, page] as const))("audits every registered section against %s", (_id, page) => {
    expect(inspectComposition(page).issues).toEqual([]);
    let allowed = 0, blocked = 0;
    for (const id of ids) {
      const addition = prepareSectionAddition(page, id);
      const issues = inspectComposition(addition.composition).issues;
      expect(Boolean(addition.reason), `${page.id}: ${id}`).toBe(issues.length > 0);
      expect(addition.composition.sections).toHaveLength(page.sections.length + 1);
      expect(addition.composition.sections.filter(section => section === addition.section)).toHaveLength(1);
      expect(addition.composition.site).toBe(page.site);
      expect(addition.composition.overrides).toBe(page.overrides);
      if (addition.reason) blocked++; else {
        allowed++;
        expect(() => renderToStaticMarkup(createElement(CompositionPreview, { composition: addition.composition })), `${page.id}: ${id}`).not.toThrow();
      }
      if (["hero", "navigation"].includes(getSectionContract(id).category)) {
        expect(addition.reason).toMatch(/at most one/);
      }
    }
    expect(allowed).toBeGreaterThan(0);
    expect(blocked).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(AddSectionCard, { composition: page, onAdd: () => {} }));
    expect(html.match(/class="composition-add-section"/g)).toHaveLength(1);
    expect(html.match(/<select\b/g)).toHaveLength(1);
    expect(html).not.toContain('>Add section</button>');
    for (const group of groups) {
      expect(html).toContain(`<option value="${group.category}">`);
    }
  });

  it("chooses supported local layers without rewriting inherited page layers", () => {
    const page = structuredClone(compositionFixtures[0]);
    const id = "story.decision-ledger" as SectionId;
    expect(prepareSectionAddition(page, id).reason).toBeUndefined();
    page.overrides = { artDirection: "salon" };
    const addition = prepareSectionAddition(page, id);
    expect(addition.reason).toBeUndefined();
    expect(addition.section.overrides?.artDirection).toBe("precision");
    expect(addition.composition.overrides).toEqual({ artDirection: "salon" });
  });

  it("starts with a valid blank composition and accepts Object Study under every inherited art direction", () => {
    const blank = makeBlankComposition();
    expect(blank.sections).toEqual([]);
    expect(inspectComposition(blank).issues).toEqual([]);
    for (const artDirection of ["publication", "gallery", "salon", "billboard", "precision"] as const) {
      const page = { ...blank, site: { ...blank.site, artDirection } };
      const addition = prepareSectionAddition(page, "hero.object-study");
      expect(addition.reason).toBeUndefined();
      expect(inspectComposition(addition.composition).issues).toEqual([]);
      expect(page.sections).toEqual([]);
      expect(addition.composition.site).toBe(page.site);
      const replaced = adaptSectionToPageLayers(page, makeSection("hero.object-study", "opening"));
      expect(inspectComposition({ ...page, sections: [replaced] }).issues).toEqual([]);
    }
  });

  it("places missing landmarks correctly and checks the neighboring overlay surface", () => {
    const page = structuredClone(compositionFixtures[4]);
    page.sections = page.sections.filter(section => getSectionContract(section.component).category !== "hero");
    expect(prepareSectionAddition(page, "hero.front-page").reason).toMatch(/safe zone/);
    const compatible = prepareSectionAddition(page, "hero.comparison");
    expect(compatible.reason).toBeUndefined();
    expect(compatible.composition.sections[1].component).toBe("hero.comparison");
    const noNav = structuredClone(compositionFixtures[0]);
    noNav.sections.shift();
    const navigation = prepareSectionAddition(noNav, "navigation.contents");
    expect(navigation.reason).toBeUndefined();
    expect(navigation.composition.sections[0].component).toBe("navigation.contents");
  });

  it("rejects every choice at the section limit and avoids page/section ID collisions", () => {
    const page = structuredClone(compositionFixtures[0]);
    while (page.sections.length < 20) page.sections.push(makeSection("content.feature-list", `extra-${page.sections.length}`));
    expect(inspectComposition(page).issues).toEqual([]);
    for (const id of ids) expect(prepareSectionAddition(page, id).reason).toMatch(/20/);
    const short = { ...compositionFixtures[0], id: "approach-1" };
    const addition = prepareSectionAddition(short, "content.feature-list");
    expect(addition.reason).toBeUndefined();
    expect(addition.section.id).toBe("approach-2");
  });
});
