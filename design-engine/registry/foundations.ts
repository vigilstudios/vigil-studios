import { foundationCapabilities, motionCapabilities } from "./capabilities";
import { coreIconNames } from "../icons/names";
import type { DesignComponentDefinition, MotionPreset } from "./types";

const styles = ["neutral", "editorial", "technical"] as const;
const pages = ["home", "about", "services", "portfolio", "pricing", "contact", "landing"] as const;

const primitiveSpecs = [
  { id: "primitive.section", name: "Section", description: "Semantic section with surface and rhythm choices.", configurations: [{ name: "tone", options: ["background", "surface", "elevated"] }, { name: "spacing", options: ["compact", "regular"] }], previewVariants: [{ id: "surface", label: "Surface", config: { tone: "surface", spacing: "regular" } }, { id: "elevated", label: "Elevated", config: { tone: "elevated", spacing: "compact" } }] },
  { id: "primitive.stack", name: "Stack", description: "Flexible flow with direction, gap, and alignment controls.", configurations: [{ name: "direction", options: ["vertical", "horizontal"] }, { name: "gap", options: ["compact", "regular", "spacious"] }], previewVariants: [{ id: "vertical", label: "Vertical", config: { direction: "vertical", gap: "regular" } }, { id: "horizontal", label: "Horizontal", config: { direction: "horizontal", gap: "spacious" } }] },
  { id: "primitive.grid", name: "Grid", description: "Responsive two, three, or four column grid.", configurations: [{ name: "columns", options: ["2", "3", "4"] }], previewVariants: [{ id: "two", label: "Two columns", config: { columns: "2" } }, { id: "three", label: "Three columns", config: { columns: "3" } }] },
  { id: "primitive.heading", name: "Heading", description: "Semantic heading level independent of visual scale.", configurations: [{ name: "as", options: ["h1", "h2", "h3"] }, { name: "scale", options: ["display", "section", "subsection"] }], previewVariants: [{ id: "display", label: "Display", config: { as: "h2", scale: "display" } }, { id: "section", label: "Section", config: { as: "h2", scale: "section" } }] },
  { id: "primitive.text", name: "Text", description: "Body copy with semantic element, hierarchy, and muted tone.", configurations: [{ name: "size", options: ["lead", "body", "small"] }, { name: "tone", options: ["default", "muted"] }], previewVariants: [{ id: "lead", label: "Lead", config: { size: "lead", tone: "default" } }, { id: "muted", label: "Muted body", config: { size: "body", tone: "muted" } }] },
  { id: "primitive.link", name: "Text Link", description: "Inline navigation with optional directional affordance.", configurations: [{ name: "treatment", options: ["plain", "underline", "arrow"] }], previewVariants: [{ id: "underline", label: "Underline", config: { treatment: "underline" } }, { id: "arrow", label: "Arrow", config: { treatment: "arrow" } }] },
  { id: "primitive.badge", name: "Badge", description: "Short, token-driven label with neutral or accent emphasis.", configurations: [{ name: "tone", options: ["neutral", "accent"] }], previewVariants: [{ id: "neutral", label: "Neutral", config: { tone: "neutral" } }, { id: "accent", label: "Accent", config: { tone: "accent" } }] },
  { id: "primitive.card", name: "Card", description: "Content surface with border, elevation, or flat treatment.", configurations: [{ name: "treatment", options: ["bordered", "raised", "flat"] }], previewVariants: [{ id: "bordered", label: "Bordered", config: { treatment: "bordered" } }, { id: "raised", label: "Raised", config: { treatment: "raised" } }] },
  { id: "primitive.media-frame", name: "Media Frame", description: "Aspect-ratio figure with an optional accessible caption.", configurations: [{ name: "aspect", options: ["wide", "square", "portrait"] }], previewVariants: [{ id: "wide", label: "Wide", config: { aspect: "wide" } }, { id: "portrait", label: "Portrait", config: { aspect: "portrait" } }] },
  { id: "primitive.media", name: "Responsive Media", description: "Portable responsive image or controlled video element.", configurations: [{ name: "fit", options: ["cover", "contain"] }], previewVariants: [{ id: "cover", label: "Cover", config: { fit: "cover" } }, { id: "contain", label: "Contain", config: { fit: "contain" } }] },
  { id: "primitive.divider", name: "Divider", description: "Semantic separation with theme-controlled border weight.", configurations: [], previewVariants: [{ id: "default", label: "Default", config: {} }] },
] as const;

export const primitiveFoundations = primitiveSpecs.map((spec) => ({
  ...spec, creative: foundationCapabilities[spec.id],
  responsiveInvariants: spec.id === "primitive.grid" ? [{ field: "columns", maxWidth: 700, reason: "One column at this width. The authored column count resumes above 700px." }] : spec.id === "primitive.stack" ? [{ field: "direction", maxWidth: 700, reason: "Vertical flow at this width. Authored horizontal flow resumes above 700px." }] : [],
  category: "primitive" as const, styles, pageTypes: pages, supportedMotion: ["none"] as const,
  complexity: "low" as const, mobileReady: true, accessibilityReady: true,
  responsiveReady: { desktop: true, tablet: true, mobile: true },
  status: "experimental" as const, version: "0.1.0",
})) satisfies readonly DesignComponentDefinition[];

