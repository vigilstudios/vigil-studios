import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { designComponents } from "../design-engine/registry/components";
import {
  clientAdaptationsFor,
  adaptSectionExample,
  exampleLogo,
} from "../design-engine/preview/client-adaptations";
import { renderDesignPreview } from "../design-engine/preview/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import {
  parseSection,
  type SectionId,
} from "../design-engine/composition/schemas";
import { brandTreatments } from "../design-engine/preview/NavigationBrandControls";
describe("Client examples and visible Navigation brand controls", () => {
  it.each(designComponents)(
    "$id has selectable client examples that change its preview",
    (entry) => {
      const choices = clientAdaptationsFor(entry.id).filter(
        (c) => c.value !== "authored",
      );
      expect(choices.length).toBeGreaterThanOrEqual(3);
      expect(new Set(choices.map((c) => c.value)).size).toBe(choices.length);
      const first = renderToStaticMarkup(
        renderDesignPreview(
          entry.id,
          entry.previewVariants[0].id,
          {},
          { adaptation: choices[0].value },
        ),
      );
      const second = renderToStaticMarkup(
        renderDesignPreview(
          entry.id,
          entry.previewVariants[0].id,
          {},
          { adaptation: choices[1].value },
        ),
      );
      expect(first).not.toBe(second);
    },
  );
  it.each(
    designComponents.filter((c) => "composition" in c && !!c.composition),
  )(
    "$id client content retains its authored structure and behavior",
    (entry) => {
      const section = makeSection(entry.id as SectionId, "example"),
        choices = clientAdaptationsFor(entry.id).filter(
          (c) => c.value !== "authored",
        );
      const contents = new Set<string>();
      for (const { value } of choices) {
        const changed = adaptSectionExample(section, value);
        expect(parseSection(changed)).toEqual(changed);
        expect(changed.id).toBe(section.id);
        expect(changed.component).toBe(section.component);
        expect(changed.structure).toBe(section.structure);
        expect(changed.motion).toBe(section.motion);
        if ("settings" in section)
          expect("settings" in changed && changed.settings).toEqual(
            section.settings,
          );
        if ("treatment" in section)
          expect("treatment" in changed && changed.treatment).toEqual(
            section.treatment,
          );
        contents.add(
          JSON.stringify({
            content: changed.content,
            ...("media" in changed ? { media: changed.media } : {}),
          }),
        );
      }
      expect(contents.size).toBe(choices.length);
    },
  );
  it.each(designComponents.filter((c) => c.category === "navigation"))(
    "$id accepts every brand treatment without changing navigation geometry settings",
    (entry) => {
      const section = makeSection(entry.id as SectionId, "navigation");
      if (!("brand" in section.content))
        throw Error("Missing navigation brand");
      for (const { value } of brandTreatments) {
        const next = parseSection({
          ...section,
          content: {
            ...section.content,
            logo: exampleLogo(section.content.brand, value),
          },
        });
        expect(next.structure).toBe(section.structure);
        expect("logo" in next.content && next.content.logo?.kind).toBe(value);
      }
    },
  );
  it("rejects unknown client examples and retains custom data for the current example", () => {
    const section = makeSection("hero.comparison", "opening");
    expect(() => adaptSectionExample(section, "unknown-client")).toThrow(
      /Unsupported client adaptation/,
    );
    expect(adaptSectionExample(section, "authored")).toBe(section);
  });
});
