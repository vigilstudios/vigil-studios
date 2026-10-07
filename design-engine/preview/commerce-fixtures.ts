import { parseSection, type SectionInstance } from "../composition/schemas";
import type { CommerceSectionId } from "../composition/commerce-schemas";
import { commerceSectionIds } from "../composition/commerce-contracts";
import { makeCommerceModel } from "./collection-007/fixtures";
import type { CommerceStudyId } from "./collection-007/contracts";
/** Original creative fixtures cross only this Lab boundary; production owns no assets/brand/client copy. */
export function makeCommerceSection<K extends CommerceSectionId>(
  component: K,
  id: string,
  adaptation = "apparel",
  length = "standard",
): SectionInstance<K> {
  const index = commerceSectionIds.indexOf(component),
    context = adaptation === "beauty" ? 1 : adaptation === "audio" ? 2 : 0;
  const model = makeCommerceModel(
    `P${String(index + 1).padStart(2, "0")}` as CommerceStudyId,
    context,
    length === "long" ? "long-copy" : "authored",
  );
  const { brand, ...raw } = model.content;
  const content = JSON.parse(JSON.stringify(raw), (key, value) =>
    key === "href" && typeof value === "string"
      ? `https://example.com/${value.slice(1)}`
      : value,
  );
  if (index === 1) {
    const categories = [
      ...new Set(content.products.map((p: { category: string }) => p.category)),
    ] as string[];
    content.catalog = {
      scope: "provided-slice",
      filters: [
        {
          id: "category",
          label: "Category",
          values: categories.map((label, i) => ({
            id: `category-${i}`,
            label,
          })),
        },
        {
          id: "availability",
          label: "Availability",
          values: [
            { id: "available", label: "Available" },
            { id: "unavailable", label: "Unavailable" },
            { id: "preorder", label: "Pre-order" },
            { id: "unknown", label: "Not supplied" },
          ],
        },
      ],
      sorts: content.products.every(
        (p: { price: { mode: string } }) => p.price.mode === "fixed",
      )
        ? [
            { id: "editorial", label: "Editorial order" },
            { id: "ascending", label: "Price: low to high" },
            { id: "descending", label: "Price: high to low" },
          ]
        : [{ id: "editorial", label: "Editorial order" }],
      selected: { filters: {}, sort: "editorial" },
      resultCount: content.products.length,
    };
  }
  if (index === 5) {
    const products = new Map();
    for (const look of content.looks) {
      look.items = look.products.map((p: { productId: string }, i: number) => {
        products.set(p.productId, p);
        return { productId: p.productId, role: look.roles[i] };
      });
      delete look.products;
      delete look.roles;
    }
    content.products = [...products.values()];
  }
  if (index === 7) {
    const { productId, title, slug, description, destination, media } =
      content.product;
    content.product = {
      productId,
      title,
      slug,
      description,
      destination,
      media,
    };
  }
  if (index === 8)
    for (const stage of content.stages)
      if (stage.media)
        stage.mediaCaption =
          "Finished-object reference, not a process photograph.";
  if (index === 12)
    for (const criterion of content.criteria)
      criterion.values = Object.fromEntries(
        content.products.map((p: { productId: string }, i: number) => [
          p.productId,
          criterion.values[i],
        ]),
      );
  // Production fixture delivery uses optimized candidates and actual 240px thumbnails, never the full macro for thumbnails.
  const delivery = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(delivery);
    if (value && typeof value === "object") {
      const record = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, delivery(v)]),
      ) as Record<string, unknown>;
      if (
        typeof record.src === "string" &&
        record.src.startsWith("/design-engine-study-007/")
      ) {
        const name = record.src.split("/").pop()!.replace(".webp", "");
        record.srcSet = `/design-engine-commerce/${name}-640.webp 640w, ${record.src} ${record.width}w`;
        record.sizes = "(max-width:700px) 90vw, 60vw";
      }
      if (record.kind && record.id && record.label) {
        const image = (record.image ??
          (record.video as { poster?: unknown } | undefined)?.poster) as
          { src: string; width: number; height: number } | undefined;
        if (image?.src.startsWith("/design-engine-study-007/")) {
          record.thumbnail = {
            ...image,
            src: image.src
              .replace("/design-engine-study-007/", "/design-engine-commerce/")
              .replace(".webp", "-240.webp"),
            width: 240,
            height: Math.round((240 * image.height) / image.width),
            srcSet: undefined,
            sizes: undefined,
          };
        }
      }
      return record;
    }
    return value;
  };
  return parseSection({
    component,
    id,
    content: delivery({ ...content, eyebrow: brand }),
    structure: "authored",
    motion: "none",
    treatment: { geometry: "contained", tone: "natural" },
  }) as SectionInstance<K>;
}
