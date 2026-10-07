import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  navigationIds,
  architectureFor,
  navigationOptions,
} from "../design-engine/navigation/schemas";
import { navigationStudies } from "../design-engine/preview/collection-003b/studies";
import {
  makeSection,
  compositionFixtures,
} from "../design-engine/preview/composition/fixtures";
import {
  parseSection,
  type PageComposition,
} from "../design-engine/composition/schemas";
import { inspectComposition } from "../design-engine/composition/validation";
import {
  configurationPatch,
  configurationValue,
} from "../design-engine/composition/configuration";
import { getSectionContract } from "../design-engine/composition/catalog";
import {
  renderSection,
  CompositionPreview,
} from "../design-engine/composition/render";
import { getDesignComponent } from "../design-engine/registry/components";
import { heroExpansionReview } from "../design-engine/registry/creative-review";

describe("Approved Navigation and Hero production contracts", () => {
  it.each(navigationIds)(
    "%s preserves every approved structural capability",
    (id) => {
      const a = architectureFor(id),
        study = navigationStudies.find((s) => s.id === a.id)!;
      const { status, review, ...approved } = study;
      expect(status).toBe("experimental");
      expect(review).toBe("approved");
      expect(a).toEqual(approved);
      expect(getDesignComponent(id)?.status).toBe("production");
      const c = getSectionContract(id);
      expect(c.structuralDNA).toBe(study.dna);
      expect(c.navigation?.supportedAlignments).toEqual(
        study.supportedAlignments,
      );
      for (const [name, options] of Object.entries(navigationOptions(a)))
        expect(
          c.configuration?.find((f) => f.name === `settings.${name}`)?.options,
        ).toEqual(options.map(String));
    },
  );
  it.each(navigationIds)(
    "%s rejects invalid settings, nesting, scale and destinations",
    (id) => {
      const nav = makeSection(id, "navigation");
      expect(() =>
        parseSection({
          ...nav,
          settings: { ...nav.settings, brand: "diagonal" },
        }),
      ).toThrow();
      expect(() =>
        parseSection({ ...nav, content: { ...nav.content, links: [] } }),
      ).toThrow();
      expect(() =>
        parseSection({
          ...nav,
          content: { ...nav.content, home: "javascript:alert(1)" },
        }),
      ).toThrow();
      expect(() =>
        parseSection({ ...nav, content: { ...nav.content, home: "/\\evil" } }),
      ).toThrow();
      expect(() =>
        parseSection({
          ...nav,
          settings: { ...nav.settings, invented: "control" },
        }),
      ).toThrow();
      if (!architectureFor(id).nested)
        expect(() =>
          parseSection({
            ...nav,
            content: {
              ...nav.content,
              links: nav.content.links.map((l) => ({
                ...l,
                children: [{ label: "child", href: "/child" }],
              })),
            },
          }),
        ).toThrow();
      for (const [name, options] of Object.entries(
        navigationOptions(architectureFor(id)),
      ))
        for (const value of options) {
          const next = parseSection({
            ...nav,
            ...configurationPatch(nav, `settings.${name}`, String(value)),
          });
          expect(configurationValue(next, `settings.${name}`)).toBe(
            String(value),
          );
        }
    },
  );
  it("supports every production Hero without pairwise rules and reports classified ink conflicts", () => {
    const heroes = [
      "hero.statement",
      "hero.front-page",
      "hero.open-circuit",
      "hero.comparison",
      "hero.object-study",
      "hero.vertical-record",
      "hero.between-acts",
      "hero.assembly",
      "hero.full-scene",
      "hero.scene-poster",
    ] as const;
    for (const id of navigationIds)
      for (const heroId of heroes) {
        const nav = makeSection(id, "navigation"),
          hero = makeSection(heroId, "opening");
        const page: PageComposition = {
          ...compositionFixtures[0],
          sections: [
            parseSection({
              ...nav,
              ...configurationPatch(nav, "settings.scroll", "solidify"),
            }),
            hero,
          ],
        };
        const art = getSectionContract(heroId).artDirections[0];
        page.site.artDirection = art;
        expect(inspectComposition(page).issues).toEqual([]);
        expect(
          renderToStaticMarkup(
            createElement(CompositionPreview, { composition: page }),
          ),
        ).toContain("data-hero-section");
      }
    const nav = makeSection("navigation.datum", "navigation");
    const conflicting = parseSection({
      ...nav,
      ...configurationPatch(nav, "settings.scroll", "solidify"),
      settings: {
        ...nav.settings,
        position: "overlay",
        scroll: "solidify",
        heroContrast: "dark-on-light",
      },
    });
    expect(
      inspectComposition({
        ...compositionFixtures[0],
        sections: [conflicting, makeSection("hero.full-scene", "opening")],
      }).issues.map((i) => i.code),
    ).toContain("navigation-contrast");
  });
  it("versions compact H12 intentionally and accepts historical saved payloads", () => {
    const c = getDesignComponent("hero.comparison");
    expect(c?.version).toBe("1.0.0");
    expect(c?.status).toBe("production");
    expect(heroExpansionReview.H12.status).toBe("Approved");
    const previous = makeSection("hero.comparison", "opening");
    expect(parseSection(previous)).toMatchObject({
      component: "hero.comparison",
      structure: "balanced",
    });
    for (const contentAlignment of ["left", "center", "right"]) {
      const s = parseSection({ ...previous, contentAlignment });
      expect(renderToStaticMarkup(renderSection(s))).toContain(
        `data-content-alignment="${contentAlignment}"`,
      );
    }
  });
  it.each(["hero.full-scene", "hero.scene-poster"] as const)(
    "%s has nine placements and optional content/two actions",
    (id) => {
      const s = makeSection(id, "opening");
      expect(getDesignComponent(id)?.status).toBe("production");
      for (const alignment of ["left", "center", "right"])
        for (const position of ["top", "middle", "bottom"])
          for (const voice of ["subtle", "loud"])
            for (const ink of ["light", "dark"]) {
              const next = parseSection({
                ...s,
                alignment,
                position,
                voice,
                ink,
              });
              const html = renderToStaticMarkup(renderSection(next));
              expect(html).toContain(`data-align="${alignment}"`);
              expect(html).toContain(`data-position="${position}"`);
            }
      expect(() =>
        parseSection({ ...s, content: { title: "Short" } }),
      ).not.toThrow();
      expect(() =>
        parseSection({
          ...s,
          content: { ...s.content, title: "x".repeat(181) },
        }),
      ).toThrow();
      const two = parseSection({
        ...s,
        content: {
          ...s.content,
          secondaryAction: { label: "Another way", href: "/places" },
        },
      });
      expect(renderToStaticMarkup(renderSection(two))).toContain("Another way");
      expect(() =>
        parseSection({ ...s, media: { image: { ...s.media.image, alt: "" } } }),
      ).toThrow();
    },
  );
  it("keeps all original fixture IDs and collection bodies valid beside expanded inventory", () => {
    expect(compositionFixtures.slice(0, 5).map((f) => f.id)).toEqual([
      "composition-a",
      "composition-b",
      "composition-c",
      "composition-d",
      "composition-e",
    ]);
    for (const page of compositionFixtures)
      expect(inspectComposition(page).issues).toEqual([]);
  });
});
