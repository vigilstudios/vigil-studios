import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  proofStudies,
  proofProposal,
} from "../design-engine/preview/collection-008/studies";
import {
  makeProofModel,
  proofContexts,
} from "../design-engine/preview/collection-008/fixtures";
import {
  proofStudySchemas,
  provenanceSchema,
  evidencePublicationIssues,
} from "../design-engine/preview/collection-008/contracts";
import { ProofStudyPreview } from "../design-engine/preview/collection-008/Study";
import {
  makeProofComposition,
  proofCompositionContexts,
} from "../design-engine/preview/collection-008/Composition";
import { inspectComposition } from "../design-engine/composition/validation";
import { designComponents } from "../design-engine/registry/components";
describe("Collection 008 creative evidence boundary", () => {
  it("preserves the original creative study snapshot alongside the expanded production inventory", () => {
    expect(designComponents).toHaveLength(126);
    expect(
      designComponents.filter((c) => c.status === "production"),
    ).toHaveLength(91);
    expect(proofStudies).toHaveLength(12);
    expect(
      new Set(proofStudies.map((s) => s.typography[0])).size,
    ).toBeGreaterThanOrEqual(8);
    proofStudies.forEach((s, i) => {
      expect(proofProposal(s).runtimeRegistration).toBe(false);
      expect(proofProposal(s).status).toContain("awaiting human");
      if (i)
        expect(s.typography[0]).not.toBe(proofStudies[i - 1].typography[0]);
    });
    expect(proofStudies.filter((s) => s.shortlist)).toHaveLength(5);
  });
  for (const study of proofStudies)
    for (const [adaptation, context] of proofContexts.entries())
      for (const stress of ["authored", "long-copy", "no-media"] as const) {
        it(`${study.id} / ${context.id} / ${stress}: validates, discloses and renders`, () => {
          const model = makeProofModel(study.id, adaptation, stress);
          expect(
            proofStudySchemas[study.id].safeParse(model.content).success,
          ).toBe(true);
          expect(evidencePublicationIssues(model).length).toBeGreaterThan(0);
          const html = renderToStaticMarkup(
            createElement(ProofStudyPreview, { study, adaptation, stress }),
          );
          expect(html).toContain("all evidence is fictional");
          expect(html).toContain('data-study="' + study.id + '"');
          expect(html).not.toContain("autoplay");
          expect(html).toContain("Demo evidence");
          if (stress === "no-media") expect(html).not.toContain("<img");
        });
      }
  for (const [contextIndex, context] of proofCompositionContexts.entries())
    for (let adaptation = 0; adaptation < 3; adaptation++)
      it(`${context.name} / ${adaptation}: uses compatible production neighbors`, () => {
        const page = makeProofComposition(contextIndex, adaptation);
        expect(inspectComposition(page).issues).toEqual([]);
        expect(
          page.sections.some((s) => s.component.startsWith("proof.")),
        ).toBe(false);
      });
  it("does not allow a verification badge without source, permission and verifier", () => {
    expect(
      provenanceSchema.safeParse({ status: "verified", source: "A survey" })
        .success,
    ).toBe(false);
    const valid = {
      status: "verified",
      source: "Published measurement",
      sourceUrl: "https://example.com/evidence",
      timeframe: "May 2026",
      context: "Same cohort",
      attribution: "Client team",
      recordReference: "record-1",
      permission: "publication-authorized",
      verification: {
        by: "Reviewer",
        on: "2026-10-05",
        method: "Compared source and supplied record",
      },
    };
    expect(provenanceSchema.safeParse(valid).success).toBe(true);
    expect(
      provenanceSchema.safeParse({
        ...valid,
        verification: { ...valid.verification, on: "2026-02-30" },
      }).success,
    ).toBe(false);
    expect(
      provenanceSchema.safeParse({ ...valid, sourceUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });
  it("rejects fake verified purchases, out-of-range ratings and out-of-order observations", () => {
    const review = makeProofModel("E07");
    if (review.id !== "E07") throw Error();
    expect(
      proofStudySchemas.E07.safeParse({
        ...review.content,
        reviews: review.content.reviews.map((r) => ({
          ...r,
          verifiedPurchase: true,
        })),
      }).success,
    ).toBe(false);
    expect(
      proofStudySchemas.E07.safeParse({
        ...review.content,
        reviews: review.content.reviews.map((r) => ({ ...r, rating: 6 })),
      }).success,
    ).toBe(false);
    const timeline = makeProofModel("E10");
    if (timeline.id !== "E10") throw Error();
    expect(
      proofStudySchemas.E10.safeParse({
        ...timeline.content,
        points: [...timeline.content.points].reverse(),
      }).success,
    ).toBe(false);
  });
  it("enforces finite evidence scales and structure-specific properties", () => {
    const c = makeProofModel("E05");
    if (c.id !== "E05") throw Error();
    expect(
      proofStudySchemas.E05.safeParse({ ...c.content, records: [] }).success,
    ).toBe(false);
    expect(
      proofStudySchemas.E05.safeParse({
        ...c.content,
        records: Array.from({ length: 13 }, () => c.content.records[0]),
      }).success,
    ).toBe(false);
    expect(
      proofStudySchemas.E05.safeParse({ ...c.content, rating: 5 }).success,
    ).toBe(false);
  });
});
