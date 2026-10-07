import type { DesignThemeId } from "../foundations/themes";
import type { CreativeCapabilities, ConfigurationConstraint } from "./capabilities";
import type { SectionContract } from "../composition/contracts";

export type ComponentCategory = "primitive" | "navigation" | "hero" | "content" | "motion" | "icon" | "recipe" | "about" | "storytelling" | "services" | "portfolio" | "cta" | "contact" | "footer" | "commerce" | "proof";
export const pageTypes = ["home", "standard", "about", "services-index", "service-detail", "portfolio-index", "project-detail", "shop", "collection", "product-detail", "testimonials", "contact", "blog-index", "article", "landing", "custom", "services", "portfolio", "pricing", "category", "product", "lookbook", "campaign", "search", "results", "customer-stories", "case-studies", "recognition"] as const;
export type PageType = (typeof pageTypes)[number];
export const motionPresetNames = ["none", "fade", "stagger", "mask", "split-text", "parallax", "scroll-scale", "sticky-scroll", "marquee", "magnetic", "depth-shift", "media-reveal", "horizontal-scroll"] as const;
export type MotionPreset = (typeof motionPresetNames)[number];
export const componentStatuses = ["experimental", "review", "production"] as const;
export type ComponentStatus = (typeof componentStatuses)[number];

export type ProductionEvidence = {
  responsive: { desktop: boolean; tablet: boolean; mobile: boolean };
  accessibility: { semantics: boolean; keyboard: boolean; focus: boolean; reducedMotion: boolean };
  performanceReviewed: boolean;
  brandNeutralReviewed: boolean;
  visualDiversityReviewed: boolean;
  approvedBy: string;
  approvedAt: string;
};

export type DesignComponentDefinition = {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  styles: readonly DesignThemeId[];
  pageTypes: readonly PageType[];
  industries?: readonly string[];
  supportedMotion: readonly MotionPreset[];
  complexity: "low" | "medium" | "high";
  mobileReady: boolean;
  accessibilityReady: boolean;
  responsiveReady: { desktop: boolean; tablet: boolean; mobile: boolean };
  status: ComponentStatus;
  version: string;
  configurations: readonly { name: string; options: readonly string[] }[];
  previewVariants: readonly { id: string; label: string; config: Readonly<Record<string, string>> }[];
  productionEvidence?: ProductionEvidence;
  creative?: CreativeCapabilities;
  defaultCreative?: { typography: import("../foundations/typography/profiles").TypographyProfileId; artDirection: import("../foundations/art-direction").ArtDirectionId; motion: import("../foundations/art-direction").MotionDirection };
  motionParameters?: readonly string[];
  constraints?: readonly ConfigurationConstraint[];
  responsiveInvariants?: readonly { field: string; maxWidth: number; reason: string }[];
  composition?: SectionContract;
  sourceConcept?: string;
};
