import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { componentCapabilities, configurationReason, previewCapabilityIssues } from "@/design-engine/registry/capabilities";
import { designComponents, getDesignComponent } from "@/design-engine/registry/components";
import { sectionLayerChoices, sectionChoiceReason, transitionSection } from "@/design-engine/composition/controls";
import type { PageComposition } from "@/design-engine/composition/schemas";
import { inspectComposition } from "@/design-engine/composition/validation";
import { makeSection, compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { CapabilityControl } from "@/design-engine/preview/CapabilityControl";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { renderSection } from "@/design-engine/composition/render";
import { retestStudies } from "@/design-engine/preview/calibration/RetestStudy";

describe("truthful capability controls", () => {
  it("derives every registered preview from typed mechanism or section capabilities", () => {
    for (const entry of designComponents) for (const variant of entry.previewVariants) {
      expect(componentCapabilities(entry, variant.config)).toHaveProperty("motion.reason");
    }
    expect(retestStudies.filter(s => s.motionCapability.values.length > 1).map(s => s.id)).toEqual(["H16"]);
  });
  it("filters context-incompatible overlay before accepting it, including neighboring Hero changes", () => {
    const page = structuredClone(compositionFixtures[0]);
    page.sections[0] = makeSection("navigation.island", "navigation");
    expect(sectionChoiceReason(page, page.sections[0], { placement: "overlay" })).toMatch(/safe zone/);
    page.sections[1] = makeSection("hero.comparison", "opening");
    expect(sectionChoiceReason(page, page.sections[0], { placement: "overlay" })).toBeUndefined();
    page.sections[0] = { ...makeSection("navigation.island", "navigation"), placement: "overlay" };
    expect(sectionChoiceReason(page, page.sections[1], makeSection("hero.statement", "opening"))).toMatch(/safe zone/);
    expect(configurationReason(getDesignComponent("navigation.island")!, "placement", "overlay", {})).toMatch(/standalone/);
  });
  it("clears an invalidated intensity explicitly and preserves unrelated overrides", () => {
    const section = { ...makeSection("hero.statement", "opening"), motion: "fade" as const, overrides: { typography: "poster" as const, motion: "expressive" as const } };
    const next = transitionSection(section, { motion: "none" });
    expect(next.section.overrides).toEqual({ typography: "poster" });
    expect(next.notice).toMatch(/removed/);
    const page: PageComposition = { ...compositionFixtures[0], sections: [section] };
    expect(sectionLayerChoices(page, next.section, "motion")).toEqual([]);
    expect(sectionChoiceReason(page, section, { motion: "none" })).toBeUndefined();
    page.sections = [{ ...section, motion: "none" }];
    expect(inspectComposition(page).issues.map(i => i.code)).toContain("motion-inactive");
  });
  it("keeps global motion independent for still sections and renders their content immediately", () => {
    const section = makeSection("hero.open-circuit", "opening");
    const page = { ...compositionFixtures[1], site: { ...compositionFixtures[1].site, motion: "expressive" as const }, sections: [section] };
    expect(inspectComposition(page).issues).toEqual([]);
    const html = renderToStaticMarkup(createElement(DesignThemeProvider, { motion: "expressive" }, renderSection(section)));
    expect(html).toContain("Energy in clear view"); expect(html).not.toContain("opacity:0");
    expect(componentCapabilities(getDesignComponent(section.component)!, { motion: "none" }).motion.values).toEqual(["none"]);
  });
  it("blocks a newly ineffective local art choice on structural change while preserving global layers", () => {
    const page = structuredClone(compositionFixtures[4]);
    const nav = { ...makeSection("navigation.island", "navigation"), structure: "end" as const, overrides: { artDirection: "salon" as const } };
    page.sections[0] = nav;
    expect(sectionChoiceReason(page, nav, { structure: "center" })).toMatch(/equivalent/);
    page.sections[0] = { ...nav, structure: "center" };
    expect(inspectComposition(page).issues.map(i => i.code)).toContain("art-context");
    delete page.sections[0].overrides;
    expect(inspectComposition(page).issues).toEqual([]);
    expect(sectionLayerChoices(page, page.sections[0], "artDirection").map(choice => choice.value)).not.toContain("salon");
  });
  it("rejects line/outline conflicts and renders disabled/fixed controls instead of fake selectors", () => {
    const entry = getDesignComponent("primitive.button")!;
    expect(previewCapabilityIssues(entry, { variant: "outline", size: "comfortable" }, { artDirection: "publication" })).toHaveLength(1);
    expect(previewCapabilityIssues(entry, { variant: "outline", size: "comfortable" }, { artDirection: "precision" })).toEqual([]);
    const fixed = renderToStaticMarkup(createElement(CapabilityControl, { label: "Motion", value: "none", choices: [{ value: "none" }], onChange: () => {}, onPreview: () => {} }));
    expect(fixed).not.toContain("<select"); expect(fixed).toContain("fixed");
    const contextual = renderToStaticMarkup(createElement(CapabilityControl, { label: "Art", value: "gallery", choices: [{ value: "gallery" }, { value: "precision" }, { value: "billboard", reason: "Protected crop" }], onChange: () => {}, onPreview: () => {} }));
    expect(contextual).toContain('data-choice-label="Art"'); expect(contextual).toContain('aria-expanded="false"'); expect(contextual).not.toContain("<select");
  });
});
