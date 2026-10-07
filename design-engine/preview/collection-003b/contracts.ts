import type { TypographyProfileId } from "../../foundations/typography/profiles";
import type { ArtDirectionId } from "../../foundations/art-direction";

/** Lab-only proposal. No production registry or route-generation changes. */
export type Alignment = "left" | "center" | "right" | "split";
export type Position = "flow" | "overlay" | "floating" | "edge";
export type ScrollBehavior = "static" | "sticky" | "compact" | "reveal" | "solidify";
export type NavigationStudy = {
  id: string; name: string; status: "experimental"; review: "approved"; dna: string; scale: "small" | "standard" | "complex";
  destinations: readonly [number, number]; nested: boolean;
  supportedAlignments: { brand: readonly Alignment[]; primary: readonly Alignment[]; actions: readonly Alignment[] };
  positions: readonly Position[]; backgrounds: readonly ("solid" | "scrim")[];
  contrasts: readonly ("brand" | "light-on-dark" | "dark-on-light")[];
  densities: readonly ("comfortable" | "compact")[];
  utilities: readonly ("cta" | "search" | "account" | "cart" | "locale" | "utility-links")[];
  scroll: readonly ScrollBehavior[];
  desktop: string; mobile: string; expansion: string; constraints: string; motion: string;
  typography: readonly [TypographyProfileId, TypographyProfileId, TypographyProfileId];
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
export type NavigationConfig = { brand: Alignment; primary: Alignment; actions: Alignment; position: Position; background: "solid" | "scrim"; contrast: "brand" | "light-on-dark" | "dark-on-light"; density: "comfortable" | "compact"; scroll: ScrollBehavior; cta: boolean; utilities: boolean; heroContrast: "brand" | "light-on-dark" | "dark-on-light"; dockStyle: "capsule" | "frame" | "glass" | "segmented"; dockAlignment: "left" | "center" | "right"; dockWidth: "compact" | "wide"; dockOffset: "close" | "relaxed"; priorityLinks: "none" | "two" | "three" };
export const productionHeroOptions = ["hero.statement", "hero.front-page", "hero.open-circuit", "hero.comparison", "hero.vertical-record", "hero.between-acts", "hero.assembly", "hero.object-study"] as const;
export type ProductionHeroContext = typeof productionHeroOptions[number];
export const heroOptions = [...productionHeroOptions,"hero.full-scene","hero.scene-poster"] as const;
export type HeroContext = typeof heroOptions[number];
export function defaultConfig(s: NavigationStudy): NavigationConfig {
  return { brand: s.supportedAlignments.brand[0], primary: s.supportedAlignments.primary[0], actions: s.supportedAlignments.actions[0], position: s.positions[0], background: s.backgrounds[0], contrast: s.contrasts[0], density: s.densities[0], scroll: s.scroll[0], cta: s.utilities.includes("cta"), utilities: true, heroContrast: "brand", dockStyle: "capsule", dockAlignment: "center", dockWidth: "compact", dockOffset: "close", priorityLinks: "none" };
}
/** Shared pure contract for a future Composition inspector. Singletons are structural invariants, not controls. */
export function navigationControls(s: NavigationStudy) {
  return { ...s.supportedAlignments, position: s.positions, background: s.backgrounds, contrast: s.contrasts, density: s.densities, scroll: s.scroll, ...(s.floating ?? {}) };
}
export function configurationIssues(s: NavigationStudy, c: NavigationConfig, hero: HeroContext): string[] {
  const issues: string[] = [];
  for (const [key, options] of Object.entries(navigationControls(s))) if (!(options as readonly string[]).includes(c[key as keyof NavigationConfig] as string)) issues.push(`Unsupported ${key}.`);
  if (c.cta && !s.utilities.includes("cta")) issues.push("CTA slot is unavailable.");
  if (!heroOptions.includes(hero)) issues.push("Unknown Hero context.");
  if (!["brand", "light-on-dark", "dark-on-light"].includes(c.heroContrast)) issues.push("Unsupported Hero text contrast.");
  if (c.scroll === "solidify" && c.position === "flow") issues.push("Hero-centric navigation overlays the Hero; choose overlay placement.");
  return issues;
}
export function validChoices<K extends keyof ReturnType<typeof navigationControls>>(s: NavigationStudy, c: NavigationConfig, hero: HeroContext, key: K) {
  return (navigationControls(s)[key] ?? []).filter(value => !configurationIssues(s, updateNavigationConfig(c, { [key]: value }), hero).length);
}
/** Hero-centric behavior changes surface ownership, never a floater's placement or footprint. */
export function updateNavigationConfig(c: NavigationConfig, patch: Partial<NavigationConfig>): NavigationConfig {
 const next={...c,...patch};
 if(patch.scroll==="solidify" && next.position==="flow")next.position="overlay";
 if(patch.position==="flow" && next.scroll==="solidify")next.scroll="sticky";
 return next;
}


export function navigationChoiceLabel(key: string, value: string): string {
 if(key==="scroll")return ({static:"Static",sticky:"Sticky",reveal:"Reveal on upward scroll",solidify:"Hero-centric · transparent → solid",compact:"Compact on scroll"} as Record<string,string>)[value]??value;
 if(key==="dockStyle")return ({capsule:"Capsule",frame:"Architectural frame",glass:"Soft glass",segmented:"Segmented dock"} as Record<string,string>)[value]??value;
 return value;
}
