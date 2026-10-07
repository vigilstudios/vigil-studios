import { promoteCollectionSection } from "@/design-engine/registry/collection-promotion";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeServiceSection } from "@/design-engine/preview/service-fixtures";
import { serviceSectionIds } from "@/design-engine/composition/service-contracts";
import { serviceDestinationSchema } from "@/design-engine/composition/service-schemas";
import { parseSection } from "@/design-engine/composition/schemas";
import { getSectionContract } from "@/design-engine/composition/catalog";
import {
  renderSection,
  CompositionPreview,
} from "@/design-engine/composition/render";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { componentDefaultLayers, previewCapabilityIssues } from "@/design-engine/registry/capabilities";
import { compositionTransitionNotices, inspectComposition } from "@/design-engine/composition/validation";
import { compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { designComponents } from "@/design-engine/registry/components";
import { collection006Review } from "@/design-engine/registry/creative-review";

const html = (section: Parameters<typeof renderSection>[0]) =>
  renderToStaticMarkup(renderSection(section));
describe("Productionization Pass 006", () => {
  it("preserves twelve human approvals independently of evidence-gated implementations", () => {
    expect(Object.keys(collection006Review)).toHaveLength(12);
    const entries: readonly import("@/design-engine/registry/types").DesignComponentDefinition[] =
      designComponents.filter(
        (entry) => "sourceConcept" in entry && /^C\d/.test(entry.sourceConcept),
      );
    expect(entries.map((entry) => entry.id)).toEqual([...serviceSectionIds]);
    for (const entry of entries) {
      expect(collection006Review[entry.sourceConcept!].status).toBe("Approved");
      expect(entry.status).toBe("production");
      expect(entry.productionEvidence).toBeDefined();
      for (const preset of entry.previewVariants) {
        const layers = componentDefaultLayers(entry, preset.config);
        expect(previewCapabilityIssues(entry, preset.config, layers ?? {})).toEqual([]);
        if (preset.config.motion === "none") expect(layers?.motion).toBe("none");
        else expect(layers?.motion).toBe("restrained");
      }
    }
    expect(() =>
      promoteCollectionSection({ ...entries[0], status: "experimental" }),
    ).toThrow(/current-pass QA evidence/);
    expect(() =>
      promoteCollectionSection({
        ...entries[0],
        sourceConcept: "C99",
        status: "experimental",
      }),
    ).toThrow(/Creative approval/);
    expect(collection006Review.C03.note).toMatch(
      /image usage and animation potential/,
    );
    expect(collection006Review.C10.note).toMatch(
      /image usage and animation potential/,
    );
  });
  it("renders independent structures across unrelated content, longer copy and every declared type/art", () => {
    for (const component of serviceSectionIds) {
      const contract = getSectionContract(component);
      expect(contract.supportedContentTypes?.length).toBeGreaterThanOrEqual(3);
      expect(contract.itemRange).toBeDefined();
      expect(contract.usage).toBeDefined();
      for (const adaptation of ["professional", "platform", "program"])
        for (const length of ["standard", "long"]) {
          const markup = html(
            makeServiceSection(component, "services", adaptation, length),
          );
          expect(markup.match(/<h2\b/g)).toHaveLength(1);
          expect(markup).toContain('id="services-title"');
          expect(markup).not.toMatch(
            /<h1\b|undefined|\bNaN\b|opacity:0|Lab destination|autoplay/i,
          );
        }
      for (const typography of contract.typography.profiles)
        for (const artDirection of contract.artDirections) {
          const markup = renderToStaticMarkup(
            createElement(
              DesignThemeProvider,
              { typography, artDirection, motion: "none" },
              renderSection(makeServiceSection(component, "services")),
            ),
          );
          expect(markup).not.toMatch(/NaN|undefined/);
        }
    }
  });
  it("enforces every mechanism's finite count and rejects generic or commerce payloads", () => {
    const fields = [
      "entries",
      "principles",
      "capabilities",
      "services",
      "situations",
      "stages",
      "groups",
      "layers",
      "plates",
      "cases",
      "paths",
      "offerings",
    ];
    const limits = [
      [3, 7],
      [3, 5],
      [4, 8],
      [5, 10],
      [3, 5],
      [3, 6],
      [3, 4],
      [3, 5],
      [3, 5],
      [2, 4],
      [3, 5],
      [2, 3],
    ];
    for (const [i, component] of serviceSectionIds.entries()) {
      const section = makeServiceSection(component, "services");
      const content = section.content as unknown as Record<string, unknown>;
      const rows = content[fields[i]] as Record<string, unknown>[];
      for (const count of [limits[i][0] - 1, limits[i][1] + 1]) {
        const records = Array.from({ length: count }, (_, j) => ({
          ...rows[j % rows.length],
          id: `record-${j}`,
        }));
        expect(() =>
          parseSection({
            ...section,
            content: { ...content, [fields[i]]: records },
          }),
        ).toThrow();
      }
      for (const scale of ["minimum", "maximum"])
        expect(() =>
          makeServiceSection(
            component,
            "bounded",
            "professional",
            "long",
            "none",
            scale,
          ),
        ).not.toThrow();
      expect(() =>
        parseSection({ ...section, content: { ...content, price: 100 } }),
      ).toThrow();
      expect(() =>
        parseSection({ ...section, content: { title: "Generic", items: [] } }),
      ).toThrow();
    }
  });
  it("requires exact matrix relationships and unique phase/group/record identifiers", () => {
    const section = makeServiceSection(
      "services.capability-coverage",
      "matrix",
    );
    const broken = structuredClone(section);
    broken.content.groups[0].capabilities[0].coverage.pop();
    expect(() => parseSection(broken)).toThrow(/coverage value/);
    section.content.groups[1].capabilities[0].id =
      section.content.groups[0].capabilities[0].id;
    expect(() => parseSection(section)).toThrow(/unique/);
    const scope = makeServiceSection("services.scope-companions", "scopes");
    scope.content.criteria.push("Extra shared question");
    expect(() => parseSection(scope)).toThrow(/value for each/);
  });
  it("accepts client-owned destinations and optional details without simulated local routes", () => {
    for (const href of [
      "/offerings/cloud",
      "https://example.com/program/mentor",
      "mailto:hello@example.com",
      "#program",
    ])
      expect(
        serviceDestinationSchema.safeParse({ label: "Learn more", href })
          .success,
      ).toBe(true);
    for (const href of [
      "javascript:alert(1)",
      "//example.com",
      "/\\example.com",
      "data:text/html,test",
      "https://example.com/bad\npath",
    ])
      expect(
        serviceDestinationSchema.safeParse({ label: "Learn more", href })
          .success,
      ).toBe(false);
    const section = makeServiceSection("services.offering-index", "directory");
    section.content.entries.forEach((entry) => delete entry.detail);
    expect(html(parseSection(section))).not.toContain("de-service-detail-link");
    section.content.entries[0].slug = "cloud-computing";
    section.content.entries[0].detail = {
      label: "Cloud service details",
      href: "/services/cloud",
    };
    expect(html(parseSection(section))).toContain('href="/services/cloud"');
  });
  it("mounts only active evidence and retains selected IDs with semantic relationships", () => {
    const desk = makeServiceSection("services.capability-desk", "desk");
    desk.initialSelectedId = desk.content.capabilities[2].id;
    const markup = html(parseSection(desk));
    expect(markup.match(/<img\b/g)).toHaveLength(1);
    expect(markup).toContain(`src="${desk.content.capabilities[2].image.src}"`);
    expect(markup).toContain('aria-controls="desk-evidence"');
    expect(markup).toContain('aria-live="polite"');
    expect(() =>
      parseSection({ ...desk, initialSelectedId: "nonexistent" }),
    ).toThrow(/Selected ID/);
    const cases = makeServiceSection(
      "services.evidence-in-practice",
      "evidence",
    );
    expect(html(cases).match(/<img\b/g)).toHaveLength(2);
    expect(html(cases)).toContain('aria-controls="evidence-case"');
    const scopes = makeServiceSection("services.scope-companions", "scope");
    scopes.initialBaselineId = scopes.content.offerings[0].id;
    scopes.initialCandidateId = scopes.initialBaselineId;
    expect(html(scopes)).toContain("Both columns show");
    expect(() =>
      parseSection({ ...scopes, initialCandidateId: "missing" }),
    ).toThrow(/Comparison IDs/);
  });
  it("uses native disclosures without forced client state and bounds media motion", () => {
    const disclosures = makeServiceSection(
      "services.expandable-offerings",
      "disclosures",
    );
    expect(html(disclosures).match(/<details\b/g)).toHaveLength(
      disclosures.content.services.length,
    );
    const desk = makeServiceSection("services.capability-desk", "desk");
    const animated = { ...desk, motion: "media-reveal" as const };
    expect(() => parseSection(animated)).not.toThrow();
    expect(
      renderToStaticMarkup(
        createElement(
          DesignThemeProvider,
          { motion: "none" },
          renderSection(animated),
        ),
      ),
    ).not.toContain("opacity:0.7");
    expect(() =>
      parseSection({
        ...desk,
        treatment: { geometry: "full-bleed", tone: "natural" },
      }),
    ).toThrow();
    expect(() =>
      parseSection({ ...disclosures, motion: "media-reveal" }),
    ).toThrow();
    const matrix = makeServiceSection("services.capability-coverage", "matrix");
    expect(html(matrix)).toContain('scope="rowgroup"');
  });
  it("validates two unlike navigation/hero/story/work sequences per system", () => {
    const pages = compositionFixtures.filter((page) =>
      page.id.startsWith("services-"),
    );
    expect(pages).toHaveLength(24);
    expect(compositionTransitionNotices(pages.find(page => page.id === "services-6-1")!).some(notice => notice.code === "density-transition")).toBe(true);
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
    }
    for (const component of serviceSectionIds) {
      const primary = pages.filter((page) =>
        page.sections.some(
          (section) =>
            section.component === component && section.id === "offerings",
        ),
      );
      expect(new Set(primary.map((page) => page.site.typography)).size).toBe(2);
      expect(
        new Set(primary.map((page) => page.sections[1].component)).size,
      ).toBe(2);
    }
  });
  it("keeps runtime independent of creative fixtures, brands, routes and unused state", () => {
    const staticNames = [
      "OfferingIndex",
      "CapabilityManifesto",
      "ExpandableOfferings",
      "SituationResponses",
      "DeliveryJourney",
      "ConnectedCapabilities",
      "ServiceFieldAtlas",
    ];
    for (const name of [
      ...staticNames,
      "CapabilityDesk",
      "CapabilityCoverage",
      "EvidenceInPractice",
      "StartingPoint",
      "ScopeCompanions",
    ]) {
      const source = readFileSync(
        `design-engine/sections/services/${name}.tsx`,
        "utf8",
      );
      expect(source).not.toMatch(
        /preview\/|next\/navigation|serviceFixture|ScrollListener|Scar/i,
      );
      if (staticNames.includes(name))
        expect(source).not.toMatch(/use client|useState|useEffect/);
    }
  });
});
