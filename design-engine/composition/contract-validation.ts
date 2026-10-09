import { z } from "zod";
import { typeRoles } from "../foundations/typography/types";
import { coreIconNames } from "../icons/names";
import { mediaGeometries, mediaTones } from "../media/types";
import { motionLanguages, artIds, typographyIds } from "./schemas";
import { motionPresetNames } from "../registry/types";
const strings = z.array(z.string().min(1)).min(1);
const presentation = z.object({ shape: strings.optional(), hover: strings.optional(), variant: strings.optional(), size: strings.optional(), alignment: strings.optional(), width: strings.optional(), surface: strings.optional(), icon: strings.optional(), iconPosition: strings.optional() }).strict();
const contractSchema = z.object({
 actions: z.object({classification:z.enum(["no-action","section-primary-action","section-primary-secondary-actions","per-item-action","mixed-action"]),reason:z.string().min(1),primary:presentation.optional(),secondary:presentation.optional(),items:z.array(z.object({group:z.string().min(1),label:z.string().min(1),path:strings,identity:z.enum(["id","productId"]),displays:z.array(z.enum(["link","media","whole-item"])).min(1),presentation}).strict())}).strict().optional(),
 configuration:z.array(z.object({name:z.string().min(1),options:strings}).strict()).optional(),
 navigation:z.object({scale:z.enum(["small","standard","complex"]),nested:z.boolean(),maxDepth:z.number().int().positive().nullable(),supportedAlignments:z.object({brand:strings,primary:strings,actions:strings}).strict(),positions:strings,backgrounds:strings,contrasts:strings,densities:strings,utilities:z.array(z.string()),scroll:strings,floating:z.object({dockStyle:strings,dockAlignment:strings,dockWidth:strings,dockOffset:strings,priorityLinks:strings}).strict().optional()}).strict().optional(),
  contact:z.object({modes:strings,form:z.boolean(),booking:z.boolean(),social:z.boolean(),submission:z.literal("host-or-email-draft")}).strict().optional(),
  footer:z.object({navigationDepth:z.enum(["configurable","top-level"]),sitemap:z.boolean(),social:z.boolean(),contact:z.boolean(),newsletter:z.boolean(),globalSite:z.boolean()}).strict().optional(),
  evidence:z.object({model:z.string().min(1),scale:z.enum(["single","small","moderate","large"]),idealRange:z.object({min:z.number().int().positive(),max:z.number().int().positive()}).strict().optional(),integrity:z.string().min(1)}).strict().optional(),
  category: z.enum(["navigation", "hero", "content", "about", "storytelling", "services", "portfolio", "cta", "contact", "footer", "commerce", "proof"]),
  usage: z.enum(["section-oriented", "page-capable", "section-and-page-capable", "product-detail-building-block", "global-site-component"]).optional(),
  commerce: z.object({merchandisingIntent:z.string().min(1),catalogScale:z.array(z.enum(["boutique","medium","large"])).min(1),productDetail:z.array(z.enum(["media","options","storytelling","specifications","related-products"])),providerBoundary:z.literal("normalized-presentation")}).strict().optional(),
  supportedContentTypes: z.array(z.enum(["service","offering","feature","capability","competency","benefit","discipline"])).min(1).optional(),
  itemRange: z.object({min:z.number().int().nonnegative(),max:z.number().int().positive(),unit:z.string().min(1)}).strict().refine(v=>v.max>=v.min).optional(),
  interactionCapabilities: strings.optional(),
  contentConstraints: z.string().min(1).optional(), mediaRequirements: z.string().min(1).optional(),
  contentSchema: z.string().min(1), mediaSchema: z.string().min(1).nullable(), structuralDNA: z.string().min(1), variants: strings,
  typography: z.object({ profiles: z.array(z.enum(typographyIds)).min(1), roles: z.array(z.enum(typeRoles)).min(1), behavior: z.string().min(1) }).strict(),
  artDirectionChoices: z.record(z.array(z.enum(artIds)).min(1)).optional(),
  artBehavior: z.string().min(1), motionIntensities: z.array(z.enum(motionLanguages)).min(1),
  artDirections: z.array(z.enum(artIds)).min(1), motion: z.array(z.enum(motionPresetNames)).min(1),
  overrides: z.array(z.enum(["typography", "artDirection", "motion"])), icons: z.array(z.enum(coreIconNames)),
  media: z.object({ geometries: z.array(z.enum(mediaGeometries)).min(1), tones: z.array(z.enum(mediaTones)).min(1) }).strict().nullable(),
  compatibility: z.object({
    flow: z.object({ surface: z.enum(["inherited","dark-room"]), bleed: z.enum(["inset","full"]), scrolling: z.enum(["document","horizontal-region"]), sticky: z.boolean(), density: z.enum(["dense","open"]).optional() }).strict().optional(),
    navigation: z.object({ placements: z.array(z.enum(["in-flow", "overlay"])).min(1), covers: z.array(z.enum(["surface", "light-media", "dark-media"])).min(1) }).strict().optional(),
    hero: z.object({ surface: z.enum(["surface", "light-media", "dark-media"]), overlaySafeZone: z.boolean(), requiresOverlayNavigation: z.boolean().optional() }).strict().optional(),
    exclusions: z.array(z.object({ structure: z.string(), motion: z.enum(motionPresetNames), reason: z.string().min(1) }).strict()).optional(),
  }).strict(),
  responsive: z.object({ desktop: z.string().min(1), tablet: z.string().min(1), mobile: z.string().min(1), readingOrder: strings }).strict(),
  accessibility: z.object({ landmark: z.enum(["navigation", "section", "footer"]), heading: z.enum(["h1", "h2"]).nullable(), keyboard: z.string().min(1), reducedMotion: z.string().min(1), contrast: z.string().min(1) }).strict(),
}).strict();
export function validateSectionContract(input: unknown): string[] {
  const result = contractSchema.safeParse(input);
  if (!result.success) return result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`);
  const c = result.data, errors: string[] = [];
  if (c.compatibility.flow?.sticky && !c.motion.some(m=>m === "sticky-scroll" || m === "horizontal-scroll")) errors.push("Sticky flow requires an implemented scroll behavior.");
  if (c.media && !c.mediaSchema) errors.push("Image treatments need a media schema.");
  if (new Set(c.variants).size !== c.variants.length) errors.push("Structural variants must be unique.");
  if (c.compatibility.navigation && c.category !== "navigation") errors.push("Navigation capabilities require navigation category.");
  if (c.compatibility.hero && c.category !== "hero") errors.push("Hero capabilities require hero category.");
  for (const [variant, choices] of Object.entries(c.artDirectionChoices ?? {})) { if (!c.variants.includes(variant) || choices.some(choice => !c.artDirections.includes(choice))) errors.push("Art direction choices must reference a supported variant and direction."); }
  c.compatibility.exclusions?.forEach(rule => { if (!c.variants.includes(rule.structure) || !c.motion.includes(rule.motion)) errors.push("Exclusions must reference supported structure and motion."); });
  return errors;
}

const layer = <T extends readonly [string, ...string[]]>(ids: T) => z.object({ values: z.array(z.enum(ids)), reason: z.string().min(1) }).strict();
const creativeSchema = z.object({ typography: layer(typographyIds), artDirection: layer(artIds), motion: layer(motionLanguages) }).strict();
export function validateCreativeCapabilities(input: unknown): string[] {
  const result = creativeSchema.safeParse(input);
  if (!result.success) return result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`);
  return Object.entries(result.data).flatMap(([key, value]) => new Set(value.values).size !== value.values.length ? [`${key} repeats an effective choice.`] : []);
}
