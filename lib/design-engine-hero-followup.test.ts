import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  heroFollowupIds,
  makeHeroFollowupSection,
} from "@/design-engine/preview/hero-followup-fixtures";
import { parseSection } from "@/design-engine/composition/schemas";
import { getSectionContract } from "@/design-engine/composition/catalog";
import {
  renderSection,
  CompositionPreview,
} from "@/design-engine/composition/render";
import { inspectComposition } from "@/design-engine/composition/validation";
import { compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { heroApprovalFollowup } from "@/design-engine/registry/creative-review";
import { designComponents } from "@/design-engine/registry/components";
import {
  componentDefaultLayers,
  previewCapabilityIssues,
} from "@/design-engine/registry/capabilities";
import { promoteCollectionSection } from "@/design-engine/registry/collection-promotion";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";

const html = (section: Parameters<typeof renderSection>[0]) =>
  renderToStaticMarkup(renderSection(section));
describe("Approved H09 / H16 production follow-up", () => {
  it("requires preserved human approval and distinct current QA evidence", () => {
    for (const source of ["H09", "H16"] as const) {
      expect(heroApprovalFollowup[source].status).toBe("Approved");
      const entry = designComponents.find(
        (c) => "sourceConcept" in c && c.sourceConcept === source,
      )!;
      expect(entry.status).toBe("production");
      expect(entry.version).toBe("1.0.0");
      expect("productionEvidence" in entry).toBe(true);
      expect(() =>
        promoteCollectionSection({ ...entry, status: "experimental" }),
      ).toThrow(/current-pass QA/);
      for (const variant of entry.previewVariants)
        expect(
          previewCapabilityIssues(
            entry,
            variant.config,
            componentDefaultLayers(entry, variant.config) ?? {},
          ),
        ).toEqual([]);
    }
  });
  it("renders each structure under unrelated content and bounded short/long copy", () => {
    for (const id of heroFollowupIds)
      for (const context of ["professional", "platform", "program"])
        for (const length of ["short", "standard", "long"]) {
          const section = makeHeroFollowupSection(
            id,
            "opening",
            context,
            length,
          );
          const markup = html(section);
          expect(markup.match(/<h1\b/g)).toHaveLength(1);
          expect(markup.match(/<img\b/g)).toHaveLength(1);
          expect(markup).toContain('loading="eager"');
          expect(markup).toContain('fetchPriority="high"');
          expect(markup).not.toMatch(
            /undefined|NaN|Original study|figma\.com|aria-pressed/,
          );
          if (id === "hero.vertical-record")
            expect(markup).toContain('aria-labelledby="opening-record-title"');
          for (const typography of getSectionContract(id).typography.profiles)
            expect(
              renderToStaticMarkup(
                createElement(
                  DesignThemeProvider,
                  { typography },
                  renderSection(section),
                ),
              ),
            ).not.toMatch(/undefined|NaN/);
        }
  });
  it("enforces record relationships, text bounds, action safety and fixed geometry", () => {
    const record = makeHeroFollowupSection("hero.vertical-record", "opening");
    for (const count of [1, 6])
      expect(() =>
        parseSection({
          ...record,
          content: {
            ...record.content,
            records: Array.from({ length: count }, (_, i) => ({
              id: `record-${i}`,
              dateLabel: "Today",
              label: "Continue",
            })),
          },
        }),
      ).toThrow();
    for (const scale of ["minimum", "maximum"])
      expect(() =>
        makeHeroFollowupSection(
          "hero.vertical-record",
          "opening",
          "program",
          "long",
          "none",
          scale,
        ),
      ).not.toThrow();
    record.content.records[1].id = record.content.records[0].id;
    expect(() => parseSection(record)).toThrow(/unique/);
    const object = makeHeroFollowupSection("hero.object-study", "opening");
    for (const href of [
      "javascript:alert(1)",
      "//external.example",
      "/\\external.example",
      "https://example.com/bad\npath",
    ])
      expect(() =>
        parseSection({
          ...object,
          content: { ...object.content, action: { label: "Details", href } },
        }),
      ).toThrow();
    expect(
      html(
        parseSection({
          ...object,
          content: {
            ...object.content,
            action: { label: "Details", href: "/objects/chair" },
          },
        }),
      ),
    ).toContain('href="/objects/chair"');
    expect(() =>
      parseSection({
        ...object,
        content: { ...object.content, objectNumber: "a".repeat(13) },
      }),
    ).toThrow();
    expect(() =>
      parseSection({ ...object, content: { ...object.content, price: 99 } }),
    ).toThrow();
    expect(() =>
      parseSection({
        ...object,
        treatment: { geometry: "full-bleed", tone: "natural" },
      }),
    ).toThrow();
    expect(() => parseSection({ ...object, motion: "media-reveal" })).toThrow();
  });
  it("uses the existing image-only reveal and complete site-none resting state", () => {
    const record = makeHeroFollowupSection(
      "hero.vertical-record",
      "opening",
      "professional",
      "standard",
      "media-reveal",
    );
    const staticHtml = renderToStaticMarkup(
      createElement(
        DesignThemeProvider,
        { motion: "none" },
        renderSection(record),
      ),
    );
    expect(staticHtml).not.toMatch(/clip-path|opacity:0.7|translateX/);
    expect(
      html(makeHeroFollowupSection("hero.object-study", "opening")),
    ).not.toContain("href=");
    for (const file of ["ObjectStudyHero", "VerticalRecordHero"]) {
      const source = readFileSync(
        `design-engine/sections/heroes/${file}.tsx`,
        "utf8",
      );
      expect(source).not.toMatch(
        /preview\/|use client|useState|useEffect|addEventListener|figma\.com|docs\/design-engine/,
      );
    }
    expect(
      readFileSync(
        "design-engine/sections/heroes/VerticalRecordHero.tsx",
        "utf8",
      ),
    ).toContain("fromX={-60}");
  });
  it("composes four unlike complete sequences while retaining singleton and overlay rules", () => {
    const pages = compositionFixtures.filter((page) =>
      page.id.startsWith("hero-followup-"),
    );
    expect(pages).toHaveLength(4);
    for (const page of pages) {
      expect(inspectComposition(page).issues).toEqual([]);
      const markup = renderToStaticMarkup(
        createElement(CompositionPreview, {
          composition: page,
          embedded: false,
        }),
      );
      expect(markup.match(/<main\b/g)).toHaveLength(1);
      expect(markup.match(/<h1\b/g)).toHaveLength(1);
      expect(
        page.sections.map((s) => getSectionContract(s.component).category),
      ).toEqual([
        "navigation",
        "hero",
        "storytelling",
        "services",
        "portfolio",
      ]);
    }
    const overlay = structuredClone(compositionFixtures[4]);
    overlay.sections[1] = makeHeroFollowupSection(
      "hero.vertical-record",
      "opening",
    );
    expect(
      inspectComposition(overlay).issues.some(
        (issue) => issue.code === "navigation-overlay",
      ),
    ).toBe(true);
    const doubled = structuredClone(pages[0]);
    doubled.sections.push(
      makeHeroFollowupSection("hero.vertical-record", "another-hero"),
    );
    expect(
      inspectComposition(doubled).issues.some(
        (issue) => issue.code === "landmarks",
      ),
    ).toBe(true);
  });
});
