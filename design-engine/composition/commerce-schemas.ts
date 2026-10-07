import { z } from "zod";
import {
  commerceIdSchema as id,
  mediaSchema,
  productSummarySchema,
  productIdentitySchema,
  collectionSchema,
  specificationSchema,
  optionSchema,
  variantSchema,
  validateOptionRelationships,
} from "../commerce/types";
import { treatmentSchema } from "../media/types";
import { catalogPresentationSchema } from "../commerce/catalog";
const text = (max = 240) => z.string().trim().min(1).max(max);
const unique = <T extends { id: string }>(items: T[]) =>
  new Set(items.map((i) => i.id)).size === items.length;
const list = <T extends z.ZodTypeAny>(schema: T, min: number, max: number) =>
  z.array(schema).min(min).max(max);
const products = (min: number, max: number) =>
  list(productSummarySchema, min, max).refine(
    (items) => new Set(items.map((p) => p.productId)).size === items.length,
    "Product IDs must be unique",
  );
const base = {
  eyebrow: text(100).optional(),
  title: text(180),
  introduction: text(600),
};
const editItem = z
  .object({ product: productSummarySchema, note: text(180) })
  .strict();
const plate = z.object({ id, media: mediaSchema, caption: text(200) }).strict();
const optionAtelier = z
  .object({
    ...base,
    product: productSummarySchema,
    options: list(optionSchema, 1, 3).refine(unique),
    variants: list(variantSchema, 1, 40).refine(unique),
    guidance: text(300),
  })
  .strict()
  .superRefine(validateOptionRelationships);
