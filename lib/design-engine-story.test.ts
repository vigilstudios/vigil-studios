import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { collection004, storyAdaptations } from "@/design-engine/preview/collection-004/fixtures";
import { StoryStudyArtwork } from "@/design-engine/preview/collection-004/Study";
import { makeStorySection, adaptationIds } from "@/design-engine/preview/collection-004/candidates";
import { storySections } from "@/design-engine/registry/story-sections";
import { designComponents } from "@/design-engine/registry/components";
import { compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { parseSection } from "@/design-engine/composition/schemas";
import { assertComposition, inspectComposition } from "@/design-engine/composition/validation";
import { renderSection } from "@/design-engine/composition/render";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";

describe("Collection 004 studies and separate implementations", () => {
  it("keeps eight studies and 24 adaptations separate from the approved implementations", () => {
    expect(collection004.map(s => s.id)).toEqual(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08"]);
    expect(new Set(collection004.map(s => s.typography)).size).toBe(8);
    collection004.forEach((s, i) => { if (i) expect(s.typography).not.toBe(collection004[i - 1].typography); });
    for (const study of collection004) for (const adaptation of storyAdaptations) {
      const html = renderToStaticMarkup(createElement(DesignThemeProvider, { typography: study.typography, artDirection: study.art, motion: "none" }, createElement(StoryStudyArtwork, { study, adaptation })));
      expect(html).toContain(adaptation.client); expect(html).toContain("<h2"); expect(html).not.toContain("<h1"); expect(html).not.toContain("opacity:0");
    }
    expect(storySections.map(s => s.sourceConcept)).toEqual(["S01", "S03", "S06"]);
    expect(storySections.every(s => s.status === "production")).toBe(true);
    expect(designComponents.filter(s => String(s.status) === "production")).toHaveLength(91);
  });
  it("renders all strict client adaptations, extremes and variants with body semantics", () => {
    for (const entry of storySections) for (const adaptation of adaptationIds) for (const length of ["short", "standard", "long"] as const) for (const structure of entry.composition.variants) {
      const section = parseSection({ ...makeStorySection(entry.id, "story", adaptation, length), structure });
      const html = renderToStaticMarkup(renderSection(section));
      expect(html.match(/<h2\b/g)).toHaveLength(1); expect(html).toContain("<h3"); expect(html).not.toMatch(/<h1\b|opacity:0|NaN|undefined/);
      expect(html).toContain(makeStorySection(entry.id, "story", adaptation, length).content.title.replaceAll("&", "&amp;"));
      if (entry.id === "story.decision-ledger") expect(html.includes("<details")).toBe(structure === "disclosure");
    }
  });
  it("rejects undeclared content, empty attribution, invalid counts and unsupported treatments", () => {
    const object = makeStorySection("story.object-biography", "story");
    expect(() => parseSection({ ...object, style: { color: "red" } })).toThrow();
    expect(() => parseSection({ ...object, content: { ...object.content, records: object.content.records.slice(0, 2) } })).toThrow();
    expect(() => parseSection({ ...object, motion: "fade" })).toThrow();
    const conversation = makeStorySection("story.working-conversation", "story");
    expect(() => parseSection({ ...conversation, content: { ...conversation.content, attribution: "" } })).toThrow();
    expect(() => parseSection({ ...conversation, media: object.media })).toThrow();
    const page = { ...compositionFixtures[0], sections: [{ ...object, treatment: { geometry: "panorama", tone: "natural" } }] };
    expect(inspectComposition(page).issues.map(i => i.code)).toContain("media-treatment");
    expect(() => makeStorySection("story.decision-ledger", "story", "invented")).toThrow(/Unknown/);
  });
  it("provides two unlike Nav/Hero contexts per approved candidate", () => {
    for (const entry of storySections) {
      const pages = compositionFixtures.filter(p => p.sections.some(s => s.component === entry.id));
      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(new Set(pages.map(p => p.sections[1].component)).size).toBeGreaterThanOrEqual(2);
      expect(new Set(pages.map(p => p.site.typography)).size).toBeGreaterThanOrEqual(2);
      pages.forEach(p => expect(() => assertComposition(p)).not.toThrow());
    }
  });
  it("keeps reusable source neutral and finite", () => {
    for (const name of ["ObjectBiography", "WorkingConversation", "DecisionLedger"]) {
      const source = readFileSync(`design-engine/sections/storytelling/${name}.tsx`, "utf8");
      expect(source).not.toMatch(/preview\/|@\/docs|Common Form|Open Room|Field Signal|#[0-9a-f]{6}/i);
      expect(source).toContain("SectionInstance<");
    }
  });
});
