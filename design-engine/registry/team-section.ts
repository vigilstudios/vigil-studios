import { teamContracts, teamConfigurations } from "../composition/team-contract";
import type { DesignComponentDefinition } from "./types";
const defaults = { structure: "cards", motion: "none", ...Object.fromEntries(teamConfigurations.map(field => [field.name, field.options[0]])) };
export const teamSection = {
  id: "about.team", name: "The Team", category: "about", sourceConcept: "customer-team-directory", description: "Employee portraits, roles and biographies connected to the Team tab in Content Hub.", composition: teamContracts["about.team"], styles: ["neutral", "editorial", "technical"], pageTypes: ["home", "about", "standard"], supportedMotion: teamContracts["about.team"].motion, complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "production", version: "1.1.0",
  configurations: [{ name: "structure", options: teamContracts["about.team"].variants }, ...teamConfigurations, { name: "motion", options: teamContracts["about.team"].motion }], previewVariants: [
    { id: "cards", label: "Portrait cards", config: { ...defaults, structure: "cards", motion: "none" } },
    { id: "list", label: "Compact directory", config: { ...defaults, structure: "list", portrait: "circle", density: "compact", motion: "none" } },
    { id: "editorial", label: "Editorial profiles", config: { ...defaults, structure: "editorial", portrait: "landscape", motion: "fade" } },
    { id: "spotlight", label: "Team spotlight", config: { ...defaults, structure: "spotlight", columns: "two", motion: "media-reveal" } },
    { id: "horizontal", label: "Horizontal portrait rail", config: { ...defaults, structure: "cards", flow: "horizontal", portrait: "square", surface: "framed", motion: "stagger" } },
  ],
  productionEvidence: { responsive: { desktop: true, tablet: true, mobile: true }, accessibility: { semantics: true, keyboard: true, focus: true, reducedMotion: true }, performanceReviewed: true, brandNeutralReviewed: true, visualDiversityReviewed: true, approvedBy: "Local implementation QA for the requested optional Team feature; docs/launch/onboarding-team", approvedAt: "2026-11-02" },
} as const satisfies DesignComponentDefinition;
