import {
  navigationIds,
  navigationHierarchyDepth,
  navigationOptions,
  defaultNavigationConfig,
  type ExpansionNavigationId,
} from "./capabilities";
export {
  navigationIds,
  navigationOptions,
  defaultNavigationConfig,
  architectureFor,
} from "./capabilities";
export type { ExpansionNavigationId } from "./capabilities";
import { z } from "zod";
import { mediaSourceSchema, videoPlaybackSchema } from "../media/types";
import { navigationArchitectures } from "./architectures";
import type { NavigationArchitecture, NavigationConfig } from "./types";
const text = z.string().trim().min(1);
export const destinationSchema = z
  .object({
    label: text.max(80),
    href: text.refine(
      (v) =>
        /^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/.test(v) &&
        !/[\\\x00-\x20\x7f]/.test(v),
      "Use a safe semantic destination.",
    ),
  })
  .strict();
export const logoSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text") }).strict(),
  z.object({ kind: z.literal("wordmark") }).strict(),
  z.object({ kind: z.literal("symbol"), src: mediaSourceSchema, mediaType: z.enum(["image", "video"]).optional(), playback: videoPlaybackSchema.optional() }).strict(),
  z.object({ kind: z.literal("combined"), src: mediaSourceSchema, mediaType: z.enum(["image", "video"]).optional(), playback: videoPlaybackSchema.optional() }).strict(),
  z
    .object({
      kind: z.literal("image"),
      src: mediaSourceSchema, mediaType: z.enum(["image", "video"]).optional(), playback: videoPlaybackSchema.optional(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .strict(),
]);
export type NavigationDestination = z.infer<typeof destinationSchema> & { children?: NavigationDestination[] };
const recursiveDestination: z.ZodType<NavigationDestination> = destinationSchema.extend({ children: z.lazy(() => z.array(recursiveDestination).min(1).max(6)).optional() }).strict();
function schema(a: NavigationArchitecture) {
  const defaults = defaultNavigationConfig(a);
  const shape = Object.fromEntries(
    Object.entries(navigationOptions(a)).map(([key, values]) => [
      key,
      key === "cta" || key === "utilities"
        ? z.boolean().default(true)
        : z
            .enum(values as [string, ...string[]])
            .default(String(defaults[key as keyof NavigationConfig])),
    ]),
  );
  const child = destinationSchema;
  const parent = destinationSchema
    .extend({ children: z.array(child).min(1).max(6).optional() })
    .strict();
  return z
    .object({
      structure: z.literal(a.id),
      motion: z.literal("none"),
      settings: z
        .object(shape)
        .strict()
        .default({})
        .superRefine((c, ctx) => {
          if (c.scroll === "solidify" && c.position === "flow")
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Hero-centric behavior requires overlay placement.",
            });
        }),
      content: z
        .object({
          brand: text.max(120),
          home: destinationSchema.shape.href,
          logo: logoSchema.optional(),
          kind: text.max(120).optional(),
          edition: text.max(80).optional(),
          note: text.max(400).optional(),
          sceneLabel: text.max(80).optional(),
          prompt: text.max(100).optional(),
          links: z
            .array(navigationHierarchyDepth(a) === null ? recursiveDestination : a.nested ? parent : destinationSchema)
            .min(a.destinations[0])
            .max(a.destinations[1]),
          action: destinationSchema.optional(),
          utilities: z
            .array(
              destinationSchema
                .extend({
                  kind: z.enum(
                    a.utilities.filter((u) => u !== "cta") as [
                      string,
                      ...string[],
                    ],
                  ),
                })
                .strict(),
            )
            .max(a.utilities.length)
            .optional(),
        })
        .strict()
        .refine(
          (c) => new Set(c.links.map((l) => l.label)).size === c.links.length,
          "Destination labels must be unique.",
        )
        .refine(
          (c) =>
            !c.utilities ||
            new Set(c.utilities.map((u) => u.kind)).size === c.utilities.length,
          "Utility kinds must be unique.",
        ),
    })
    .strict();
}
export const navigationSchemas = Object.fromEntries(
  navigationIds.map((id, i) => [id, schema(navigationArchitectures[i])]),
) as Record<ExpansionNavigationId, ReturnType<typeof schema>>;
export type NavigationPayload = z.infer<ReturnType<typeof schema>>;
