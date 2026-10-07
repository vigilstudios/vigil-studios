import { makeCommerceSection } from "./commerce-fixtures";
import { parseSection, type SectionInstance } from "../composition/schemas";
import type { CommerceSectionId } from "../composition/commerce-schemas";
/** Finite boundary/media fixtures for QA only. No production content generation. */
export function makeCommerceBounds(
  component: CommerceSectionId,
  id: string,
  adaptation = "apparel",
  length = "standard",
  stress = "authored",
): SectionInstance {
  const section = makeCommerceSection(component, id, adaptation, length);
  if (stress === "authored") return section;
  const c = structuredClone(section.content) as unknown as Record<
    string,
    unknown
  >;
  const expand = (key: string, count: number) => {
    const rows = c[key] as Record<string, unknown>[];
    c[key] = Array.from({ length: count }, (_, i) => {
      const row = structuredClone(rows[i % rows.length]);
      if ("id" in row) row.id = `record-${i}`;
      if ("productId" in row) row.productId = `product-${i}`;
      if (row.product)
        (row.product as Record<string, unknown>).productId = `product-${i}`;
      if (row.media) (row.media as Record<string, unknown>).id = `media-${i}`;
      return row;
    });
  };
  if (stress === "minimum" || stress === "maximum") {
    const max = stress === "maximum";
    switch (component) {
      case "commerce.merchant-edit":
        expand("items", max ? 5 : 3);
        break;
      case "commerce.catalog-ledger":
        expand("products", max ? 24 : 5);
        break;
      case "commerce.object-pedestal":
        expand("specifications", max ? 4 : 2);
        break;
      case "commerce.release-signal":
        break;
      case "commerce.collection-atlas":
        expand("collections", max ? 5 : 3);
        break;
      case "commerce.look-objects": {
        const looks = c.looks as Record<string, unknown>[];
        expand("products", max ? 12 : 2);
        const products = c.products as { productId: string }[];
        c.looks = Array.from({ length: max ? 3 : 1 }, (_, i) => ({
          ...structuredClone(looks[i % looks.length]),
          id: `look-${i}`,
          items: Array.from({ length: max ? 4 : 2 }, (_, j) => ({
            productId:
              products[(i * (max ? 4 : 2) + j) % products.length].productId,
            role: `Authored role ${j + 1}`,
          })),
        }));
        break;
      }
      case "commerce.campaign-interleave":
        expand("spreads", max ? 4 : 2);
        break;
      case "commerce.material-anatomy":
        expand("materials", max ? 5 : 3);
        break;
      case "commerce.origin-receipt":
        expand("stages", max ? 5 : 3);
        break;
      case "commerce.inspection-desk":
        expand("gallery", max ? 8 : 2);
        break;
      case "commerce.vertical-product-folio":
        expand("plates", max ? 6 : 2);
        break;
      case "commerce.option-atelier": {
        const options = c.options as Record<string, unknown>[];
        c.options = Array.from({ length: max ? 3 : 1 }, (_, i) => ({
          ...structuredClone(options[i % options.length]),
          id: `option-${i}`,
          name: `Option ${i + 1}`,
          values: Array.from({ length: max ? 8 : 2 }, (_, j) => ({
            id: `value-${j}`,
            label: `Configuration ${j + 1}`,
          })),
        }));
        const groups = c.options as { id: string; values: { id: string }[] }[];
        const product = c.product as { price: unknown };
        c.variants = Array.from({ length: max ? 40 : 1 }, (_, i) => ({
          id: `variant-${i}`,
          price: product.price,
          availability: "available",
          optionValues: Object.fromEntries(
            groups.map((g, j) => [
              g.id,
              g.values[Math.floor(i / (max ? 8 : 2) ** j) % (max ? 8 : 2)].id,
            ]),
          ),
        }));
        break;
      }
      case "commerce.comparison-bench": {
        expand("products", max ? 4 : 2);
        expand("criteria", max ? 8 : 3);
        const products = c.products as { productId: string }[];
        for (const criterion of c.criteria as {
          values: Record<string, string>;
        }[]) {
          const values = Object.values(criterion.values);
          criterion.values = Object.fromEntries(
            products.map((p, i) => [p.productId, values[i % values.length]]),
          );
        }
        break;
      }
      case "commerce.companion-rail":
        expand("relatedProducts", max ? 6 : 2);
        break;
    }
  }
  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === "object") {
      const row = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, rewrite(v)]),
      );
      if (stress === "no-media" && Array.isArray(row.media)) row.media = [];
      if (stress === "failed-media" && typeof row.src === "string") {
        row.src = "data:image/webp;base64,AA==";
        delete row.srcSet;
        delete row.mobileSrc;
      }
      if (
        (stress === "portrait" || stress === "landscape") &&
        typeof row.src === "string" &&
        row.alt
      ) {
        row.width = stress === "portrait" ? 400 : 1600;
        row.height = stress === "portrait" ? 1600 : 400;
        row.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${row.width}" height="${row.height}"><rect width="100%" height="100%" fill="#b0aaa0"/></svg>`)}`;
        delete row.srcSet;
        delete row.mobileSrc;
      }
      return row;
    }
    return value;
  };
  return parseSection({ ...section, content: rewrite(c) });
}
