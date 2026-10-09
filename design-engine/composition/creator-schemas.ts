import { z } from "zod";
import { imageSchema } from "../media/types";
import { safeHref } from "../site/action-schema";
const text = (max: number) => z.string().trim().min(1).max(max);
const identity = text(80).regex(/^[a-z][a-z0-9-]*$/);
const unique = <T extends { id: string }>(items: T[]) => new Set(items.map(item => item.id)).size === items.length;
const common = { motion: z.literal("none"), density: z.enum(["open", "compact"]), surface: z.enum(["transparent", "surface", "framed"]), alignment: z.enum(["left", "center"]) };
export const creatorSectionSchemas = {
  "proof.social-reach": z.object({
    ...common, structure: z.enum(["cards", "editorial", "compact"]), statsStyle: z.enum(["bold", "quiet"]), linkStyle: z.enum(["pills", "rows"]),
    content: z.object({
      title: text(180), introduction: text(600), eyebrow: text(100).optional(), basis: text(300).optional(),
      stats: z.array(z.object({ id: identity, value: text(30), label: text(80), platform: text(60).optional(), period: text(80).optional(), source: safeHref.optional() }).strict()).min(1).max(8).refine(unique, "Unique stat IDs required"),
      socials: z.array(z.object({ id: identity, platform: text(60), handle: text(100).optional(), href: safeHref.refine(value => /^https?:\/\//.test(value), "Use an HTTP(S) profile URL") }).strict()).min(1).max(8).refine(unique, "Unique social IDs required"),
    }).strict(),
  }).strict(),
  "about.creator-profile": z.object({
    ...common, structure: z.enum(["scrapbook", "split", "centered"]), imageSide: z.enum(["left", "right"]), photoStyle: z.enum(["snapshot", "clean"]), imageShape: z.enum(["portrait", "square", "rounded"]),
    content: z.object({
      title: text(180), name: text(80), role: text(100).optional(), location: text(100).optional(), eyebrow: text(100).optional(), biography: text(2400), signature: text(100).optional(),
      image: imageSchema, secondaryImage: imageSchema.optional(),
      interests: z.array(z.object({ id: identity, label: text(60) }).strict()).max(8).refine(unique, "Unique interest IDs required"),
    }).strict(),
  }).strict(),
} as const;
export const creatorSectionIds = ["proof.social-reach", "about.creator-profile"] as const;
export type CreatorSectionId = typeof creatorSectionIds[number];
