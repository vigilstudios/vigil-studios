import type { MotionDirection, ArtDirectionId } from "../foundations/art-direction";
import type { TypographyProfileId } from "../foundations/typography/profiles";
import type { TypeRole } from "../foundations/typography/types";
import type { VigilIconName } from "../icons/names";
import type { MediaGeometry, MediaTone } from "../media/types";
import type { MotionPreset } from "../registry/types";
import type { CreativeOverrides } from "./schemas";

export type SectionCategory = "navigation" | "hero" | "content" | "about" | "storytelling" | "services" | "portfolio" | "cta" | "contact" | "footer" | "commerce" | "proof";
export type SectionContract = {
  actions?: import("../actions/capabilities").ActionCapabilities;
  configuration?: readonly {name:string;options:readonly string[]}[];
  navigation?: Pick<import("../navigation/types").NavigationArchitecture,"scale"|"nested"|"supportedAlignments"|"positions"|"backgrounds"|"contrasts"|"densities"|"utilities"|"scroll"|"floating"> & { maxDepth: number | null };

  contact?: { modes: readonly string[]; form: boolean; booking: boolean; social: boolean; submission: "host-or-email-draft" };
  footer?: { navigationDepth: "configurable" | "top-level"; sitemap: boolean; social: boolean; contact: boolean; newsletter: boolean; globalSite: boolean };
  evidence?: { model:string; scale:"single"|"small"|"moderate"|"large"; idealRange?:{min:number;max:number}; integrity:string };
  category: SectionCategory;
  usage?: "section-oriented" | "page-capable" | "section-and-page-capable" | "product-detail-building-block" | "global-site-component";
  commerce?: { merchandisingIntent:string; catalogScale:readonly ("boutique"|"medium"|"large")[]; productDetail:readonly ("media"|"options"|"storytelling"|"specifications"|"related-products")[]; providerBoundary:"normalized-presentation" };
  supportedContentTypes?: readonly ("service" | "offering" | "feature" | "capability" | "competency" | "benefit" | "discipline")[];
  itemRange?: { min: number; max: number; unit: string };
  interactionCapabilities?: readonly string[];
  contentConstraints?: string;
  mediaRequirements?: string;
  contentSchema: string; mediaSchema: string | null;
  structuralDNA: string; variants: readonly string[];
  typography: { profiles: readonly TypographyProfileId[]; roles: readonly TypeRole[]; behavior: string };
  artDirections: readonly ArtDirectionId[];
  artBehavior: string;
  artDirectionChoices?: Readonly<Record<string, readonly ArtDirectionId[]>>;
  motionIntensities: readonly MotionDirection[];
  motion: readonly MotionPreset[];
  overrides: readonly (keyof CreativeOverrides)[];
  media: { geometries: readonly MediaGeometry[]; tones: readonly MediaTone[] } | null;
  icons: readonly VigilIconName[];
  compatibility: {
    flow?: { surface: "inherited" | "dark-room"; bleed: "inset" | "full"; scrolling: "document" | "horizontal-region"; sticky: boolean; density?: "dense" | "open"; };
    navigation?: { placements: readonly ("in-flow" | "overlay")[]; covers: readonly ("surface" | "light-media" | "dark-media")[] };
    hero?: { surface: "surface" | "light-media" | "dark-media"; overlaySafeZone: boolean; requiresOverlayNavigation?: boolean };
    exclusions?: readonly { structure: string; motion: MotionPreset; reason: string }[];
  };
  responsive: { desktop: string; tablet: string; mobile: string; readingOrder: readonly string[] };
  accessibility: { landmark: "navigation" | "section" | "footer" | "commerce" | "proof"; heading: "h1" | "h2" | null; keyboard: string; reducedMotion: string; contrast: string };
};
