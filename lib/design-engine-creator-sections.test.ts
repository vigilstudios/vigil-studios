import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { creatorSections } from "../design-engine/registry/creator-sections";
import { creatorSectionIds } from "../design-engine/composition/creator-schemas";
import { creatorImagePackages } from "../design-engine/preview/creator-image-packages";
import { makeCreatorSection } from "../design-engine/preview/creator-fixtures";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { sectionSchemas, parseSection, type SectionId } from "../design-engine/composition/schemas";
import { clientAdaptationsFor, adaptSectionExample } from "../design-engine/preview/client-adaptations";
import { renderSection } from "../design-engine/composition/render";
import { prepareSectionAddition } from "../design-engine/preview/composition/addition";
import { makeBlankComposition } from "../design-engine/preview/composition/fixtures";
import { transitionSection } from "../design-engine/composition/controls";

describe("Creator sections and universal client packages", () => {
  it.each(Object.keys(sectionSchemas) as SectionId[])("%s offers all four creator clients and retains non-content settings", id => {
    const original = makeSection(id, "creator-section");
    for (const pack of creatorImagePackages) {
      expect(clientAdaptationsFor(id).some(choice => choice.value === pack.id)).toBe(true);
      const adapted = adaptSectionExample(original, pack.id);
      const { content, media, ...before } = original as unknown as Record<string, unknown>;
      const { content: nextContent, media: nextMedia, ...after } = adapted as unknown as Record<string, unknown>;
      void content; void media; void nextContent; void nextMedia;
      expect(after).toEqual(before);
      expect(parseSection(adapted)).toEqual(adapted);
    }
  });

  it.each(creatorSections)("$id adds to a blank page and renders every layout and finite style option", entry => {
    expect(prepareSectionAddition(makeBlankComposition(), entry.id).reason).toBeUndefined();
    for (const variant of entry.previewVariants) {
      const section = makeCreatorSection(entry.id, "creator-section", variant.config);
      for (const field of entry.configurations.filter(field => field.name !== "adaptation")) {
        for (const value of field.options) {
          const changed = parseSection({ ...section, [field.name]: value });
          const html = renderToStaticMarkup(renderSection(changed));
          expect(html).toContain('aria-labelledby="creator-section-title"');
          expect(html).toContain("<h2");
        }
      }
    }
  });

  it("preserves custom social metrics, platform profiles and sources through the editor transition", () => {
    const original = makeCreatorSection("proof.social-reach", "reach");
    const content = { ...original.content, stats: [{ id: "subscribers", value: "42,817", label: "Subscribers", platform: "YouTube", period: "September 2026", source: "https://example.com/analytics" }], socials: [{ id: "youtube", platform: "YouTube", handle: "@actual-creator", href: "https://www.youtube.com/@actual-creator" }], basis: "YouTube Studio · September 2026" };
    const changed = transitionSection(original, { content }).section;
    expect(JSON.parse(JSON.stringify(changed)).content).toEqual(content);
    const html = renderToStaticMarkup(renderSection(changed));
    expect(html).toContain("42,817");
    expect(html).toContain('href="https://www.youtube.com/@actual-creator"');
    expect(html).toContain('aria-label="View source for Subscribers"');
    expect(() => parseSection({ ...original, content: { ...content, socials: [{ ...content.socials[0], href: "javascript:alert(1)" }] } })).toThrow();
    expect(() => parseSection({ ...original, content: { ...content, stats: [content.stats[0], content.stats[0]] } })).toThrow();
  });

  it("supports a full biography without optional embellishments or a second image", () => {
    const original = makeCreatorSection("about.creator-profile", "about");
    const content = { ...original.content, biography: "My personal story.\n\nA second chapter in my own words.", secondaryImage: undefined, signature: undefined, location: undefined, role: undefined, interests: [] };
    const changed = transitionSection(original, { content }).section;
    const html = renderToStaticMarkup(renderSection(changed));
    expect(html).toContain("My personal story.");
    expect(html).toContain("A second chapter in my own words.");
    expect(html).not.toContain("de-creator-snapshot");
    expect(html).not.toContain('aria-label="Interests"');
    expect(() => parseSection({ ...original, content: { ...content, biography: "x".repeat(2401) } })).toThrow();
  });

  it.each(creatorSectionIds)("%s accepts a serialized client configuration", id => {
    const section = makeCreatorSection(id, "creator-section");
    expect(parseSection(JSON.parse(JSON.stringify(section)))).toEqual(section);
  });
});
