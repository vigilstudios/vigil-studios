import { navigationHeroEvidence } from "./navigation-hero-expansion";
import { getSectionContract } from "../composition/catalog";
import type { SectionId } from "../composition/schemas";
import type { DesignComponentDefinition } from "./types";

function definition<K extends SectionId>(id: K, name: string, description: string, source: string, geometry?: string) {
  const composition = getSectionContract(id);
  const config: Record<string, string> = { structure: composition.variants[0], motion: "none" };
  const configurations = [{ name: "structure", options: composition.variants }, { name: "motion", options: composition.motion }];
  if (composition.media) {
    configurations.push({ name: "geometry", options: composition.media.geometries }, { name: "tone", options: composition.media.tones });
    config.geometry = geometry ?? composition.media.geometries[0]; config.tone = "natural";
  }
  if (id === "hero.comparison") { configurations.push({ name:"contentAlignment", options:["left","center","right"] }); config.contentAlignment="left"; }
  if (id === "navigation.island") { configurations.push({ name: "placement", options: ["in-flow", "overlay"] }); config.placement = "in-flow"; }
  return {
    id, name, description, category: composition.category, styles: ["neutral", "editorial", "technical"],
    pageTypes: ["home", "landing", "about"], supportedMotion: composition.motion, complexity: "medium",
    mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true },
    status: id === "hero.comparison" ? "production" : "review", version: id === "hero.comparison" ? "1.0.0" : "0.4.0", ...(id === "hero.comparison" ? {productionEvidence:navigationHeroEvidence}:{}), configurations,
    previewVariants: [{ id: "default", label: "Default structure", config }, { id: "alternate", label: "Structural variant", config: { ...config, structure: composition.variants[1] } }],
    composition, sourceConcept: source,
    constraints: id === "navigation.island" ? [{ field: "placement", value: "overlay", when: {}, reason: "Overlay requires a compatible following Hero. Inspect it in Composition; the standalone preview has no Hero." }] : [],
  } as const satisfies DesignComponentDefinition;
}
/** Curated implementations. Review status is not a fabricated human production sign-off. */
export const productionSections = [
  definition("navigation.island", "Floating Island / N01", "Opaque compact island with an anchored, dismissible disclosure.", "N01"),
  definition("navigation.contents", "Contents Sheet / N02", "Editorial contents sheet with native modal navigation semantics.", "N02"),
  definition("hero.front-page", "Publication Masthead / H17", "Masthead above an unequal headline, scene and abstract spread.", "H17"),
  definition("hero.open-circuit", "Signal Baseline / H18", "Authored signal data and proposition share one measured baseline.", "H18"),
  definition("hero.between-acts", "Typographic Interval / H22", "Two bookends surround a low photographic ribbon.", "H22", "panorama"),
  definition("hero.assembly", "Assembly Joint / H24", "Stacked promise, authored exploded parts and a specification joint.", "H24"),
  definition("hero.comparison", "Registered Comparison / H12", "Visitor-controlled matched-image inspection with range, steps and reset.", "H12"),
] as const;
