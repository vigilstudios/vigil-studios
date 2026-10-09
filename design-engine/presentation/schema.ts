import { z } from "zod";
import { coreIconNames } from "../icons/names";
export const buttonShapes = ["square", "soft", "rounded", "pill"] as const;
export const hoverEffects = ["none", "color", "lift", "icon-slide", "underline", "sweep", "glow"] as const;
export const entranceEffects = ["none", "fade", "slide-up", "slide-down", "slide-left", "slide-right", "blur", "zoom", "clip", "blur-slide"] as const;
export const mediaHoverEffects = ["none", "zoom", "pan", "lift", "tilt", "grayscale", "soften"] as const;
export const headingSchema = z.object({
  titleSize: z.number().min(20).max(180).optional(), eyebrowSize: z.number().min(9).max(36).optional(),
  descriptionSize: z.number().min(12).max(36).optional(), bodySize: z.number().min(12).max(30).optional(),
  titleLineHeight: z.number().min(.85).max(1.8).optional(), bodyLineHeight: z.number().min(1.1).max(2.2).optional(),
  eyebrowGap: z.number().min(0).max(100).optional(), descriptionGap: z.number().min(0).max(100).optional(),
  titleWidth: z.number().min(240).max(1600).optional(), descriptionWidth: z.number().min(240).max(1400).optional(),
}).strict();
export const buttonDefaultsSchema = z.object({
  shape: z.enum(buttonShapes).optional(), hover: z.enum(hoverEffects).optional(),
  variant: z.enum(["primary", "secondary", "outline", "ghost", "text", "underline", "inverse"]).optional(),
  size: z.enum(["small", "medium", "large", "display"]).optional(), icon: z.enum(coreIconNames).nullable().optional(),
  iconPosition: z.enum(["leading", "trailing"]).optional(),
}).strict();
export const controlSchema = z.object({
  icon: z.enum(coreIconNames).nullable().optional(), iconPosition: z.enum(["leading","trailing"]).optional(),
  shape: z.enum(buttonShapes).optional(), treatment: z.enum(["filled", "outline", "bare"]).optional(),
  size: z.number().min(32).max(80).optional(), hover: z.enum(hoverEffects).optional(),
  mediaIcon: z.enum(coreIconNames).optional(), previousIcon: z.enum(coreIconNames).optional(), nextIcon: z.enum(coreIconNames).optional(),
}).strict();
export const motionSettingsSchema = z.object({
  entrance: z.enum(entranceEffects).optional(), exit: z.enum(entranceEffects).optional(),
  duration: z.number().min(100).max(3000).optional(), delay: z.number().min(0).max(3000).optional(),
  easing: z.enum(["smooth", "snappy", "linear", "spring"]).optional(), distance: z.number().min(0).max(180).optional(),
  blur: z.number().min(0).max(30).optional(), scale: z.number().min(.65).max(1.3).optional(),
  stagger: z.number().min(0).max(400).optional(), sequence: z.enum(["together", "heading-first", "media-first", "reverse"]).optional(),
  threshold: z.number().min(0).max(.75).optional(), replay: z.boolean().optional(),
  mediaHover: z.enum(mediaHoverEffects).optional(), ctaHover: z.enum(hoverEffects).optional(),
}).strict();
export const viewportSchema = z.object({
  height: z.enum(["natural", "half", "three-quarter", "viewport", "one-and-half", "custom"]).optional(),
  minimum: z.number().min(25).max(250).optional(), padding: z.number().min(0).max(240).optional(),
  alignment: z.enum(["start", "center", "end"]).optional(),
}).strict();
export const presentationSchema = z.object({
  heading: headingSchema.optional(), headingMode: z.enum(["inherit", "override", "original"]).optional(),
  buttons: buttonDefaultsSchema.optional(), controls: controlSchema.optional(),
  motion: motionSettingsSchema.optional(), motionMode: z.enum(["inherit", "override", "none"]).optional(),
  viewport: viewportSchema.optional(),
}).strict();
export type HeadingSettings = z.infer<typeof headingSchema>;
export type PresentationSettings = z.infer<typeof presentationSchema>;
export type MotionSettings = z.infer<typeof motionSettingsSchema>;
export type CTAAnimation = typeof hoverEffects[number];
/** Runtime provenance; never part of serialized presentation settings. */
export type ResolvedPresentation = PresentationSettings & { ctaAnimationOverride?: CTAAnimation };
export function sectionCTAAnimation(value?: PresentationSettings): CTAAnimation | undefined {
  return value?.motionMode === "none" ? "none" : value?.motionMode === "override" ? value.motion?.ctaHover : undefined;
}
export function resolvePresentation(site?: PresentationSettings, page?: PresentationSettings, section?: PresentationSettings): ResolvedPresentation {
  const defined = <T extends object>(value?: T): Partial<T> => Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined)) as Partial<T>;
  const merge = <K extends "heading" | "buttons" | "controls" | "motion" | "viewport">(key: K) => ({ ...defined(site?.[key]), ...defined(page?.[key]), ...defined(section?.[key]) });
  const parentHeading = { ...defined(site?.heading), ...defined(page?.heading) };
  const parentMotion = { ...defined(site?.motion), ...defined(page?.motion) };
  return {
    heading: section?.headingMode === "original" ? undefined : section?.headingMode === "override" ? merge("heading") : parentHeading,
    headingMode: section?.headingMode,
    buttons: merge("buttons"), controls: merge("controls"), viewport: merge("viewport"),
    motion: section?.motionMode === "none" ? { ...parentMotion, entrance: "none", exit: "none", mediaHover: "none", ctaHover: "none", stagger: 0 } : section?.motionMode === "override" ? merge("motion") : parentMotion,
    motionMode: section?.motionMode,
    ctaAnimationOverride: sectionCTAAnimation(section),
  };
}
