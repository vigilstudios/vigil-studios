import { z } from "zod";
import { imageSchema, videoSchema } from "../../media/types";

const text = (max = 240) => z.string().trim().min(1).max(max);
const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
export const destinationSchema = z
  .object({
    label: text(80),
    href: z
      .string()
      .max(500)
      .refine(
        (v) => /^(\/(?!\/)|https?:\/\/|#[a-z0-9-]+$)/.test(v),
        "Expected a host-owned route, URL or local anchor",
      ),
  })
  .strict();
export const moneySchema = z
  .object({
    amountMinor: z.number().int().nonnegative().max(1e12),
    currency: z.enum(["USD", "EUR", "GBP", "JPY", "KWD"]),
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
const unique = <T extends { id: string }>(items: T[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const list = <T extends z.ZodTypeAny>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);
export const mediaSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("image"),
      id,
      label: text(80),
      image: imageSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("video"),
      id,
      label: text(80),
      video: videoSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("interactive-placeholder"),
      id,
      label: text(80),
      image: imageSchema,
      explanation: text(),
    })
    .strict(),
]);
const specification = z
  .object({ id, label: text(60), value: text(120) })
  .strict();
// Study-only normalized presentation data. No provider identifiers, cart or stock quantities.
export const productSchema = z
  .object({
    productId: id,
    title: text(100),
    slug: id,
    description: text(500),
    price: moneySchema,
    compareAtPrice: moneySchema.optional(),
    media: list(mediaSchema, 0, 8).refine(unique, "Media IDs must be unique"),
    category: text(60),
    collection: text(80).optional(),
    badges: list(text(40), 0, 3).default([]),
    availability: availabilitySchema,
    destination: destinationSchema,
  })
  .strict()
  .refine(
    (p) =>
      !p.compareAtPrice ||
      (p.compareAtPrice.currency === p.price.currency &&
        p.compareAtPrice.amountMinor > p.price.amountMinor &&
        p.compareAtPrice.mode === p.price.mode &&
        p.compareAtPrice.interval === p.price.interval),
    "Compare-at price must be larger, in the same currency and billing basis",
  );
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
export const variantSchema = z
  .object({
    id,
    optionValues: z.record(id, id),
    price: moneySchema,
    availability: availabilitySchema,
  })
  .strict();
const products = (min: number, max: number) =>
  list(productSchema, min, max).refine(
    (items) => new Set(items.map((p) => p.productId)).size === items.length,
    "Product IDs must be unique",
  );
const base = { brand: text(60), title: text(100), introduction: text(300) };
const editItem = z.object({ product: productSchema, note: text(180) }).strict();
const plate = z.object({ id, media: mediaSchema, caption: text(200) }).strict();
const optionAtelier = z
  .object({
    ...base,
    product: productSchema,
    options: list(optionSchema, 1, 3).refine(unique),
    variants: list(variantSchema, 1, 40).refine(unique),
    guidance: text(300),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const variant of value.variants) {
      const keys = Object.keys(variant.optionValues);
      if (
        keys.length !== value.options.length ||
        value.options.some(
          (option) =>
            !option.values.some(
              (v) => v.id === variant.optionValues[option.id],
            ),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Variant must reference one valid value for every option",
        });
      const key = value.options
        .map((o) => variant.optionValues[o.id])
        .join("|");
      if (seen.has(key))
        ctx.addIssue({
          code: "custom",
          message: "Variant combinations must be unique",
        });
      seen.add(key);
      if (variant.price.currency !== value.product.price.currency)
        ctx.addIssue({
          code: "custom",
          message: "Variant currency must match product currency",
        });
    }
  });
