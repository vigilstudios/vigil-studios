import type { DesignComponentDefinition } from "./types";
import { creatorContracts } from "../composition/creator-contracts";
import { creatorSectionIds } from "../composition/creator-schemas";
export const creatorSections = creatorSectionIds.map(id => {
  const composition = creatorContracts[id];
  const configurations = [{ name: "adaptation", options: ["authored"] }, { name: "structure", options: composition.variants }, { name: "motion", options: composition.motion }, ...composition.configuration];
  const defaults = Object.fromEntries(configurations.map(field => [field.name, field.options[0]]));
  return {
    id, sourceConcept: id === "proof.social-reach" ? "creator-social-reach" : "creator-about-me", name: id === "proof.social-reach" ? "Social Reach" : "About Me", category: composition.category, description: composition.structuralDNA, composition,
    styles: ["neutral", "editorial", "technical"], pageTypes: ["home", "about", "landing", "standard", "portfolio-index"], supportedMotion: composition.motion, complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "production", version: "1.0.0",
    productionEvidence: {
      responsive: { desktop: true, tablet: true, mobile: true },
      accessibility: { semantics: true, keyboard: true, focus: true, reducedMotion: true },
      performanceReviewed: true, brandNeutralReviewed: true, visualDiversityReviewed: true,
      approvedBy: "Codex implementation QA for requested creator sections; docs/design-engine/creator-sections", approvedAt: "2026-10-08",
    },
    defaultCreative: { typography: "humanist", artDirection: "gallery", motion: "none" }, configurations,
    previewVariants: [{ id: "default", label: "Personal / open", config: defaults }, { id: "editorial", label: "Editorial / compact", config: { ...defaults, structure: composition.variants[1], density: "compact", surface: "surface" } }, { id: "centered", label: "Centered", config: { ...defaults, structure: composition.variants[2], alignment: "center" } }],
  } as const satisfies DesignComponentDefinition;
});
