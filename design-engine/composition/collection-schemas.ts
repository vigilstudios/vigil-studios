import { z } from "zod";
import { imageSchema, mediaSourceSchema, videoSchema } from "../media/types";
const text = z.string().trim().min(1);
const intro = {
  title: text.max(180),
  introduction: text.max(600),
  edition: text.max(100).optional(),
};
const metadata = {
  id: text.max(80),
  title: text.max(120),
  note: text.max(700).optional(),
  category: text.max(80),
};
export const photoRecordSchema = z
  .object({
    ...metadata,
    image: imageSchema,
    thumbnail: imageSchema
      .extend({
        width: z.number().int().positive().max(960),
        height: z.number().int().positive().max(960),
      })
      .optional(),
  })
  .strict();
export type PhotoRecord = z.infer<typeof photoRecordSchema>;
const unique = <T extends { id: string }>(items: T[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const records = (min: number, max: number) =>
  z
    .array(photoRecordSchema)
    .min(min)
    .max(max)
    .refine(unique, "Record IDs must be unique.");
const thumbnailBudget = (items: PhotoRecord[]) =>
  items.length <= 8 || items.every((item) => item.thumbnail !== undefined);
const still = { structure: z.literal("authored"), motion: z.literal("none") };
export const collectionSectionSchemas = {
  "story.manifesto-fold": z
    .object({
      ...still,
      content: z
        .object({
          title: text.max(100),
          introduction: text.max(600),
          principles: z
            .array(
              z
                .object({
                  statement: text.max(120),
                  explanation: text.max(700),
                })
                .strict(),
            )
            .min(3)
            .max(6),
        })
        .strict(),
    })
    .strict(),
  "story.open-letter": z
    .object({
      ...still,
      content: z
        .object({
          salutation: text.max(180),
          paragraphs: z.array(text.max(1200)).min(2).max(5),
          signoff: text.max(100),
          signature: text.max(100),
          postscript: text.max(500).optional(),
        })
        .strict(),
    })
    .strict(),
  "story.material-relay": z
    .object({
      ...still,
      content: z
        .object({
          title: text.max(180),
          introduction: text.max(600),
          stages: z
            .array(
              z
                .object({
                  verb: text.max(30),
                  title: text.max(100),
                  responsibility: text.max(600),
                  image: imageSchema,
                })
                .strict(),
            )
            .length(3),
        })
        .strict(),
    })
    .strict(),
  "work.open-index": z
    .object({
      ...still,
      content: z.object({ ...intro, projects: records(3, 12) }).strict(),
    })
    .strict(),
  "work.project-chapters": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          chapters: z
            .array(
              z
                .object({
                  id: text.max(80),
                  title: text.max(120),
                  narrative: text.max(700),
                  scene: imageSchema,
                  fit: z.enum(["contain", "cover"]),
                  evidence: z
                    .object({ image: imageSchema, caption: text.max(240) })
                    .strict()
                    .optional(),
                })
                .strict(),
            )
            .min(3)
            .max(8)
            .refine(unique, "Chapter IDs must be unique."),
        })
        .strict(),
    })
    .strict(),
  "work.contact-room": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          frames: records(4, 24).refine(
            thumbnailBudget,
            "More than eight proof frames require dedicated thumbnails.",
          ),
        })
        .strict(),
    })
    .strict(),
  "work.screening-room": z
    .object({
      ...still,
      content: z.object({ ...intro, frames: records(3, 30) }).strict(),
    })
    .strict(),
  "work.photographic-promenade": z
    .object({
      ...still,
      content: z.object({ ...intro, scenes: records(3, 12) }).strict(),
    })
    .strict(),
  "work.gallery-hanging": z
    .object({
      structure: z.literal("authored"), motion: z.enum(["none", "stagger"]),
      layout: z.enum(["hanging", "paired"]).default("hanging"),
      ratio: z.enum(["landscape", "square", "portrait"]).default("landscape"),
      captions: z.enum(["below", "overlay"]).default("below"),
      density: z.enum(["open", "compact"]).default("open"),
      content: z.object({ ...intro, works: records(4, 12) }).strict(),
    })
    .strict(),
  "work.campaign-folio": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          spreads: z
            .array(
              z
                .object({
                  id: text.max(80),
                  title: text.max(120),
                  essay: text.max(700),
                  principal: photoRecordSchema,
                  facing: photoRecordSchema.optional(),
                })
                .strict(),
            )
            .min(2)
            .max(6)
            .refine(unique, "Spread IDs must be unique."),
        })
        .strict(),
    })
    .strict(),
  "work.look-closer": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          pairs: z
            .array(
              z
                .object({
                  id: text.max(80),
                  relationship: text.max(200),
                  overview: photoRecordSchema,
                  companion: photoRecordSchema,
                })
                .strict(),
            )
            .min(2)
            .max(6)
            .refine(unique, "Pair IDs must be unique."),
        })
        .strict(),
    })
    .strict(),
  "work.campaign-score": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          chapters: z
            .array(
              z
                .object({
                  id: text.max(80),
                  phrase: text.max(60),
                  narrative: text.max(700),
                  image: imageSchema,
                  fit: z.enum(["contain", "cover"]),
                  counterImage: imageSchema.optional(),
                })
                .strict(),
            )
            .min(3)
            .max(6)
            .refine(unique, "Chapter IDs must be unique."),
        })
        .strict(),
    })
    .strict(),
  "work.media-cabinet": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          records: z
            .array(
              z.discriminatedUnion("kind", [
                z
                  .object({
                    ...metadata,
                    kind: z.literal("image"),
                    image: imageSchema,
                  })
                  .strict(),
                z
                  .object({
                    ...metadata,
                    kind: z.literal("video"),
                    video: videoSchema,
                  })
                  .strict(),
              ]),
            )
            .min(4)
            .max(24)
            .refine(unique, "Record IDs must be unique."),
        })
        .strict(),
    })
    .strict(),
  "work.light-table": z
    .object({
      ...still,
      content: z
        .object({
          ...intro,
          images: records(3, 16).refine(
            thumbnailBudget,
            "More than eight tray images require dedicated thumbnails.",
          ),
        })
        .strict(),
    })
    .strict(),
  "work.viewport-gallery": z
    .object({
      ...still,
      content: z
        .object({
          title: text.max(180),
          label: text.max(60),
          pieces: z
            .array(
              z
                .object({
                  id: text.max(80),
                  title: text.max(120),
                  category: text.max(32),
                  detail: text.max(700),
                  image: imageSchema,
                  fit: z.enum(["contain", "cover"]),
                })
                .strict(),
            )
            .min(1)
            .max(24)
            .refine(unique, "Piece IDs must be unique.")
            .refine(
              (pieces) =>
                new Set(pieces.map((piece) => piece.category)).size <= 4,
              "Viewport gallery supports up to four categories.",
            ),
        })
        .strict(),
    })
    .strict(),
} as const;
// Exporting the shared source contract keeps client adapters independent of Lab assets.
export { mediaSourceSchema };
