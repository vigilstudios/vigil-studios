import { z } from "zod";
import { imageSchema, videoSchema } from "../media/types";
const text = (max = 240) => z.string().trim().min(1).max(max);
export const commerceIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
const id = commerceIdSchema;
const unique = <T extends { id: string }>(items: T[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const list = <T extends z.ZodTypeAny>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);
export const destinationSchema = z
  .object({
    label: text(80),
    href: z
      .string()
      .max(500)
      .refine(
        (v) =>
          /^(\/(?!\/)|https?:\/\/|#[a-zA-Z][\w-]*$)/.test(v) &&
          !/[\s\\\u0000-\u001f\u007f]/.test(v),
        "Expected a host-owned route, URL or local anchor",
      ),
  })
  .strict();
export const moneySchema = z
  .object({
    amountMinor: z.number().int().nonnegative().max(1e12),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .refine((v) => {
        try {
          return Intl.supportedValuesOf("currency").includes(v);
        } catch {
          return false;
        }
      }, "Use a supported ISO 4217 currency"),
    mode: z.enum(["fixed", "starting", "subscription"]).default("fixed"),
    interval: z.enum(["month", "year"]).optional(),
  })
  .strict()
  .refine(
    (v) => (v.mode === "subscription") === Boolean(v.interval),
    "Only subscription prices require an interval",
  );
export const availabilitySchema = z.enum([
  "available",
  "unavailable",
  "preorder",
  "unknown",
]);
const mediaMetadata = {
  role: z.enum(["primary", "secondary", "alternate", "detail"]).optional(),
  purpose: z
    .enum(["product", "lifestyle", "campaign", "model", "detail"])
    .optional(),
  thumbnail: imageSchema.optional(),
};
export const mediaSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...mediaMetadata,
      kind: z.literal("image"),
      id,
      label: text(80),
      image: imageSchema,
    })
    .strict(),
  z
    .object({
      ...mediaMetadata,
      kind: z.literal("video"),
      id,
      label: text(80),
      video: videoSchema,
    })
    .strict(),
  z
    .object({
      ...mediaMetadata,
      kind: z.literal("interactive-placeholder"),
      id,
      label: text(80),
      image: imageSchema,
      explanation: text(),
    })
    .strict(),
]);
export const specificationSchema = z
  .object({ id, label: text(60), value: text(120) })
  .strict();
// Provider-neutral presentation records. Provider IDs and inventory belong to a future adapter.
const summaryShape = z
  .object({
    productId: id,
    title: text(100),
    slug: id.optional(),
    description: text(500).optional(),
    price: moneySchema,
    compareAtPrice: moneySchema.optional(),
    media: list(mediaSchema, 0, 10).refine(unique, "Media IDs must be unique"),
    category: text(60).optional(),
    collection: text(80).optional(),
    badges: list(text(40), 0, 3).default([]),
    availability: availabilitySchema.default("unknown"),
    destination: destinationSchema,
  })
  .strict();
export const validPricePair = (p: { price: Money; compareAtPrice?: Money }) =>
  !p.compareAtPrice ||
  (p.compareAtPrice.currency === p.price.currency &&
    p.compareAtPrice.amountMinor > p.price.amountMinor &&
    p.compareAtPrice.mode === p.price.mode &&
    p.compareAtPrice.interval === p.price.interval);
export const productSummarySchema = summaryShape
  .refine(
    validPricePair,
    "Compare-at price must be larger on the same currency and billing basis",
  )
  .refine(
    (p) => p.media.filter((m) => m.role === "primary").length <= 1,
    "Only one primary media asset is allowed",
  );
export const productIdentitySchema = summaryShape.pick({
  productId: true,
  title: true,
  slug: true,
  description: true,
  media: true,
  destination: true,
});
export const optionSchema = z
  .object({
    id,
    name: text(50),
    presentation: z.enum(["size", "swatch", "configuration"]),
    values: list(
      z
        .object({
          id,
          label: text(50),
          color: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional(),
        })
        .strict(),
      2,
      8,
    ).refine(unique),
  })
  .strict();
const variantRecord = z
  .object({
    id,
    optionValues: z.record(id, id),
    price: moneySchema,
    compareAtPrice: moneySchema.optional(),
    availability: availabilitySchema,
    destination: destinationSchema.optional(),
  })
  .strict();
export const variantSchema = variantRecord.refine(
  validPricePair,
  "Variant compare-at price must share its billing basis and currency",
);
export const featureSchema = z
  .object({
    id,
    title: text(100),
    description: text(500),
    media: mediaSchema.optional(),
  })
  .strict();
export const badgeSchema = text(40);
export const collectionSchema = z
  .object({
    id,
    slug: id.optional(),
    title: text(80),
    description: text(200),
    media: mediaSchema,
    productCount: z.number().int().nonnegative(),
    destination: destinationSchema,
  })
  .strict();
export const categorySchema = collectionSchema;
export const productSchema = summaryShape
  .extend({
    specifications: list(specificationSchema, 0, 40).optional(),
    materials: list(featureSchema, 0, 20).optional(),
    features: list(featureSchema, 0, 20).optional(),
    options: list(optionSchema, 0, 3).refine(unique).optional(),
    variants: list(variantSchema, 0, 40).refine(unique).optional(),
  })
  .refine(validPricePair, "Invalid price comparison")
  .refine(
    (p) => p.media.filter((m) => m.role === "primary").length <= 1,
    "Only one primary asset is allowed",
  )
  .superRefine((value, ctx) => {
    if (value.variants?.length && !value.options?.length)
      ctx.addIssue({
        code: "custom",
        message: "Variants require declared options",
      });
    if (value.options?.length && value.variants?.length)
      validateOptionRelationships(
        { ...value, options: value.options, variants: value.variants },
        ctx,
      );
  });
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductIdentity = z.infer<typeof productIdentitySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductMedia = z.infer<typeof mediaSchema>;
export type Money = z.infer<typeof moneySchema>;
export type ProductPrice = Money;
export type ProductOption = z.infer<typeof optionSchema>;
export type ProductVariant = z.infer<typeof variantSchema>;
export type ProductCollection = z.infer<typeof collectionSchema>;
export type ProductCategory = z.infer<typeof categorySchema>;
export type ProductBadge = z.infer<typeof badgeSchema>;
export type ProductSpecification = z.infer<typeof specificationSchema>;
export type ProductFeature = z.infer<typeof featureSchema>;

/** Shared semantic integrity for full normalized products and the narrower option worksheet. */
export function validateOptionRelationships(
  value: {
    options: ProductOption[];
    variants: ProductVariant[];
    product?: { price: Money };
    price?: Money;
  },
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (const [index, variant] of value.variants.entries()) {
    if (
      Object.keys(variant.optionValues).length !== value.options.length ||
      value.options.some(
        (o) => !o.values.some((v) => v.id === variant.optionValues[o.id]),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["variants", index, "optionValues"],
        message: "Variant must reference one valid value for every option",
      });
    const key = value.options.map((o) => variant.optionValues[o.id]).join("|");
    if (seen.has(key))
      ctx.addIssue({
        code: "custom",
        path: ["variants", index],
        message: "Variant combinations must be unique",
      });
    seen.add(key);
    if (
      variant.price.currency !==
      (value.product?.price.currency ?? value.price?.currency)
    )
      ctx.addIssue({
        code: "custom",
        path: ["variants", index, "price"],
        message: "Variant currency must match product currency",
      });
  }
}
