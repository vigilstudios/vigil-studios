import { creatorContracts } from "./creator-contracts";
import { getActionCapabilities } from "../actions/capabilities";
import type { SectionContract } from "./contracts";
export const teamConfigurations = [
  { name: "flow", options: ["grid", "horizontal"] },
  { name: "columns", options: ["two", "three", "four"] },
  { name: "density", options: ["open", "compact"] },
  { name: "surface", options: ["transparent", "surface", "framed"] },
  { name: "alignment", options: ["left", "center"] },
  { name: "portrait", options: ["portrait", "square", "circle", "landscape"] },
  { name: "biography", options: ["visible", "hidden"] },
] as const;
export const teamContracts = {
  "about.team": {
    ...creatorContracts["about.creator-profile"], actions: getActionCapabilities("about.team"),
    contentSchema: "about.team", mediaSchema: "optional-member-portraits",
    structuralDNA: "A Content Hub employee directory with portrait cards, a compact directory, editorial rows or a lead profile. Layout, horizontal flow, portrait geometry, density and framing are independent.",
    variants: ["cards", "list", "editorial", "spotlight"], configuration: teamConfigurations,
    motion: ["none", "fade", "stagger", "mask", "media-reveal"], motionIntensities: ["none", "restrained", "expressive"], overrides: ["typography", "artDirection", "motion"],
    itemRange: { min: 0, max: 50, unit: "team members" },
    contentConstraints: "Up to 50 uniquely identified members; name required, role/bio/portrait optional. Hiding biographies changes presentation only; empty teams render no section.",
    mediaRequirements: "Optional employee portraits with intrinsic dimensions, alt text and focal points. Initials replace absent photos.",
    interactionCapabilities: ["horizontal-scroll", "section-action"], usage: "section-oriented",
    accessibility: { ...creatorContracts["about.creator-profile"].accessibility, keyboard: "Native focusable horizontal track and labelled previous/next controls; profiles remain in document reading order.", reducedMotion: "Shared motion policy disables reveals and smooth scrolling. All profiles remain available." },
  },
} as const satisfies Record<string, SectionContract>;
