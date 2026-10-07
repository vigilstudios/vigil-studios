import type { ArtDirectionId, MotionDirection } from "../foundations/art-direction";
import type { TypographyProfileId } from "../foundations/typography/profiles";
import { artIds, typographyIds } from "../composition/schemas";
import type { SectionContract } from "../composition/contracts";
import type { DesignComponentDefinition } from "./types";

export type LayerCapability<T extends string> = { values: readonly T[]; reason: string };
export type CreativeCapabilities = {
  typography: LayerCapability<TypographyProfileId>;
  artDirection: LayerCapability<ArtDirectionId>;
  motion: LayerCapability<MotionDirection>;
};
export type ConfigurationConstraint = {
  field: string; value: string; when: { artDirections?: readonly ArtDirectionId[]; maxWidth?: number; motion?: readonly MotionDirection[] };
  reason: string;
};
export const typeCapability = { values: typographyIds, reason: "Semantic type roles change; structural measures and reading order remain fixed." };
export const artCapability = { values: artIds, reason: "Changes consumed rhythm, gaps, framing or actions; never replaces structural DNA." };
export const staticMotion = { values: ["none"] as const, reason: "Fixed: no entrance or continuous motion. Global motion remains independent and may affect other sections. Native interaction remains available." };
const fixedType = { values: [], reason: "This mechanism does not own typography; specimen content inherits its parent's roles." } as const;
const fixedArt = { values: [], reason: "Fixed structural mechanism; art direction does not alter it. Specimen content is illustrative." } as const;
export const animatedMotion = { values: ["none", "restrained", "expressive"] as const, reason: "None rests immediately; restrained reduces distance/timing and expressive increases them. OS reduced motion always wins." };
const spatial = { typography: fixedType, artDirection: artCapability, motion: staticMotion };
const text = { typography: typeCapability, artDirection: fixedArt, motion: staticMotion };
const surface = { typography: fixedType, artDirection: artCapability, motion: staticMotion };
/** Authoritative foundation capabilities. Sections instead use their composition contract. */
export const foundationCapabilities = {
  "primitive.button": { typography: { values: ["editorial", "neo-grotesk", "geometric", "brutalist"], reason: "Fixed button size/weight; these four profiles provide the four distinct body families it consumes. Other profiles repeat a family here." }, artDirection: { values: ["publication", "precision", "billboard", "salon"], reason: "Line, compact block, graphic block or pill. Gallery and Runway duplicate Publication for this action." }, motion: staticMotion },
  "primitive.container": { ...spatial, artDirection: { values: ["gallery", "publication", "precision", "billboard", "salon"], reason: "Gutter changes the usable measure. Runway duplicates Publication for this container." } },
  "primitive.section": spatial,
  "primitive.stack": spatial,
  "primitive.grid": spatial,
  "primitive.heading": text,
  "primitive.text": text,
  "primitive.link": text,
  "primitive.badge": { ...text, artDirection: { values: ["publication", "billboard"], reason: "Only the border weight changes; pill geometry is fixed. Other directions duplicate the thin-border state." } },
  "primitive.card": { ...surface, artDirection: { values: ["publication", "precision", "gallery", "salon"], reason: "Four distinct surface radii. Runway duplicates Publication; Billboard duplicates it on flat cards." } },
  "primitive.media-frame": surface,
  "primitive.media": { typography: fixedType, artDirection: fixedArt, motion: staticMotion },
  "primitive.divider": { ...surface, artDirection: { values: ["publication", "billboard"], reason: "Thin or graphic border weight; other directions are equivalent for this rule." } },
  "icon.core": { typography: fixedType, artDirection: fixedArt, motion: staticMotion },
} as const satisfies Record<string, CreativeCapabilities>;
export function motionCapabilities(preset: string): CreativeCapabilities {
  return { typography: preset === "split-text" ? typeCapability : fixedType, artDirection: fixedArt,
    motion: preset === "horizontal-scroll" || preset === "sticky-scroll"
      ? { values: ["none", "restrained"], reason: "Binary behavior: still/native instant versus native smooth scrolling or pinning. No distinct expressive intensity is implemented. Narrow artboards release pinning." }
      : animatedMotion };
}
export function sectionCreativeCapabilities(contract: SectionContract, behavior: string, structure?: string): CreativeCapabilities {
  return {
    typography: { values: contract.typography.profiles, reason: contract.typography.behavior },
    artDirection: { values: (structure && contract.artDirectionChoices?.[structure]) || contract.artDirections, reason: contract.artBehavior },
    motion: behavior === "none" ? staticMotion : { values: contract.motionIntensities, reason: animatedMotion.reason },
  };
}
export function componentCapabilities(entry: DesignComponentDefinition, config: Readonly<Record<string, string>>): CreativeCapabilities {
  if (entry.composition) return sectionCreativeCapabilities(entry.composition, config.motion ?? "none", config.structure);
  if (!entry.creative) throw new Error(`Missing creative capabilities: ${entry.id}`);
  return entry.creative;
}
/** A preset's behavior constrains its initial intensity independently of the component's reveal defaults. */
export function componentDefaultLayers(entry: DesignComponentDefinition, config: Readonly<Record<string, string>>) {
  const defaults = entry.defaultCreative;
  if (!defaults) return undefined;
  const allowed = componentCapabilities(entry, config).motion.values;
  return { ...defaults, motion: allowed.includes(defaults.motion) ? defaults.motion : allowed[0] };
}
export function configurationReason(entry: DesignComponentDefinition, field: string, value: string, context: { artDirection?: string; width?: number; motion?: string }): string | undefined {
  return entry.constraints?.find(rule => rule.field === field && rule.value === value
    && (!rule.when.artDirections || rule.when.artDirections.some(art => art === context.artDirection))
    && (!rule.when.maxWidth || (context.width !== undefined && context.width <= rule.when.maxWidth))
    && (!rule.when.motion || rule.when.motion.some(motion => motion === context.motion)))?.reason;
}
export function previewCapabilityIssues(entry: DesignComponentDefinition, config: Readonly<Record<string, string>>, layers: { typography?: string; artDirection?: string; motion?: string }, width?: number): string[] {
  const caps = componentCapabilities(entry, config), issues: string[] = [];
  for (const key of ["typography", "artDirection", "motion"] as const) {
    const value = layers[key];
    if (value && !(caps[key].values as readonly string[]).includes(value)) issues.push(`${key}: ${value} is unavailable. ${caps[key].reason}`);
  }
  for (const [field, value] of Object.entries(config)) {
    const reason = configurationReason(entry, field, value, { ...layers, width });
    if (reason) issues.push(`${field}: ${reason}`);
  }
  return issues;
}
