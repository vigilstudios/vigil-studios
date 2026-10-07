import { promoteCollectionSection } from "./collection-promotion";
import type { ProductionEvidence } from "./types";
import {
  serviceContracts,
  serviceDescriptors,
  serviceSectionIds,
} from "../composition/service-contracts";
import type { DesignComponentDefinition } from "./types";
/** Checked evidence is documented in productionization-006/VERIFICATION.md. */
export const serviceProductionEvidence: ProductionEvidence = {
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
    "User Collection 006 ledger (creative); Codex Pass 006 browser and implementation QA",
  approvedAt: "2026-10-01T14:16:00-04:00",
};
export const serviceSections = serviceSectionIds.map((id, index) => {
  const descriptor = serviceDescriptors[index],
    composition = serviceContracts[id];
  return promoteCollectionSection(
    {
      id,
      name: `${descriptor.name} / ${descriptor.id}`,
      sourceConcept: descriptor.id,
      category: "services",
      description: composition.structuralDNA,
      composition,
      styles: ["neutral", "editorial", "technical"],
      pageTypes: ["home", "services", "landing"],
      supportedMotion: composition.motion,
      complexity: [2, 6, 9, 10, 11].includes(index) ? "high" : "medium",
      mobileReady: true,
      accessibilityReady: true,
      responsiveReady: { desktop: true, tablet: true, mobile: true },
      status: "experimental",
      version: "0.6.0",
      defaultCreative: {
        typography: descriptor.typography[0],
        artDirection: composition.artDirections[0],
        motion: [2, 8, 9].includes(index) ? "restrained" : "none",
      },
      configurations: [
        {
          name: "adaptation",
          options: ["professional", "platform", "program"],
        },
        { name: "contentLength", options: ["standard", "long"] },
        { name: "motion", options: composition.motion },
      ],
      previewVariants: [
        {
          id: "default",
          label: "Reviewed mechanism / client content",
          config: {
            adaptation: "professional",
            contentLength: "standard",
            motion: "none",
          },
        },
        {
          id: "alternate",
          label: "Platform / longer copy",
          config: {
            adaptation: "platform",
            contentLength: "long",
            motion: [2, 8, 9].includes(index) ? "media-reveal" : "none",
          },
        },
      ],
    } as const satisfies DesignComponentDefinition,
    serviceProductionEvidence,
  );
});
