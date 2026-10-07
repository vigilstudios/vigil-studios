import {
  collection004Review,
  collection005Review,
  collection006Review,
  collection007Review,
  collection008Review,
  heroApprovalFollowup,
} from "./creative-review";
import { advanceComponentStatus } from "./validation";
import type { DesignComponentDefinition, ProductionEvidence } from "./types";

/** Evidence recorded in docs/design-engine/productionization-004-005/VERIFICATION.md. */
export const collectionProductionEvidence: ProductionEvidence = {
  responsive: { desktop: true, tablet: true, mobile: true },
  accessibility: {
    semantics: true,
    keyboard: true,
    focus: true,
    reducedMotion: true,
  },
  performanceReviewed: true,
  brandNeutralReviewed: true,
  visualDiversityReviewed: true,
  approvedBy: "User human-review ledgers (creative); Codex (implementation QA)",
  approvedAt: "2026-09-30T21:31:54-04:00",
};

/** Follow-up approval and QA for the additionally approved viewport gallery. */
export const viewportGalleryProductionEvidence: ProductionEvidence = {
  ...collectionProductionEvidence,
  approvedBy:
    "User explicit M13 approval in this chat (creative); Codex (implementation QA)",
  approvedAt: "2026-09-30T22:28:49-04:00",
};

/** Preserves literal IDs while applying the established lifecycle and human-selection gates. */
export function promoteCollectionSection<T extends DesignComponentDefinition>(
  entry: T,
  currentPassEvidence?: ProductionEvidence,
): Omit<T, "status" | "version" | "productionEvidence"> & {
  readonly status: "production";
  readonly version: "1.0.0";
  productionEvidence: ProductionEvidence;
} {
  const source = entry.sourceConcept ?? "";
  const decision = source.startsWith("S")
    ? collection004Review[source]
    : source.startsWith("E")
      ? collection008Review[source]
    : source.startsWith("P")
      ? collection007Review[source]
    : source.startsWith("C")
      ? collection006Review[source]
      : source.startsWith("H")
        ? heroApprovalFollowup[source as keyof typeof heroApprovalFollowup]
        : collection005Review[source];
  if (decision?.status !== "Approved")
    throw new Error(`Creative approval required before production: ${source}`);
  if ((source.startsWith("C") || source.startsWith("H") || source.startsWith("P") || source.startsWith("E")) && !currentPassEvidence)
    throw new Error(
      "This family requires its own current-pass QA evidence.",
    );
  const review =
    entry.status === "experimental"
      ? advanceComponentStatus(entry, { to: "review" })
      : entry;
  const evidence =
    currentPassEvidence ??
    (source === "M13"
      ? viewportGalleryProductionEvidence
      : collectionProductionEvidence);
  advanceComponentStatus(review, {
    to: "production",
    evidence,
  });
  return {
    ...entry,
    status: "production",
    version: "1.0.0",
    productionEvidence: evidence,
  } as const;
}
