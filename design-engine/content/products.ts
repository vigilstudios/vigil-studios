import { collectionCapabilities, productSourceId, type ContentHubDisplay } from "./settings";
import { parseSection, sectionSchemas, type SectionInstance } from "../composition/schemas";
import type { SiteDefinition } from "../site/model";
export type ProductChoice = { id: string; title: string; featured: boolean; featuredOrder?: number; value: Record<string, unknown> };
export type ProductCatalogue = { key: string; label: string; products: ProductChoice[] };
export const collectionKey = (page: string, section: string, field: string) => `${page}-${section}-${field}`.slice(0, 180);
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
export function localProductCatalogues(site: SiteDefinition): ProductCatalogue[] {
  return site.pages.flatMap(page => page.sections.flatMap(section => collectionCapabilities(section.component, sectionSchemas[section.component]).filter(c => c.module === "products" && (!section.contentHub?.[c.field]?.catalogue || section.contentHub[c.field].catalogue === collectionKey(page.id, section.id, c.field))).map(c => {
    const raw = object(section.content)[c.field], rows = Array.isArray(raw) ? raw : [raw];
    return { key: collectionKey(page.id, section.id, c.field), label: `${page.title} · ${String(object(section.content).title ?? section.id)} · ${c.field}`, products: rows.map(value => ({ id: productSourceId(value), title: String(object(object(value).product ?? value).title ?? "Product"), featured: false, value: object(value) })) };
  })));
}
export function selectedProducts(source: ProductCatalogue, setting: ContentHubDisplay): ProductChoice[] {
  if (setting.mode === "selected") return setting.productIds!.flatMap(id => source.products.filter(p => p.id === id));
  if (setting.mode === "featured") return source.products.filter(p => p.featured && (!setting.mediaType || (object(p.value.product ?? p.value).media as {kind:string}[] | undefined)?.some(media => media.kind === setting.mediaType))).sort((a,b)=>(a.featuredOrder??Infinity)-(b.featuredOrder??Infinity)).slice(0, setting.capacity);
  return source.products;
}
/** Reuse the target's design wrapper, never another component's editorial structure. */
export function materializeProducts(section: SectionInstance, field: string, products: ProductChoice[]): SectionInstance {
  const capability = collectionCapabilities(section.component, sectionSchemas[section.component]).find(c => c.field === field && c.module === "products");
  if (!capability) throw Error("This component does not display individual products.");
  if (products.length < capability.minimum || products.length > capability.maximum) throw Error(`This design needs ${capability.minimum}–${capability.maximum} products. Choose a compatible selection or a larger catalogue design.`);
  const content = object(section.content), value = content[field], templates = Array.isArray(value) ? value : [value];
  if (section.component === "commerce.option-atelier" && products.some(p => !templates.some(row => productSourceId(row) === p.id))) throw Error("Configure this product’s options and variants before connecting it to this design.");
  const rows = products.map(choice => {
    const template = object(templates.find(row => productSourceId(row) === choice.id) ?? templates[0]);
    const source = object(choice.value.product ?? choice.value);
    // Identity-only components deliberately omit price/commerce fields.
    const product = capability.pricedProducts ? { ...source } : Object.fromEntries(Object.entries(source).filter(([key]) => ["productId", "title", "slug", "description", "media", "destination"].includes(key)));
    if ("product" in template) return { ...template, product };
    return product;
  });
  try { return parseSection({ ...section, content: { ...content, [field]: capability.singleton ? rows[0] : rows } }); }
  catch { throw Error("These products do not match this design’s supporting content. Update its looks, comparison values or product options before using this selection."); }
}

/** Shared Hub fields are edited once; surrounding campaign/editorial content stays in the Lab. */
export function hubOwnsProductPath(section:SectionInstance,path:(string|number)[]):boolean{
 if(path[0]!=="content"||!section.contentHub?.[String(path[1])]?.catalogue)return false;
 const value=object(section.content)[String(path[1])],rows=Array.isArray(value)?value:[value];
 return !rows.some(row=>"product" in object(row))||path.slice(2).includes("product");
}
