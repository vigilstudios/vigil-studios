"use client";
import { useState } from "react";
import { sectionSchemas, parseSection, type SectionInstance } from "../../composition/schemas";
import { collectionCapabilities, type ContentHubSettings, type CollectionCapability, type ContentHubDisplay } from "../../content/settings";
import { collectionKey, localProductCatalogues, materializeProducts, selectedProducts, type ProductCatalogue } from "../../content/products";
import type { SiteDefinition } from "../../site/model";

export function ContentHubControls({ section, onChange, site, pageId, catalogues }: { section: SectionInstance; onChange: (value: SectionInstance) => void; site?: SiteDefinition; pageId?: string; catalogues?: ProductCatalogue[] }) {
  const capabilities = collectionCapabilities(section.component, sectionSchemas[section.component]);
  // Retain the complete demo catalogue when a preview narrows to a subset. Real
  // projects receive the complete, authorized Hub catalogue from the workspace.
  const [examples] = useState(() => site ? localProductCatalogues(site) : []);
  if (!capabilities.length) return null;
  const sources = catalogues ?? examples;
  function change(field: string, value: ContentHubSettings[string] | undefined) {
    const contentHub = { ...section.contentHub };
    if (value) contentHub[field] = value; else delete contentHub[field];
    onChange(parseSection({ ...section, contentHub: Object.keys(contentHub).length ? contentHub : undefined }));
  }
  return <section className="composition-panel"><h2>Content Hub display</h2><p>Connect content once, then choose what this design displays.</p>{capabilities.map(c => {
    if (c.module === "products" && site && pageId) return <ProductDisplayControl key={c.field} section={section} capability={c} ownKey={collectionKey(pageId, section.id, c.field)} sources={sources} onChange={onChange} />;
    const setting = section.contentHub?.[c.field], raw = (section.content as Record<string, unknown>)[c.field], size = Array.isArray(raw) ? raw.length : 1, minimum = Math.max(1, c.minimum);
    return <div className="composition-controls" key={c.field}><label className="composition-control"><span><input type="checkbox" checked={Boolean(setting)} onChange={e => change(c.field, e.target.checked ? { mode: "featured", capacity: Math.max(minimum, Math.min(size, c.maximum)), label: `Featured ${c.module === "faq" ? "questions" : c.module}` } : undefined)} /> Use featured {c.module === "faq" ? "questions" : c.module}</span></label><p>This component fits {c.minimum}–{c.maximum} items. {setting ? "Other entries stay in the full collection." : "Every entry appears here."}</p>{setting && <><label className="composition-control">Featured section name<input maxLength={160} value={setting.label} onChange={e => { if (e.target.value.trim()) change(c.field, { ...setting, label: e.target.value }); }} /></label><label className="composition-control">Display positions<select value={setting.capacity} onChange={e => change(c.field, { ...setting, capacity: Number(e.target.value) })}>{Array.from({ length: c.maximum - minimum + 1 }, (_, i) => <option key={i + minimum} value={i + minimum}>{i + minimum}</option>)}</select></label>{c.hasMedia && <label className="composition-control">Eligible featured media<select value={setting.mediaType ?? "any"} onChange={e => { const next = { ...setting }; if (e.target.value === "any") delete next.mediaType; else next.mediaType = e.target.value as "image" | "video"; change(c.field, next); }}><option value="any">Any supported media</option><option value="image">Photos</option><option value="video">Videos</option></select></label>}</>}</div>;
  })}</section>;
}

function ProductDisplayControl({ section, capability: c, ownKey, sources, onChange }: { section: SectionInstance; capability: CollectionCapability; ownKey: string; sources: ProductCatalogue[]; onChange: (value: SectionInstance) => void }) {
  const setting = section.contentHub?.[c.field], baseline = JSON.stringify(setting);
  const initial = (): ContentHubDisplay => setting ?? { mode: "all", catalogue: ownKey, capacity: c.maximum, label: "Products" };
  const [draft, setDraft] = useState({ base: baseline, value: initial() });
  const [error, setError] = useState("");
  if (draft.base !== baseline) setDraft({ base: baseline, value: initial() });
  const value = draft.base === baseline ? draft.value : initial(), sourceKey = value.catalogue ?? ownKey, source = sources.find(s => s.key === sourceKey);
  const selected = value.productIds ?? [], total = source ? selectedProducts(source, value).length : 0;
  function patch(patch: Partial<ContentHubDisplay>) { setError(""); setDraft({ base: baseline, value: { ...value, ...patch } }); }
  function apply() {
    if (!source) { setError("Choose an available catalogue from this website."); return; }
    const next: ContentHubDisplay = { ...value, catalogue: source.key };
    if (next.mode !== "selected") delete next.productIds;
    try {
      const updated = materializeProducts(section, c.field, selectedProducts(source, next));
      onChange(parseSection({ ...updated, contentHub: { ...section.contentHub, [c.field]: next } })); setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Check this product selection."); }
  }
  return <div className="composition-product-display"><h3>{c.field === "product" || c.field === "anchor" ? "Product source" : "Products to display"}</h3>
    <label className="composition-control">Content Hub catalogue<select value={sourceKey} onChange={e => patch({ catalogue: e.target.value, productIds: value.mode === "selected" ? [] : undefined })}>{!source && <option value={sourceKey}>Save new sections and reload to connect their catalogue</option>}{sources.map(s => <option key={s.key} value={s.key}>{s.label} · {s.products.length} products</option>)}</select></label>
    <label className="composition-control">Display<select value={value.mode} onChange={e => patch({ mode: e.target.value as ContentHubDisplay["mode"], productIds: e.target.value === "selected" ? selected : undefined })}><option value="all">All products</option><option value="featured">Featured products</option><option value="selected">Specific products</option></select></label>
    {value.mode === "featured" && <><label className="composition-control">Maximum featured products<input type="number" min={Math.max(1, c.minimum)} max={c.maximum} value={value.capacity} onChange={e => patch({ capacity: Number(e.target.value) })} /></label><p>Mark featured products in Content Hub. Published selections update this component automatically.</p></>}
    {value.mode === "selected" && <fieldset className="composition-product-choices"><legend>Choose products · {selected.length} selected</legend>{source?.products.map(product => <label key={product.id}><input type="checkbox" checked={selected.includes(product.id)} onChange={e => patch({ productIds: e.target.checked ? [...selected, product.id] : selected.filter(id => id !== product.id) })} />{product.title}</label>)}<p>Products appear in the order you select them.</p></fieldset>}
    <p>This design fits {c.minimum === c.maximum ? c.maximum : `${c.minimum}–${c.maximum}`} {c.singleton ? "product" : "products"}. {total} will display. Choosing fewer keeps the rest in Content Hub.</p>
    <button type="button" onClick={apply}>Apply product display</button>{error && <p role="alert">{error}</p>}
    <p>Names, descriptions and images are edited in Content Hub. Product-specific looks, comparison values, options and editorial copy remain part of the design.</p>
  </div>;
}
