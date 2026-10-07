import { z } from "zod";
import { imageSchema, treatmentSchema } from "../media/types";
import { destinationSchema } from "../navigation/schemas";
const text = z.string().trim().min(1);
const scene = z
  .object({
    content: z
      .object({
        title: text.max(180),
        eyebrow: text.max(100).optional(),
        description: text.max(600).optional(),
        reference: text.max(120).optional(),
        caption: text.max(400).optional(),
        action: destinationSchema.optional(),
        secondaryAction: destinationSchema.optional(),
      })
      .strict(),
    media: z.object({ image: imageSchema }).strict(),
    treatment: treatmentSchema.extend({ geometry: z.literal("full-bleed") }),
    alignment: z.enum(["left", "center", "right"]).default("left"),
    position: z.enum(["top", "middle", "bottom"]).default("middle"),
    voice: z.enum(["subtle", "loud"]).default("subtle"),
    ink: z.enum(["light", "dark"]).default("light"),
    motion: z.literal("none"),
  })
  .strict();
export const immersiveHeroSchemas = {
  "hero.full-scene": scene.extend({ structure: z.literal("full-scene") }),
  "hero.scene-poster": scene.extend({ structure: z.literal("scene-poster") }),
} as const;
