import type { TypographyProfileId } from "../foundations/typography/profiles";
import type { ArtDirectionId } from "../foundations/art-direction";

/** Approved structural navigation vocabulary. Shared by strict section schemas and registry capabilities. */
export type Alignment = "left" | "center" | "right" | "split";
export type Position = "flow" | "overlay" | "floating" | "edge";
export type ScrollBehavior =
  | "static"
  | "sticky"
  | "compact"
  | "reveal"
  | "solidify";
export type NavigationArchitecture = {
  id: string;
  name: string;
  dna: string;
  scale: "small" | "standard" | "complex";
  destinations: readonly [number, number];
  nested: boolean;
  supportedAlignments: {
    brand: readonly Alignment[];
    primary: readonly Alignment[];
    actions: readonly Alignment[];
  };
  positions: readonly Position[];
  backgrounds: readonly ("solid" | "scrim")[];
  contrasts: readonly ("brand" | "light-on-dark" | "dark-on-light")[];
  densities: readonly ("comfortable" | "compact")[];
  utilities: readonly (
    | "cta"
    | "search"
    | "account"
    | "cart"
    | "locale"
    | "utility-links"
  )[];
  scroll: readonly ScrollBehavior[];
  desktop: string;
  mobile: string;
  expansion: string;
  constraints: string;
  motion: string;
  typography: readonly [
    TypographyProfileId,
    TypographyProfileId,
    TypographyProfileId,
  ];
  art: readonly [ArtDirectionId, ArtDirectionId, ArtDirectionId];
  floating?: {
    dockStyle: readonly ("capsule" | "frame" | "glass" | "segmented")[];
    dockAlignment: readonly ("left" | "center" | "right")[];
    dockWidth: readonly ("compact" | "wide")[];
    dockOffset: readonly ("close" | "relaxed")[];
    priorityLinks: readonly ("none" | "two" | "three")[];
  };
  shortlist?: string;
};
export type NavigationConfig = {
  brand: Alignment;
  primary: Alignment;
  actions: Alignment;
  position: Position;
  background: "solid" | "scrim";
  contrast: "brand" | "light-on-dark" | "dark-on-light";
  density: "comfortable" | "compact";
  scroll: ScrollBehavior;
  cta: boolean;
  utilities: boolean;
  heroContrast: "brand" | "light-on-dark" | "dark-on-light";
  dockStyle: "capsule" | "frame" | "glass" | "segmented";
  dockAlignment: "left" | "center" | "right";
  dockWidth: "compact" | "wide";
  dockOffset: "close" | "relaxed";
  priorityLinks: "none" | "two" | "three";
};
