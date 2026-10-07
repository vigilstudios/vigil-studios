import { z } from "zod";

export const mediaGeometries = ["full-bleed", "contained", "framed", "panorama", "portrait-emphasis", "editorial-crop"] as const;
export type MediaGeometry = (typeof mediaGeometries)[number];
export const mediaTones = ["natural", "monochrome", "high-contrast"] as const;
export type MediaTone = (typeof mediaTones)[number];
export const mediaSourceSchema = z.string().min(1).refine(value => /^(\/(?!\/)|https?:\/\/|data:image\/)/.test(value), "Use an application path or image URL.");
const focal = z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict();
export const imageSchema = z.object({
  src: mediaSourceSchema, alt: z.string().trim().min(1).max(1000), width: z.number().int().positive(), height: z.number().int().positive(),
  focal: focal.optional(), mobileFocal: focal.optional(), mobileSrc: mediaSourceSchema.optional(),
  srcSet: z.string().optional(), sizes: z.string().optional(), caption: z.string().trim().max(400).optional(),
}).strict();
export type SectionImage = z.infer<typeof imageSchema>;
export const treatmentSchema = z.object({ geometry: z.enum(mediaGeometries), tone: z.enum(mediaTones) }).strict();
export type MediaTreatment = z.infer<typeof treatmentSchema>;

/** Native video is user-started; speech always has a caption track. */
export const videoSchema = z.object({
  src: mediaSourceSchema, width: z.number().int().positive(), height: z.number().int().positive(),
  label: z.string().trim().min(1).max(160), poster: imageSchema,
  transcript: z.string().trim().min(1).max(8000), hasSpeech: z.boolean(),
  captions: z.object({ src: mediaSourceSchema, language: z.string().min(2).max(35), label: z.string().min(1).max(80) }).strict().optional(),
}).strict().refine(video => !video.hasSpeech || Boolean(video.captions), "Speech requires captions.");
export type SectionVideo = z.infer<typeof videoSchema>;
