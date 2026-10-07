import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeEndingSection } from "@/design-engine/preview/ending-fixtures";
import { parseSection } from "@/design-engine/composition/schemas";
import { endingSections } from "@/design-engine/registry/ending-sections";
import { renderSection } from "@/design-engine/composition/render";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import {
  serializeSite,
  deserializeSite,
} from "@/design-engine/site/persistence";
const ids = [
  "work.image-expansion",
  "work.image-gallery",
  "work.apple-cards",
  "work.liquid-glass",
] as const;
describe("Media replacements", () => {
  it("keeps four distinct selectable layouts and removes the retired gallery", () => {
    expect(
      endingSections.some((entry) => String(entry.id) === "work.glass-lens"),
    ).toBe(false);
    for (const id of ids) {
      const entry = endingSections.find((entry) => entry.id === id)!;
      expect(entry).toBeDefined();
      expect(
        entry.configurations.find((field) => field.name === "skin")?.options,
      ).toEqual(["reference", "site"]);
    }
    expect(
      new Set(ids.map((id) => makeEndingSection(id, "media").structure)).size,
    ).toBe(4);
  });
  it("persists creator records, style settings and real per-item actions", () => {
    for (const id of ids) {
      const section = makeEndingSection(id, "media", {
        skin: "site",
        adaptation: "creator",
        alignment: "right",
        motion: "none",
      });
      const work = section.content.works[0];
      const parsed = parseSection({
        ...section,
        content: { ...section.content, title: "Client-authored campaigns" },
        contextualActions: {
          items: [
            {
              group: "works",
              itemId: work.id,
              display: "link",
              slot: {
                enabled: true,
                label: "Watch campaign",
                action: {
                  type: "external",
                  url: "https://www.youtube.com/watch?v=campaign",
                },
                presentation: { variant: "underline", size: "small" },
              },
            },
          ],
        },
      });
      const site = makeComplexSiteFixture();
      site.pages[0].sections = [parsed];
      const restored = deserializeSite(serializeSite(site));
      expect(restored.pages[0].sections[0]).toEqual(parsed);
      const html = renderToStaticMarkup(
        createElement(
          DesignThemeProvider,
          { theme: "neutral" },
          renderSection(parsed),
        ),
      );
      expect(html).toContain("Client-authored campaigns");
      expect(html).toContain("Watch campaign");
      expect(html).not.toContain("shadcnspace");
      expect(html).not.toContain("Google Gemini");
    }
  });
  it("migrates a saved retired gallery without losing authored media or actions", () => {
    const original = makeEndingSection("work.liquid-glass", "legacy");
    const { skin, alignment, height, entry, gap, ...retained } = original;
    void skin;
    void alignment;
    void height;
    void entry;
    void gap;
    const parsed = parseSection({
      ...retained,
      component: "work.glass-lens",
      structure: "portrait",
      lens: "strong",
    });
    expect(parsed.component).toBe("work.liquid-glass");
    expect(parsed.content).toEqual(original.content);
    expect(parsed.id).toBe("legacy");
  });
  it("rejects fake styling options and repeated media IDs", () => {
    for (const id of ids) {
      const section = makeEndingSection(id, "media");
      expect(() => parseSection({ ...section, skin: "random" })).toThrow();
      expect(() =>
        parseSection({
          ...section,
          content: {
            ...section.content,
            works: [section.content.works[0], section.content.works[0]],
          },
        }),
      ).toThrow();
    }
  });
});