export const commerceContentSchemas = {
  "commerce.merchant-edit": z
    .object({
      ...base,
      editorialNote: text(320),
      items: list(editItem, 3, 5).refine(
        (v) => new Set(v.map((i) => i.product.productId)).size === v.length,
        "Editorial product IDs must be unique",
      ),
    })
    .strict(),
  "commerce.catalog-ledger": z
    .object({
      ...base,
      products: products(0, 24),
      catalog: catalogPresentationSchema,
      totalCatalogLabel: text(100),
    })
    .strict()
    .refine(
      (v) =>
        v.catalog.scope !== "provided-slice" ||
        (v.catalog.filters.every((f) =>
          ["category", "availability"].includes(f.id),
        ) &&
          v.catalog.sorts.every((s) =>
            ["editorial", "ascending", "descending"].includes(s.id),
          ) &&
          (!v.catalog.sorts.some((s) => s.id !== "editorial") ||
            v.products.every(
              (p) =>
                !v.products[0] ||
                (p.price.currency === v.products[0].price.currency &&
                  p.price.mode === v.products[0].price.mode &&
                  p.price.interval === v.products[0].price.interval),
            ))),
      "Local slice refinement requires supported facets/sorts and a shared price basis",
    ),
  "commerce.object-pedestal": z
    .object({
      ...base,
      product: productSummarySchema,
      specifications: list(specificationSchema, 2, 4).refine(unique),
      edition: text(80),
    })
    .strict(),
  "commerce.release-signal": z
    .object({
      ...base,
      product: productSummarySchema,
      campaignMedia: mediaSchema,
      release: text(100),
      statement: text(120),
    })
    .strict(),
  "commerce.collection-atlas": z
    .object({
      ...base,
      collections: list(collectionSchema, 3, 5).refine(unique),
    })
    .strict(),
  "commerce.look-objects": z
    .object({
      ...base,
      products: products(2, 12),
      looks: list(
        z
          .object({
            id,
            title: text(80),
            campaignMedia: mediaSchema,
            caption: text(200),
            items: list(
              z.object({ productId: id, role: text(80) }).strict(),
              2,
              4,
            ).refine(
              (v) => new Set(v.map((i) => i.productId)).size === v.length,
            ),
          })
          .strict(),
        1,
        3,
      ).refine(unique),
    })
    .strict()
    .refine(
      (v) =>
        v.looks.every((l) =>
          l.items.every((i) =>
            v.products.some((p) => p.productId === i.productId),
          ),
        ),
      "Every look item must reference a supplied product",
    ),
  "commerce.campaign-interleave": z
    .object({
      ...base,
      spreads: list(
        z
          .object({
            id,
            title: text(80),
            story: text(300),
            campaignMedia: mediaSchema,
            product: productSummarySchema,
          })
          .strict(),
        2,
        4,
      ).refine(unique),
    })
    .strict(),
  "commerce.material-anatomy": z
    .object({
      ...base,
      product: productIdentitySchema,
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
  "commerce.origin-receipt": z
    .object({
      ...base,
      product: productSummarySchema,
      stages: list(
        z
          .object({
            id,
            title: text(80),
            place: text(80),
            story: text(300),
            evidence: text(160),
            media: mediaSchema.optional(),
            mediaCaption: text(200).optional(),
          })
          .strict(),
        3,
        5,
      ).refine(unique),
    })
    .strict(),
  "commerce.inspection-desk": z
    .object({
      ...base,
      product: productSummarySchema,
      gallery: list(plate, 2, 8)
        .refine(unique)
        .refine(
          (v) => unique(v.map((p) => p.media)),
          "Gallery media IDs must be unique",
        ),
    })
    .strict(),
  "commerce.vertical-product-folio": z
    .object({
      ...base,
      product: productSummarySchema,
      plates: list(plate, 2, 6).refine(unique),
    })
    .strict(),
  "commerce.option-atelier": optionAtelier,
  "commerce.comparison-bench": z
    .object({
      ...base,
      products: products(2, 4),
      criteria: list(
        z
          .object({ id, label: text(60), values: z.record(id, text(120)) })
          .strict(),
        3,
        8,
      ).refine(unique),
    })
    .strict()
    .refine(
      (v) =>
        v.criteria.every(
          (c) =>
            Object.keys(c.values).length === v.products.length &&
            v.products.every((p) => p.productId in c.values),
        ) &&
        v.products.every(
          (p) => p.price.currency === v.products[0].price.currency,
        ),
      "Comparison requires aligned values and a single currency",
    ),
  "commerce.companion-rail": z
    .object({
      ...base,
      anchor: productSummarySchema,
      relatedProducts: list(
        z
          .object({
            product: productSummarySchema,
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

export type CommerceSectionId = keyof typeof commerceContentSchemas;
export type CommerceContent<K extends CommerceSectionId> = z.infer<
  (typeof commerceContentSchemas)[K]
>;
const common = {
  structure: z.literal("authored"),
  motion: z.literal("none"),
  treatment: treatmentSchema.extend({ geometry: z.literal("contained") }),
};
export const commerceSectionSchemas = {
  "commerce.merchant-edit": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.merchant-edit"],
    })
    .strict(),
  "commerce.catalog-ledger": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.catalog-ledger"],
    })
    .strict(),
  "commerce.object-pedestal": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.object-pedestal"],
    })
    .strict(),
  "commerce.release-signal": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.release-signal"],
    })
    .strict(),
  "commerce.collection-atlas": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.collection-atlas"],
    })
    .strict(),
  "commerce.look-objects": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.look-objects"],
    })
    .strict(),
  "commerce.campaign-interleave": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.campaign-interleave"],
    })
    .strict(),
  "commerce.material-anatomy": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.material-anatomy"],
    })
    .strict(),
  "commerce.origin-receipt": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.origin-receipt"],
    })
    .strict(),
  "commerce.inspection-desk": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.inspection-desk"],
    })
    .strict(),
  "commerce.vertical-product-folio": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.vertical-product-folio"],
    })
    .strict(),
  "commerce.option-atelier": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.option-atelier"],
      initialChoices: z.record(id, id).optional(),
    })
    .strict()
    .refine(
      (v) =>
        !v.initialChoices ||
        (Object.keys(v.initialChoices).length === v.content.options.length &&
          v.content.options.every((o) =>
            o.values.some((value) => value.id === v.initialChoices?.[o.id]),
          )),
      "Initial choices must name one valid value per option",
    ),
  "commerce.comparison-bench": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.comparison-bench"],
    })
    .strict(),
  "commerce.companion-rail": z
    .object({
      ...common,
      content: commerceContentSchemas["commerce.companion-rail"],
    })
    .strict(),
} as const;
