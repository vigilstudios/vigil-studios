import { getSectionContract } from "../composition/catalog";
import { promoteCollectionSection } from "./collection-promotion";
import type { ProductionEvidence, DesignComponentDefinition } from "./types";

/** This pass's component/browser evidence, independent of earlier collection evidence. */
export const heroFollowupEvidence: ProductionEvidence = {
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
    "User reaffirmed H09/H16 approvals and explicit productization request; Codex implementation/browser QA",
  approvedAt: "2026-10-01T15:00:00-04:00",
};
export const heroFollowupSections = (
  ["hero.object-study", "hero.vertical-record"] as const
).map((id, index) => {
  const contract = getSectionContract(id);
  const entry = {
    id,
    name: index === 0 ? "Object Study / H09" : "The Vertical Record / H16",
    sourceConcept: index === 0 ? "H09" : "H16",
    category: "hero",
    description: contract.structuralDNA,
    composition: contract,
    styles: ["neutral", "editorial", "technical"],
    pageTypes: ["home", "landing", "about"],
    supportedMotion: contract.motion,
    complexity: "medium",
    status: "experimental",
    version: "0.6.0",
    mobileReady: true,
    accessibilityReady: true,
    responsiveReady: { desktop: true, tablet: true, mobile: true },
    defaultCreative: {
      typography: index === 0 ? "luxury" : "fashion",
      artDirection: index === 0 ? "gallery" : "runway",
      motion: index === 0 ? "none" : "restrained",
    },
    configurations: [
      { name: "structure", options: contract.variants },
      { name: "adaptation", options: ["professional", "platform", "program"] },
      { name: "contentLength", options: ["standard", "short", "long"] },
      { name: "motion", options: contract.motion },
      { name: "geometry", options: contract.media!.geometries },
      { name: "tone", options: contract.media!.tones },
    ],
    previewVariants: [
      {
        id: "default",
        label: "Approved structure / client content",
        config: {
          structure: contract.variants[0],
          adaptation: "professional",
          contentLength: "standard",
          motion: "none",
          geometry: "portrait-emphasis",
          tone: "natural",
        },
      },
      {
        id: "alternate",
        label: "Unrelated practice / longer copy",
        config: {
          structure: contract.variants[0],
          adaptation: "platform",
          contentLength: "long",
          motion: index === 0 ? "none" : "media-reveal",
          geometry: "portrait-emphasis",
          tone: "natural",
        },
      },
    ],
  } as const satisfies DesignComponentDefinition;
  return promoteCollectionSection(entry, heroFollowupEvidence);
});