const motionSpecs = [
  { id: "motion.mask", name: "Mask Reveal", description: "Viewport clip reveal from a chosen edge.", preset: "mask", configurations: [{ name: "direction", options: ["left", "right", "bottom"] }], previewVariants: [{ id: "left", label: "From left", config: { direction: "left" } }, { id: "bottom", label: "From bottom", config: { direction: "bottom" } }] },
  { id: "motion.split-text", name: "Split Text Reveal", description: "Word-level entrance that exposes one complete phrase to screen readers.", preset: "split-text", configurations: [{ name: "interval", options: ["0.04s", "0.1s"] }], previewVariants: [{ id: "quick", label: "Quick", config: { interval: "0.04s" } }, { id: "calm", label: "Calm", config: { interval: "0.1s" } }] },
  { id: "motion.parallax", name: "Parallax", description: "Clamped scroll-linked translation using a motion value.", preset: "parallax", configurations: [{ name: "distance", options: ["20px", "60px"] }], previewVariants: [{ id: "subtle", label: "Subtle", config: { distance: "20px" } }, { id: "deep", label: "Deep", config: { distance: "60px" } }] },
  { id: "motion.scroll-scale", name: "Scroll Scale", description: "A bounded scale as content enters the viewport.", preset: "scroll-scale", configurations: [{ name: "from", options: ["0.9", "0.96"] }], previewVariants: [{ id: "expressive", label: "Expressive", config: { from: "0.9" } }, { id: "subtle", label: "Subtle", config: { from: "0.96" } }] },
  { id: "motion.sticky-scroll", name: "Sticky Scroll", description: "Pinned story surface with optional progress indication; releases on narrow layouts.", preset: "sticky-scroll", configurations: [{ name: "showProgress", options: ["yes", "no"] }], previewVariants: [{ id: "progress", label: "With progress", config: { showProgress: "yes" } }, { id: "plain", label: "Without progress", config: { showProgress: "no" } }] },
  { id: "motion.marquee", name: "Marquee", description: "Visible-only looping text track, paused for reduced motion and interaction.", preset: "marquee", configurations: [{ name: "duration", options: ["16s", "32s"] }], previewVariants: [{ id: "quick", label: "Quick", config: { duration: "16s" } }, { id: "calm", label: "Calm", config: { duration: "32s" } }] },
  { id: "motion.magnetic", name: "Magnetic Interaction", description: "Mouse-only spring translation that settles when the pointer leaves.", preset: "magnetic", configurations: [{ name: "strength", options: ["0.1", "0.3"] }], previewVariants: [{ id: "subtle", label: "Subtle", config: { strength: "0.1" } }, { id: "strong", label: "Strong", config: { strength: "0.3" } }] },
  { id: "motion.depth-shift", name: "Depth Shift", description: "Mouse-only perspective tilt using spring-backed motion values.", preset: "depth-shift", configurations: [{ name: "maxDegrees", options: ["3", "7"] }], previewVariants: [{ id: "subtle", label: "Subtle", config: { maxDegrees: "3" } }, { id: "strong", label: "Strong", config: { maxDegrees: "7" } }] },
  { id: "motion.media-reveal", name: "Media Reveal", description: "One-time clip and opacity reveal for framed media.", preset: "media-reveal", configurations: [{ name: "duration", options: ["0.5s", "1s"] }], previewVariants: [{ id: "quick", label: "Quick", config: { duration: "0.5s" } }, { id: "calm", label: "Calm", config: { duration: "1s" } }] },
  { id: "motion.horizontal-scroll", name: "Horizontal Scroll", description: "Native, keyboard-focusable snap strip with labelled controls.", preset: "horizontal-scroll", configurations: [], previewVariants: [{ id: "default", label: "Default", config: {} }] },
] as const satisfies readonly { id: string; name: string; description: string; preset: MotionPreset; configurations: readonly { name: string; options: readonly string[] }[]; previewVariants: readonly { id: string; label: string; config: Readonly<Record<string, string>> }[] }[];

export const motionFoundations = motionSpecs.map((spec) => ({
  id: spec.id, motionParameters: spec.preset === "sticky-scroll" ? [] : spec.configurations.map(field => field.name), creative: motionCapabilities(spec.preset), name: spec.name, description: spec.description, configurations: spec.configurations, previewVariants: spec.previewVariants,
  category: "motion" as const, styles, pageTypes: pages, supportedMotion: [spec.preset] as const,
  complexity: "medium" as const, mobileReady: true, accessibilityReady: true,
  responsiveReady: { desktop: true, tablet: true, mobile: true },
  status: "experimental" as const, version: "0.1.0",
})) satisfies readonly DesignComponentDefinition[];

export const iconFoundation = {
  id: "icon.core", creative: foundationCapabilities["icon.core"], name: "Core Icon Pack", category: "icon", description: "Named functional glyphs with an accessible or decorative rendering contract.",
  styles, pageTypes: pages, supportedMotion: ["none"], complexity: "low",
  mobileReady: true, accessibilityReady: true, status: "experimental", version: "0.1.0",
  responsiveReady: { desktop: true, tablet: true, mobile: true },
  configurations: [{ name: "name", options: coreIconNames }, { name: "size", options: ["20", "32"] }, { name: "strokeWidth", options: ["1.5", "2"] }],
  previewVariants: [{ id: "arrow", label: "Arrow", config: { name: "arrow-right", size: "32", strokeWidth: "2" } }, { id: "search", label: "Search", config: { name: "search", size: "32", strokeWidth: "1.5" } }],
} as const satisfies DesignComponentDefinition;
