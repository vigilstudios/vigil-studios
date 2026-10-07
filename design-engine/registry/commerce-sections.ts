import { promoteCollectionSection } from "./collection-promotion";
import type { ProductionEvidence } from "./types";
import type { DesignComponentDefinition } from "./types";
import {
  commerceContracts,
  commerceDescriptors,
  commerceSectionIds,
} from "../composition/commerce-contracts";
/** Current-pass evidence: docs/design-engine/productionization-007/VERIFICATION.md. */
export const commerceProductionEvidence: ProductionEvidence = {
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
  approvedBy:
    "User Collection 007 creative ledger; Codex Pass 007 implementation/browser QA",
  approvedAt: "2026-10-01T19:08:00-04:00",
};
export const commerceSections = commerceSectionIds.map((id, index) => {
  const d = commerceDescriptors[index],
    composition = commerceContracts[id];
  return promoteCollectionSection(
    {
      id,
      name: `${d.name} / ${d.id}`,
      sourceConcept: d.id,
      category: "commerce",
      description: composition.structuralDNA,
      composition,
      styles: ["neutral", "editorial", "technical"],
      pageTypes:
        index === 1
          ? ["shop", "category", "search"]
          : index === 4
            ? ["shop", "collection", "category"]
            : index === 5
              ? ["lookbook", "campaign", "collection"]
              : index === 7 || index >= 9
                ? ["product", "landing"]
                : ["home", "shop", "collection", "campaign", "landing"],
      supportedMotion: ["none"],
      complexity: [1, 5, 9, 11, 12].includes(index) ? "high" : "medium",
      mobileReady: true,
      accessibilityReady: true,
      responsiveReady: { desktop: true, tablet: true, mobile: true },
      status: "experimental",
      version: "0.7.0",
      defaultCreative: {
        typography: d.typography[0],
        artDirection: composition.artDirections[0],
        motion: "none",
      },
      configurations: [
        { name: "adaptation", options: ["apparel", "beauty", "audio"] },
        { name: "contentLength", options: ["standard", "long"] },
      ],
      previewVariants: [
        {
          id: "default",
          label: "Reviewed mechanism / client content",
          config: { adaptation: "apparel", contentLength: "standard" },
        },
        {
          id: "alternate",
          label: "Different industry / longer copy",
          config: { adaptation: "audio", contentLength: "long" },
        },
      ],
    } as const satisfies DesignComponentDefinition,
    commerceProductionEvidence,
  );
});
