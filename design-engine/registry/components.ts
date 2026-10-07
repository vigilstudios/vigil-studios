import { endingSections } from "./ending-sections";
import { importSections } from "./import-sections";
import { navigationHeroSections } from "./navigation-hero-expansion";
import { evidenceSections } from "./evidence-sections";
import { commerceSections } from "./commerce-sections";
import { heroFollowupSections } from "./hero-followup";
import { serviceSections } from "./service-sections";
import { foundationCapabilities, motionCapabilities } from "./capabilities";
import type { DesignComponentDefinition, ComponentCategory, PageType } from "./types";
import { iconFoundation, motionFoundations, primitiveFoundations } from "./foundations";
import { assertValidDesignRegistry } from "./validation";
import { collectionSections } from "./collection-sections";
import { storySections } from "./story-sections";
import { productionSections } from "./production-sections";
import { sectionContracts } from "../composition/catalog";

const allStyles = ["neutral", "editorial", "technical"] as const;

/** Serializable catalog. Preview implementation belongs in preview/render.tsx. */
export const designComponents = [
  {
    id: "primitive.button", creative: foundationCapabilities["primitive.button"], constraints: [{ field: "variant", value: "outline", when: { artDirections: ["gallery", "publication", "runway"] }, reason: "Line actions have one emphasis. Use solid for the line treatment, or choose a block/pill direction for outline." }], name: "Action Button", category: "primitive",
    description: "Semantic button or link with token-driven emphasis and size.",
    styles: allStyles, pageTypes: ["home", "about", "services", "contact", "landing"], supportedMotion: ["none"],
    complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "variant", options: ["solid", "outline"] }, { name: "size", options: ["compact", "comfortable"] }],
    previewVariants: [
      { id: "solid", label: "Solid", config: { variant: "solid", size: "comfortable" } },
      { id: "outline", label: "Outline", config: { variant: "outline", size: "comfortable" } },
    ],
  },
  {
    id: "primitive.container", creative: foundationCapabilities["primitive.container"], name: "Content Container", category: "primitive",
    description: "Fluid inset with a theme-controlled wide or reading measure.",
    styles: allStyles, pageTypes: ["home", "about", "services", "portfolio", "pricing", "contact", "landing"], supportedMotion: ["none"],
    complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "width", options: ["wide", "reading"] }],
    previewVariants: [
      { id: "wide", label: "Wide", config: { width: "wide" } },
      { id: "reading", label: "Reading", config: { width: "reading" } },
    ],
  },
  {
    id: "navigation.primary", name: "Primary Navigation", category: "navigation",
    composition: sectionContracts["navigation.primary"],
    description: "Responsive navigation with a keyboard-operable mobile disclosure and optional action.",
    styles: allStyles, pageTypes: ["home", "about", "services", "portfolio", "pricing", "contact", "landing"], supportedMotion: ["none"],
    complexity: "medium", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "density", options: ["compact", "comfortable"] }, { name: "action", options: ["present", "absent"] }],
    previewVariants: [
      { id: "comfortable", label: "Comfortable", config: { density: "comfortable", action: "present" } },
      { id: "compact", label: "Compact", config: { density: "compact", action: "absent" } },
    ],
  },
  {
    id: "hero.statement", name: "Statement Hero", category: "hero",
    composition: sectionContracts["hero.statement"],
    description: "Typographic introduction with alignment, emphasis, action, and optional reveal.",
    styles: allStyles, pageTypes: ["home", "landing", "about"], supportedMotion: ["none", "fade"],
    complexity: "medium", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "alignment", options: ["start", "center"] }, { name: "emphasis", options: ["quiet", "strong"] }, { name: "motion", options: ["none", "fade"] }],
    previewVariants: [
      { id: "quiet", label: "Quiet / start", config: { alignment: "start", emphasis: "quiet", motion: "none" } },
      { id: "strong", label: "Strong / center", config: { alignment: "center", emphasis: "strong", motion: "fade" } },
    ],
  },
  {
    id: "content.feature-list", name: "Feature List", category: "content",
    composition: sectionContracts["content.feature-list"],
    description: "A flexible set of content cards with grid or list flow and optional stagger.",
    styles: allStyles, pageTypes: ["home", "about", "services", "landing"], supportedMotion: ["none", "stagger"],
    complexity: "medium", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "layout", options: ["grid", "list"] }, { name: "motion", options: ["none", "stagger"] }],
    previewVariants: [
      { id: "grid", label: "Grid", config: { layout: "grid", motion: "none" } },
      { id: "list", label: "List / stagger", config: { layout: "list", motion: "stagger" } },
    ],
  },
  {
    id: "motion.fade", creative: motionCapabilities("fade"), motionParameters: ["distance", "duration"], name: "Fade Reveal", category: "motion",
    description: "One-time viewport entrance with distance and duration controls; reduced motion resolves immediately.",
    styles: allStyles, pageTypes: ["home", "about", "services", "landing"], supportedMotion: ["fade"],
    complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "distance", options: ["12px", "32px"] }, { name: "duration", options: ["0.4s", "0.8s"] }],
    previewVariants: [
      { id: "short", label: "Short", config: { distance: "12px", duration: "0.4s" } },
      { id: "long", label: "Long", config: { distance: "32px", duration: "0.8s" } },
    ],
  },
  {
    id: "motion.stagger", creative: motionCapabilities("stagger"), motionParameters: ["interval"], name: "Stagger Reveal", category: "motion",
    description: "A grouped viewport entrance with configurable intervals and a reduced-motion fallback.",
    styles: allStyles, pageTypes: ["home", "about", "services", "landing"], supportedMotion: ["stagger"],
    complexity: "low", mobileReady: true, accessibilityReady: true, responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.1.0",
    configurations: [{ name: "interval", options: ["0.08s", "0.2s"] }],
    previewVariants: [
      { id: "tight", label: "Tight", config: { interval: "0.08s" } },
      { id: "relaxed", label: "Relaxed", config: { interval: "0.2s" } },
    ],
  },
  ...primitiveFoundations,
  ...motionFoundations,
  iconFoundation,
  ...productionSections,
  ...navigationHeroSections,
  ...heroFollowupSections,
  ...storySections,
  ...collectionSections,
  ...serviceSections,
  ...commerceSections,
  ...evidenceSections,
  ...importSections,
  ...endingSections,
] as const satisfies readonly DesignComponentDefinition[];

assertValidDesignRegistry(designComponents);

export type DesignComponentId = (typeof designComponents)[number]["id"];
export const componentCategories: readonly ComponentCategory[] = ["primitive", "navigation", "hero", "content", "motion", "icon", "recipe", "about", "storytelling", "services", "portfolio", "cta", "contact", "footer", "commerce"];

export function getDesignComponent(id: string): (typeof designComponents)[number] | undefined {
  return designComponents.find((component) => component.id === id);
}

export function findDesignComponents(filters: { query?: string; category?: ComponentCategory; pageType?: PageType; status?: DesignComponentDefinition["status"] } = {}) {
  const query = filters.query?.trim().toLowerCase();
  return designComponents.filter((component) => {
    if (filters.category && component.category !== filters.category) return false;
    if (filters.status && component.status !== filters.status) return false;
    if (filters.pageType && !(component.pageTypes as readonly PageType[]).includes(filters.pageType)) return false;
    return !query || `${component.id} ${component.name} ${component.description}`.toLowerCase().includes(query);
  });
}
