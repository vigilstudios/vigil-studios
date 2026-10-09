import { z } from "zod";
import { actionSchema } from "../site/action-schema";
import { logoSchema } from "../navigation/schemas";
import { imageSchema } from "../media/types";
import { photoRecordSchema } from "./collection-schemas";
import { inquiryFormAppearanceSchema } from "../forms/appearance";

const text = (max: number) => z.string().trim().min(1).max(max);
const identity = text(80).regex(/^[a-z][a-z0-9-]*$/);
const unique = <T extends { id: string }>(records: T[]) => new Set(records.map(r => r.id)).size === records.length;
export const destinationRecordSchema = z.object({ id: identity, title: text(120), destination: actionSchema, note: text(300).optional() }).strict();
const destinations = z.array(destinationRecordSchema).max(12).refine(unique, "Destination IDs must be unique.");
export const formFieldSchema = z.object({
  id: identity, label: text(120), type: z.enum(["text", "email", "tel", "date", "textarea", "select", "checkbox"]), required: z.boolean(),
  autocomplete: z.enum(["name", "email", "tel", "organization", "off"]).optional(), description: text(300).optional(),
  options: z.array(text(120)).min(1).max(12).optional(),
}).strict().refine(field => field.type !== "select" || !!field.options, "Select fields need options.");
export const submissionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("unavailable") }).strict(),
  z.object({ mode: z.literal("email-draft"), destination: z.object({type:z.literal("email"),email:z.string().email()}).strict() }).strict(),
  z.object({ mode: z.literal("host"), integration: identity }).strict(),
]);
export const endingFormSchema = z.object({
  title: text(140), description: text(400).optional(), submitLabel: text(100), successMessage: text(300),
  unavailableMessage: text(300), submission: submissionSchema,
  fields: z.array(formFieldSchema).min(1).max(8).refine(unique, "Field IDs must be unique."),
}).strict();
const intro = { title: text(180), introduction: text(600), eyebrow: text(100).optional() };
const common = { motion: z.enum(["none", "fade"]), density: z.enum(["compact", "open"]), surface: z.enum(["transparent", "surface", "brand"]), measure: z.enum(["reading", "wide"]) };
const footerContent = {
  brand: text(80), logo: logoSchema.optional(), statement: text(400), copyright: text(200), navigationLabel: text(100),
  groups: z.array(z.object({id:identity,title:text(100),links:destinations}).strict()).max(6).refine(groups => unique(groups) && unique(groups.flatMap(g=>g.links)), "Group and link IDs must be unique."),
  socials: destinations, legal: destinations,
};
const footerCommon = { ...common, navigationDepth: z.enum(["top-level", "two-level", "all"]) };
const records = z.array(photoRecordSchema).min(2).max(16).refine(unique, "Record IDs must be unique.");
const mediaStyle = { skin:z.enum(["reference","site"]), alignment:z.enum(["left","center","right"]) };
const gallery = {content:z.object({...intro,works:records}).strict(),surface:common.surface,density:common.density};
export const endingSectionSchemas = {
  "cta.editorial": z.object({...common,content:z.object(intro).strict(),structure:z.enum(["left","center","right"])}).strict(),
  "cta.signal": z.object({...common,content:z.object({...intro,image:imageSchema.optional()}).strict(),structure:z.enum(["poster","split","reverse"]),height:z.enum(["section","viewport"])}).strict(),
  "contact.inquiry": z.object({...common,content:z.object({...intro,image:imageSchema.optional(),details:destinations,socials:destinations,location:text(300).optional(),hours:text(200).optional(),form:endingFormSchema.optional()}).strict(),structure:z.enum(["information","split","social"]),imagePlacement:z.enum(["none","left","right","background"]).optional(), imageOverlay:z.number().min(0).max(.9).optional(), alignment:z.enum(["left","center","right"]).optional(), appearance:z.enum(["minimal","editorial","panel"]).optional(), formAppearance:inquiryFormAppearanceSchema.optional()}).strict(),
  "footer.sitemap": z.object({...footerCommon,content:z.object(footerContent).strict(),structure:z.enum(["brand-left","brand-above"])}).strict(),
  "footer.compact": z.object({...footerCommon,content:z.object(footerContent).strict(),structure:z.enum(["center","row"]),navigationDepth:z.literal("top-level")}).strict(),
  "footer.split": z.object({...footerCommon,content:z.object({...footerContent,title:text(180),newsletter:endingFormSchema.optional()}).strict(),structure:z.enum(["brand-left","brand-right"])}).strict(),
  "footer.banner": z.object({...footerCommon,content:z.object({...footerContent,title:text(180),newsletter:endingFormSchema.optional()}).strict(),structure:z.enum(["center","left"])}).strict(),
  "work.expand-rail": z.object({...gallery,structure:z.enum(["label-rails","image-strips"]),motion:z.enum(["none","depth-shift"]),height:z.enum(["portrait","landscape"]),railWidth:z.enum(["compact","comfortable"]),defaultId:identity.optional()}).strict(),
  "work.card-rail": z.object({...gallery,structure:z.enum(["cards","coverflow"]),motion:z.enum(["none","depth-shift"]),ratio:z.enum(["portrait","square","landscape"]),filter:z.enum(["none","category"]),inspection:z.enum(["none","dialog"])}).strict(),
  "work.image-expansion": z.object({...gallery,...mediaStyle,structure:z.literal("tabbed-cards"),motion:z.enum(["none","depth-shift"]),colorMode:z.enum(["dark","light"]),filter:z.enum(["category","none"]),inspection:z.enum(["dialog","none"]),ratio:z.enum(["landscape","square"])}).strict(),
  "work.image-gallery": z.object({...gallery,...mediaStyle,structure:z.literal("expanding-strips"),motion:z.enum(["none","depth-shift"]),height:z.enum(["standard","tall"]),inspection:z.enum(["dialog","none"])}).strict(),
  "work.apple-cards": z.object({...gallery,...mediaStyle,structure:z.literal("portrait-cards"),motion:z.enum(["none","depth-shift"]),height:z.enum(["standard","tall"]),inspection:z.enum(["dialog","none"])}).strict(),
  "work.liquid-glass": z.object({...gallery,...mediaStyle,structure:z.literal("liquid-lens"),motion:z.enum(["none","depth-shift"]),height:z.enum(["section","viewport"]),entry:z.enum(["rise-grow","none"]),gap:z.enum(["tight","open"])}).strict(),
} as const;
export const endingSectionIds = Object.keys(endingSectionSchemas) as (keyof typeof endingSectionSchemas)[];
export type EndingSectionId = keyof typeof endingSectionSchemas;
export type EndingForm = z.infer<typeof endingFormSchema>;
export type DestinationRecord = z.infer<typeof destinationRecordSchema>;
