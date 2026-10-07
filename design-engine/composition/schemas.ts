import { endingSectionSchemas } from "./ending-schemas";
import { importSectionSchemas } from "./import-schemas";
import { contextualActionsSchema, type ContextualActions } from "../actions/schema";
import { validateContextualActions } from "../actions/capabilities";
import { z } from "zod";
import { actionBindingSchema, navigationSourceSchema, type ActionBinding, type NavigationSource } from "../site/action-schema";
import { logoSchema, navigationSchemas } from "../navigation/schemas";
import { immersiveHeroSchemas } from "./immersive-hero-schemas";
import { evidenceSectionSchemas } from "./evidence-schemas";
import { commerceSectionSchemas } from "./commerce-schemas";
import { serviceSectionSchemas } from "./service-schemas";
import { collectionSectionSchemas } from "./collection-schemas";
import { imageSchema, treatmentSchema } from "../media/types";

export const typographyIds = ["editorial", "luxury", "neo-grotesk", "geometric", "poster", "humanist", "technical", "brutalist", "playful", "fashion"] as const;
export const artIds = ["gallery", "publication", "precision", "billboard", "salon", "runway"] as const;
export const motionLanguages = ["none", "restrained", "expressive"] as const;
export const creativeOverrideSchema = z.object({
  typography: z.enum(typographyIds).optional(), artDirection: z.enum(artIds).optional(), motion: z.enum(motionLanguages).optional(),
}).strict();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Composition colors use six-digit hex.");
export const siteSchema = z.object({
  brand: z.object({ theme: z.enum(["neutral", "editorial", "technical"]), colors: z.object({
    background: color.optional(), surface: color.optional(), surfaceElevated: color.optional(), foreground: color.optional(),
    muted: color.optional(), accent: color.optional(), accentForeground: color.optional(), border: color.optional(),
  }).strict().optional() }).strict(),
  typography: z.enum(typographyIds), artDirection: z.enum(artIds), motion: z.enum(motionLanguages),
  icons: z.object({ id: z.literal("core"), strokeWidth: z.union([z.literal(1.5), z.literal(2)]) }).strict(),
}).strict();
export type SiteConfiguration = z.infer<typeof siteSchema>;
export type CreativeOverrides = z.infer<typeof creativeOverrideSchema>;
export type CreativeLayers = Omit<SiteConfiguration, "brand" | "icons">;

