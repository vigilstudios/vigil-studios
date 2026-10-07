import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  makeCollectionSection,
  productionCollectionIds,
} from "@/design-engine/preview/production-fixtures";
import { designComponents } from "@/design-engine/registry/components";
import { getSectionContract } from "@/design-engine/composition/catalog";
import { parseSection } from "@/design-engine/composition/schemas";
import {
  renderSection,
  CompositionPreview,
} from "@/design-engine/composition/render";
import {
  inspectComposition,
  compositionTransitionNotices,
} from "@/design-engine/composition/validation";
import { compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { collection004Review } from "@/design-engine/preview/collection-004/review";
import { collection005Review } from "@/design-engine/preview/collection-005/review";
import type { DesignComponentDefinition } from "@/design-engine/registry/types";
import { promoteCollectionSection } from "@/design-engine/registry/collection-promotion";
import { imageSchema, videoSchema } from "@/design-engine/media/types";

const approved = [
  "S01",
  "S02",
  "S03",
  "S06",
  "S07",
  "S08",
  "M01",
  "M02",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09",
  "M10",
  "M11",
  "M12",
  "M13",
];
describe("Productionization 004–005", () => {
  it("preserves human decisions and excludes held/rejected studies from composable inventory", () => {
    const selected: readonly DesignComponentDefinition[] =
      designComponents.filter(
        (c) => "sourceConcept" in c && /^[SM]/.test(c.sourceConcept ?? ""),
      );
    expect(selected.map((c) => c.sourceConcept).sort()).toEqual(
      [...approved].sort(),
    );
    for (const entry of selected) {
      expect(entry.status).toBe("production");
      expect(entry.productionEvidence).toBeDefined();
      expect(
        (entry.sourceConcept!.startsWith("S")
          ? collection004Review
          : collection005Review)[entry.sourceConcept!].status,
      ).toBe("Approved");
    }
    expect(() =>
      promoteCollectionSection({
        ...selected[0],
        status: "experimental",
        sourceConcept: "M03",
      }),
    ).toThrow(/Creative approval/);
    expect(() =>
      promoteCollectionSection({
        ...selected[0],
        status: "experimental",
        sourceConcept: "S05",
      }),
    ).toThrow(/Creative approval/);
    expect(collection004Review.S04.status).toBe(
      "Promising / Revision Required",
    );
    expect(collection004Review.S05.status).toBe("Rejected");
    expect(collection005Review.M03.status).toBe("Revision required");
    expect(collection005Review.M13.status).toBe("Approved");
  });
  it("renders every approved new structure with unrelated content and length extremes", () => {
    for (const component of productionCollectionIds)
      for (const adaptation of ["apparel", "architecture", "hospitality"])
        for (const length of ["short", "standard", "long"]) {
          const section = makeCollectionSection(
            component,
            "qa-section",
            adaptation,
            length,
          );
          const html = renderToStaticMarkup(renderSection(section));
          expect(html.match(/<h2\b/g)).toHaveLength(1);
          expect(html).not.toMatch(/<h1\b|NaN|undefined|opacity:0|autoplay/i);
          expect(html).toContain('id="qa-section-title"');
          expect(getSectionContract(component).usage).toBeDefined();
        }
  });
  it("rejects invalid structure-specific counts, duplicate IDs and generic content payloads", () => {
    for (const component of productionCollectionIds) {
      const section = makeCollectionSection(component, "qa");
      expect(() =>
        parseSection({
          ...section,
          content: { title: "Generic", subtitle: "Missing structural content" },
        }),
      ).toThrow();
      expect(() =>
        parseSection({ ...section, overrides: { color: "red" } }),
      ).toThrow();
      expect(() => parseSection({ ...section, motion: "parallax" })).toThrow();
      const key = Object.keys(section.content).find((key) =>
        Array.isArray((section.content as Record<string, unknown>)[key]),
      )!;
      const items = (section.content as unknown as Record<string, unknown[]>)[
        key
      ];
      if (component !== "work.viewport-gallery")
        expect(() =>
          parseSection({
            ...section,
            content: { ...section.content, [key]: items.slice(0, 1) },
          }),
        ).toThrow();
      if (items[0] && typeof items[0] === "object" && "id" in items[0])
        expect(() =>
          parseSection({
            ...section,
            content: { ...section.content, [key]: items.map(() => items[0]) },
          }),
        ).toThrow();
    }
  });
  it("handles absent facing plates, chapter evidence, notes and postscripts", () => {
    const folio = makeCollectionSection("work.campaign-folio", "folio");
    delete folio.content.spreads[0].facing;
    expect(() =>
      renderToStaticMarkup(renderSection(parseSection(folio))),
    ).not.toThrow();
    const chapters = makeCollectionSection("work.project-chapters", "chapters");
    delete chapters.content.chapters[0].evidence;
    expect(() =>
      renderToStaticMarkup(renderSection(parseSection(chapters))),
    ).not.toThrow();
    const letter = makeCollectionSection("story.open-letter", "letter");
    delete letter.content.postscript;
    expect(
      renderToStaticMarkup(renderSection(parseSection(letter))),
    ).not.toContain("Postscript");
  });
  it("requires authored pairs and accessible user-started video", () => {
    const pair = makeCollectionSection("work.look-closer", "pairs");
    expect(() =>
      parseSection({
        ...pair,
        content: {
          ...pair.content,
          pairs: pair.content.pairs.map((p) => ({
            ...p,
            companion: undefined,
          })),
        },
      }),
    ).toThrow();
    const cabinet = makeCollectionSection("work.media-cabinet", "cabinet");
    const video = cabinet.content.records.find((r) => r.kind === "video")!;
    if (video.kind !== "video") throw new Error("Missing fixture video");
    expect(
      videoSchema.safeParse({ ...video.video, hasSpeech: true }).success,
    ).toBe(false);
    expect(
      videoSchema.safeParse({
        ...video.video,
        hasSpeech: true,
        captions: { src: "/captions.vtt", language: "en", label: "English" },
      }).success,
    ).toBe(true);
    const html = renderToStaticMarkup(renderSection(cabinet));
    expect(html).toContain('preload="none"');
    expect(html).toContain("Transcript:");
    expect(html).not.toContain("autoPlay");
    expect(
      imageSchema.safeParse({ ...video.video.poster, width: 0 }).success,
    ).toBe(false);
  });
  it("checks unlike cross-collection sequences and controlled overrides", () => {
    for (const page of compositionFixtures.filter((p) =>
      p.id.startsWith("production-"),
    )) {
      expect(inspectComposition(page).issues).toEqual([]);
      const html = renderToStaticMarkup(
        createElement(CompositionPreview, { composition: page }),
      );
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect((html.match(/<h2\b/g) ?? []).length).toBeGreaterThanOrEqual(4);
    }
    for (const component of productionCollectionIds) {
      const pages = compositionFixtures.filter((p) =>
        p.sections.some((s) => s.component === component),
      );
      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(
        new Set(pages.map((p) => p.site.typography)).size,
      ).toBeGreaterThanOrEqual(2);
    }
    const page = structuredClone(
      compositionFixtures.find((p) => p.id.startsWith("production-"))!,
    );
    const body = page.sections.find((s) => s.component.startsWith("work."))!;
    body.overrides = { motion: "expressive" };
    expect(inspectComposition(page).issues.map((i) => i.code)).toContain(
      "override",
    );
  });
  it("budgets large proof/tray collections and reports deliberate seams", () => {
    const proof = makeCollectionSection("work.contact-room", "proof");
    proof.content.frames = Array.from({ length: 9 }, (_, i) => ({
      ...proof.content.frames[0],
      id: `frame-${i}`,
    }));
    expect(() => parseSection(proof)).toThrow(/thumbnails/);
    proof.content.frames = proof.content.frames.map((frame) => ({
      ...frame,
      thumbnail: {
        ...frame.image,
        src: "/thumb.webp",
        width: 480,
        height: 320,
      },
    }));
    expect(() => parseSection(proof)).not.toThrow();
    proof.content.frames = Array.from({ length: 25 }, (_, i) => ({
      ...proof.content.frames[0],
      id: `frame-${i}`,
    }));
    expect(() => parseSection(proof)).toThrow();
    const page = {
      ...compositionFixtures[0],
      sections: [
        makeCollectionSection("work.screening-room", "room"),
        makeCollectionSection("work.campaign-score", "score"),
        makeCollectionSection("work.photographic-promenade", "walk"),
      ],
    };
    expect(compositionTransitionNotices(page).map((n) => n.code)).toEqual([
      "surface-transition",
      "full-bleed",
      "scroll-region",
    ]);
    expect(inspectComposition(page).issues).toEqual([]);
  });
  it("keeps production source independent of studies, assets, brands and routes", () => {
    for (const name of [
      "OpenIndex",
      "ProjectChapters",
      "ContactRoom",
      "ScreeningRoom",
      "PhotographicPromenade",
      "GalleryHanging",
      "CampaignFolio",
      "LookCloser",
      "CampaignScore",
      "MediaCabinet",
      "LightTable",
      "ViewportGallery",
    ]) {
      const source = readFileSync(
        `design-engine/sections/work/${name}.tsx`,
        "utf8",
      );
      expect(source).not.toMatch(
        /preview\/|@\/docs|next\/navigation|SELVEDGE|CONCRETE|Scar/i,
      );
    }
  });
  it("preserves viewport-gallery count, category, crop and disclosure boundaries", () => {
    const gallery = makeCollectionSection(
      "work.viewport-gallery",
      "wall",
      "urban",
    );
    expect(gallery.content.pieces.map((piece) => piece.id)).toEqual([
      "u1",
      "u3",
      "u2",
      "u4",
    ]);
    expect(
      gallery.content.pieces
        .slice(0, 2)
        .every((piece) => piece.fit === "contain"),
    ).toBe(true);
    for (const count of [1, 5, 24]) {
      const pieces = Array.from({ length: count }, (_, index) => ({
        ...gallery.content.pieces[0],
        id: `piece-${index}`,
      }));
      const parsed = parseSection({
        ...gallery,
        content: { ...gallery.content, pieces },
      });
      const html = renderToStaticMarkup(renderSection(parsed));
      expect(html.match(/class="de-viewport-piece"/g)).toHaveLength(count);
      expect(html.match(/aria-expanded="false"/g)).toHaveLength(count);
      expect(html.match(/hidden=""/g)).toHaveLength(count);
      expect(html).toContain('data-fit="contain"');
      expect(html).not.toMatch(/<nav\b|<h1\b|autoplay/);
    }
    for (const count of [0, 25])
      expect(() =>
        parseSection({
          ...gallery,
          content: {
            ...gallery.content,
            pieces: Array.from({ length: count }, (_, index) => ({
              ...gallery.content.pieces[0],
              id: `piece-${index}`,
            })),
          },
        }),
      ).toThrow();
    expect(() =>
      parseSection({
        ...gallery,
        content: {
          ...gallery.content,
          pieces: Array.from({ length: 5 }, (_, index) => ({
            ...gallery.content.pieces[0],
            id: `piece-${index}`,
            category: `Category ${index}`,
          })),
        },
      }),
    ).toThrow(/four categories/);
    expect(() =>
      parseSection({
        ...gallery,
        content: {
          ...gallery.content,
          pieces: gallery.content.pieces.map((piece) => ({
            ...piece,
            fit: "automatic",
          })),
        },
      }),
    ).toThrow();
    expect(getSectionContract("work.viewport-gallery").usage).toBe(
      "page-capable",
    );
  });
});