export const commerceStudySchemas = {
  P01: z
    .object({ ...base, editorialNote: text(320), items: list(editItem, 3, 5) })
    .strict(),
  P02: z
    .object({
      ...base,
      products: products(5, 24),
      totalCatalogLabel: text(100),
    })
    .strict(),
  P03: z
    .object({
      ...base,
      product: productSchema,
      specifications: list(specification, 2, 4),
      edition: text(80),
    })
    .strict(),
  P04: z
    .object({
      ...base,
      product: productSchema,
      campaignMedia: mediaSchema,
      release: text(100),
      statement: text(120),
    })
    .strict(),
  P05: z
    .object({
      ...base,
      collections: list(
        z
          .object({
            id,
            title: text(80),
            description: text(200),
            media: mediaSchema,
            productCount: z.number().int().positive(),
            destination: destinationSchema,
          })
          .strict(),
        3,
        5,
      ).refine(unique),
    })
    .strict(),
  P06: z
    .object({
      ...base,
      looks: list(
        z
          .object({
            id,
            title: text(80),
            campaignMedia: mediaSchema,
            caption: text(200),
            products: products(2, 4),
            roles: list(text(80), 2, 4),
          })
          .strict()
          .refine(
            (v) => v.products.length === v.roles.length,
            "Every product needs its authored look relationship",
          ),
        1,
        3,
      ).refine(unique),
    })
    .strict(),
  P07: z
    .object({
      ...base,
      spreads: list(
        z
          .object({
            id,
            title: text(80),
            story: text(300),
            campaignMedia: mediaSchema,
            product: productSchema,
          })
          .strict(),
        2,
        4,
      ).refine(unique),
    })
    .strict(),
  P08: z
    .object({
      ...base,
      product: productSchema,
      materials: list(
        z
          .object({
            id,
            name: text(70),
            detail: text(260),
            media: mediaSchema,
            evidence: text(160),
          })
          .strict(),
        3,
        5,
      ).refine(unique),
    })
    .strict(),
  P09: z
    .object({
      ...base,
      product: productSchema,
      stages: list(
        z
          .object({
            id,
            title: text(80),
            place: text(80),
            story: text(300),
            evidence: text(160),
            media: mediaSchema.optional(),
          })
          .strict(),
        3,
        5,
      ).refine(unique),
    })
    .strict(),
  P10: z
    .object({
      ...base,
      product: productSchema,
      gallery: list(plate, 2, 8).refine(unique),
    })
    .strict(),
  P11: z
    .object({
      ...base,
      product: productSchema,
      plates: list(plate, 2, 6).refine(unique),
    })
    .strict(),
  P12: optionAtelier,
  P13: z
    .object({
      ...base,
      products: products(2, 4),
      criteria: list(
        z
          .object({ id, label: text(60), values: list(text(120), 2, 4) })
          .strict(),
        3,
        8,
      ).refine(unique),
    })
    .strict()
    .refine(
      (v) =>
        v.criteria.every((c) => c.values.length === v.products.length) &&
        v.products.every(
          (p) => p.price.currency === v.products[0].price.currency,
        ),
      "Comparison requires aligned values and a single currency",
    ),
  P14: z
    .object({
      ...base,
      anchor: productSchema,
      relatedProducts: list(
        z
          .object({
            product: productSchema,
            relationship: text(100),
            reason: text(240),
          })
          .strict(),
        2,
        6,
      ),
    })
    .strict()
    .refine(
      (v) =>
        v.relatedProducts.every(
          (p) => p.product.productId !== v.anchor.productId,
        ) &&
        new Set(v.relatedProducts.map((p) => p.product.productId)).size ===
          v.relatedProducts.length,
      "Related products must be distinct and exclude the anchor",
    ),
};
export type CommerceStudyId = keyof typeof commerceStudySchemas;
export type CommerceContent<K extends CommerceStudyId> = z.infer<
  (typeof commerceStudySchemas)[K]
>;
export type CommerceModel = {
  [K in CommerceStudyId]: { kind: K; content: CommerceContent<K> };
}[CommerceStudyId];
export type Product = z.infer<typeof productSchema>;
export type ProductMedia = z.infer<typeof mediaSchema>;
export type Money = z.infer<typeof moneySchema>;
export function formatMoney(price: Money, locale = "en-US") {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
  });
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return `${price.mode === "starting" ? "From " : ""}${formatter.format(price.amountMinor / 10 ** exponent)}${price.interval ? ` / ${price.interval}` : ""}`;
}