const text = z.string().trim().min(1);
export const linkSchema = z.object({ label: text.max(80), href: text.refine(href => /^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/.test(href), "Use a safe link destination.") }).strict();
const heroAction = linkSchema.refine(link => !/[\\\x00-\x20\x7f]/.test(link.href), "Destination must not contain whitespace, controls or backslashes.");
const portraitTreatment = treatmentSchema.extend({ geometry: z.literal("portrait-emphasis") });
const intro = { title: text.max(180), description: text.max(600), action: linkSchema, eyebrow: text.max(100).optional() };
const nav = { logo: logoSchema.optional(), brand: text.max(80), home: linkSchema.shape.href, links: z.array(linkSchema).min(2).max(7), action: linkSchema.optional() };
export const sectionSchemas = {
  ...endingSectionSchemas,
  ...importSectionSchemas,
  ...navigationSchemas,
  ...immersiveHeroSchemas,
  ...collectionSectionSchemas,
  ...serviceSectionSchemas,
  ...commerceSectionSchemas,
  ...evidenceSectionSchemas,
  "navigation.primary": z.object({ content: z.object(nav).strict(), structure: z.enum(["compact", "comfortable"]), motion: z.literal("none") }).strict(),
  "navigation.island": z.object({ content: z.object({ ...nav, links: z.array(linkSchema).min(2).max(4) }).strict(), structure: z.enum(["center", "end"]), placement: z.enum(["in-flow", "overlay"]), motion: z.literal("none") }).strict(),
  "navigation.contents": z.object({ content: z.object({ ...nav, note: text.max(400).optional(), edition: text.max(80).optional() }).strict(), structure: z.enum(["numbered", "plain"]), motion: z.literal("none") }).strict(),
  "hero.statement": z.object({ content: z.object({ ...intro, secondaryAction: linkSchema.optional() }).strict(), structure: z.enum(["start", "center"]), motion: z.enum(["none", "fade"]) }).strict(),
  "hero.object-study": z.object({ content: z.object({ category: text.max(80), reference: text.max(80), eyebrow: text.max(100).optional(), title: text.max(180), description: text.max(400).optional(), materialNote: text.max(180), objectNumber: text.max(12).optional(), action: heroAction.optional() }).strict(), media: z.object({ image: imageSchema }).strict(), treatment: portraitTreatment, structure: z.literal("object-study"), motion: z.literal("none") }).strict(),
  "hero.vertical-record": z.object({ content: z.object({ category: text.max(80), reference: text.max(80), eyebrow: text.max(100).optional(), title: text.max(180), description: text.max(400).optional(), action: heroAction, recordLabel: text.max(80), records: z.array(z.object({ id: text.regex(/^[a-z][a-z0-9-]*$/).max(60), dateLabel: text.max(40), label: text.max(100) }).strict()).min(2).max(5) }).strict().refine(c => new Set(c.records.map(r => r.id)).size === c.records.length, "Record IDs must be unique."), media: z.object({ image: imageSchema }).strict(), treatment: portraitTreatment, structure: z.literal("vertical-record"), motion: z.enum(["none", "media-reveal"]) }).strict(),
  "hero.front-page": z.object({ content: z.object({ ...intro, masthead: text.max(80), edition: text.max(80), topic: text.max(80), abstract: text.max(600) }).strict(), media: z.object({ image: imageSchema }).strict(), treatment: treatmentSchema, structure: z.enum(["spread", "lead-story"]), motion: z.enum(["none", "media-reveal"]) }).strict(),
  "hero.open-circuit": z.object({ content: z.object({ ...intro, readout: text.max(30) }).strict(), media: z.object({
    signal: z.object({ label: text.max(120), unit: text.max(40), source: text.max(200), illustrative: z.boolean(),
      samples: z.array(z.object({ label: text.max(50), value: z.number().finite() }).strict()).min(3).max(100),
    }).strict(),
  }).strict(), structure: z.enum(["baseline", "annotated"]), motion: z.literal("none") }).strict(),
  "hero.between-acts": z.object({ content: z.object({ ...intro, closingPhrase: text.max(180), sideNote: text.max(100) }).strict(), media: z.object({ image: imageSchema }).strict(), treatment: treatmentSchema, structure: z.enum(["interval", "extended-pause"]), motion: z.enum(["none", "media-reveal"]) }).strict(),
  "hero.assembly": z.object({ content: z.object({ ...intro, specification: text.max(150) }).strict(), media: z.object({
    assembly: z.object({ label: text.max(120), parts: z.array(z.object({ id: text.max(20), label: text.max(60), specification: text.max(150) }).strict()).min(2).max(4) }).strict(),
  }).strict(), structure: z.enum(["exploded", "compact"]), motion: z.enum(["none", "fade"]) }).strict(),
  "hero.comparison": z.object({ contentAlignment: z.enum(["left", "center", "right"]).optional(), content: z.object({ ...intro, beforeLabel: text.max(60), afterLabel: text.max(60) }).strict(), media: z.object({ before: imageSchema, after: imageSchema }).strict(), treatment: treatmentSchema, structure: z.enum(["balanced", "inspection"]), motion: z.literal("none") }).strict(),
  "content.feature-list": z.object({ content: z.object({ title: text.max(180), eyebrow: text.max(100).optional(), description: text.max(600).optional(), items: z.array(z.object({ title: text.max(100), body: text.max(600) }).strict()).min(1).max(8) }).strict(), structure: z.enum(["grid", "list"]), motion: z.enum(["none", "stagger"]) }).strict(),
  "story.object-biography": z.object({ content: z.object({ title: text.max(180), introduction: text.max(600), subject: text.max(80), origin: text.max(180), continuation: text.max(180), records: z.array(z.object({ label: text.max(80), title: text.max(100), body: text.max(600) }).strict()).length(3) }).strict(), media: z.object({ image: imageSchema }).strict(), treatment: treatmentSchema, structure: z.enum(["annotated", "reading-room"]), motion: z.literal("none") }).strict(),
  "story.working-conversation": z.object({ content: z.object({ title: text.max(180), introduction: text.max(600), attribution: text.max(300), exchanges: z.array(z.object({ question: text.max(180), speaker: text.max(80), role: text.max(100), answer: text.max(900), aside: text.max(300).optional() }).strict()).min(2).max(4) }).strict(), structure: z.enum(["transcript", "roundtable"]), motion: z.literal("none") }).strict(),
  "story.decision-ledger": z.object({ content: z.object({ title: text.max(180), introduction: text.max(600), columns: z.tuple([text.max(60), text.max(60), text.max(60)]), rationaleLabel: text.max(60), decisions: z.array(z.object({ belief: text.max(100), tension: text.max(120), practice: text.max(300), rationale: text.max(700) }).strict()).min(2).max(5) }).strict(), structure: z.enum(["open", "disclosure"]), motion: z.literal("none") }).strict(),
} as const;
export const sectionWidthSchema = z.enum(["default", "full", "edge"]);
export type SectionWidth = z.infer<typeof sectionWidthSchema>;
export type SectionId = keyof typeof sectionSchemas;
export type SectionPayload<K extends SectionId> = z.infer<(typeof sectionSchemas)[K]>;
export type SectionInstance<K extends SectionId = SectionId> = {
  [Id in K]: SectionPayload<Id> & { id: string; component: Id; sectionWidth?: SectionWidth; overrides?: CreativeOverrides; actions?: ActionBinding[]; contextualActions?: ContextualActions; navigationSource?: NavigationSource }
}[K];
export type PageComposition = { id: string; label: string; site: SiteConfiguration; overrides?: CreativeOverrides; sections: SectionInstance[] };

/** Metadata is kept separate from executable schemas; neither accepts undeclared fields. */
export function parseSection(input: unknown): SectionInstance {
  // Import-only compatibility: the retired option never enters the active registry.
  if (input && typeof input === "object" && "component" in input && input.component === "work.glass-lens") {
    const legacy = input as Record<string, unknown>;
    const { lens, structure, ...retained } = legacy;
    void lens; void structure;
    input = {...retained,component:"work.liquid-glass",structure:"liquid-lens",skin:"site",alignment:"center",height:"section",entry:"none",gap:"tight"};
  }
  const envelope = z.object({ id: text.regex(/^[a-z][a-z0-9-]*$/), component: z.enum(Object.keys(sectionSchemas) as [SectionId, ...SectionId[]]), sectionWidth: sectionWidthSchema.optional(), overrides: creativeOverrideSchema.optional(), actions: z.array(actionBindingSchema).optional(), contextualActions: contextualActionsSchema.optional(), navigationSource: navigationSourceSchema.optional() }).passthrough().parse(input);
  const { id, component, sectionWidth, overrides, actions, contextualActions, navigationSource, ...payload } = envelope;
  if (navigationSource && !component.startsWith("navigation.") && !component.startsWith("footer.")) throw new Error("Only Navigation and Footer consume site destinations.");
  if (!component.startsWith("navigation.") && actions?.some(binding => binding.path[1] === "home")) throw new Error("Only Navigation supports a home destination binding.");
  if (navigationSource && actions?.some(binding => binding.path[1] === "links")) throw new Error("Site-derived menu links are owned by the Site Tree. Remove legacy link bindings or use authored destinations.");
  if (actions && new Set(actions.map(binding => JSON.stringify(binding.path))).size !== actions.length) throw new Error("Action paths must be unique.");
  const section = { id, component, ...(sectionWidth ? { sectionWidth } : {}), overrides, ...(contextualActions ? { contextualActions } : {}), ...(actions ? { actions } : {}), ...(navigationSource ? { navigationSource } : {}), ...sectionSchemas[component].parse(payload) } as SectionInstance;
  validateContextualActions(section, contextualActions);
  return section;
}
