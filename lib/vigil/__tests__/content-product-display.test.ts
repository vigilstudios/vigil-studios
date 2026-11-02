import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { makeCommerceSection } from '@/design-engine/preview/commerce-fixtures';
import { commerceSectionSchemas } from '@/design-engine/composition/commerce-schemas';
import { parseSection, sectionSchemas, type SectionInstance } from '@/design-engine/composition/schemas';
import { siteFromComposition } from '@/design-engine/site/model';
import { collectionCapabilities, featuredDisplaySection, productSourceId } from '@/design-engine/content/settings';
import { collectionKey, materializeProducts, selectedProducts } from '@/design-engine/content/products';
import { ensureProfessionalBindings } from '../content/service';
import { FakeAdmin } from './fake-admin';
import { applyBindings, discoverBindings, productCatalogue, recordsFromLab } from '../content/professional';
const website = 'af000000-0000-4000-8000-000000000001';
const document = (...sections: SectionInstance[]) => siteFromComposition({ id: 'products', label: 'Products', site: { brand: { theme: 'neutral' }, typography: 'neo-grotesk', artDirection: 'precision', motion: 'restrained', icons: { id: 'core', strokeWidth: 1.5 } }, sections });
const catalogue = () => {
 const site = document(makeCommerceSection('commerce.catalog-ledger', 'catalogue'));
 const [collection] = discoverBindings(site, website);
 return { site, collection, source: productCatalogue(collection) };
};
describe('existing commerce family product displays', () => {
 it.each(Object.keys(commerceSectionSchemas).filter(id => id !== 'commerce.collection-atlas'))('%s exposes its real product fields and binds without altering the design', id => {
  const section = makeCommerceSection(id as keyof typeof commerceSectionSchemas, 'design'), caps = collectionCapabilities(id, sectionSchemas[id as keyof typeof sectionSchemas]);
  expect(caps.length).toBeGreaterThan(0);
  const site = document(section), collections = discoverBindings(site, website);
  for (const cap of caps) {
   const collection = collections.find(c => c.binding.field === cap.field); expect(collection).toBeDefined();
   const source = productCatalogue(collection!);
   expect(source.products).toHaveLength(cap.singleton ? 1 : (section.content as unknown as Record<string, unknown[]>)[cap.field].length);
   expect(() => materializeProducts(section, cap.field, source.products)).not.toThrow();
  }
  expect(() => applyBindings(site, collections)).not.toThrow();
 });
 it('does not pretend a collection navigation card is a product list', () => {
  expect(collectionCapabilities('commerce.collection-atlas', sectionSchemas['commerce.collection-atlas'])).toEqual([]);
 });
 it('all, featured and explicit products use stable IDs and selection order', () => {
  const { site, collection, source } = catalogue();
  collection.records[1].featured = true; collection.records[3].featured = true;
  const mode = (display: 'all' | 'featured' | 'selected', ids?: string[]) => {
   const copy = structuredClone(site); copy.pages[0].sections[0].contentHub = { products: { mode: display, capacity: 2, label: 'Products', catalogue: source.key, ...(ids ? { productIds: ids } : {}) } };
   return applyBindings(copy, [collection]);
  };
  const ids = [source.products[3].id, source.products[0].id];
  const selected = mode('selected', ids).pages[0].sections[0];
  expect((selected.content as {products:unknown[]}).products.map(productSourceId)).toEqual(ids);
  expect((featuredDisplaySection(selected).content as {products:unknown[]}).products.map(productSourceId)).toEqual(ids);
  expect((mode('all').pages[0].sections[0].content as {products:unknown[]}).products).toHaveLength(source.products.length);
  expect((mode('featured').pages[0].sections[0].content as {products:unknown[]}).products.map(productSourceId)).toEqual([source.products[1].id,source.products[3].id]);
  const chosen = mode('selected', ids);
  expect(recordsFromLab(chosen, collection)).toEqual(collection.records);
  expect(collection.records.every(r => !r.deleted)).toBe(true);
  expect((site.pages[0].sections[0].content as {products:unknown[]}).products).toHaveLength(source.products.length);
 });
 it('reuses one Hub catalogue in multiple designs without creating another collection', () => {
  const { site, collection, source } = catalogue();
  const card = makeCommerceSection('commerce.object-pedestal', 'featured-product');
  card.contentHub = { product: { mode: 'selected', productIds: [source.products[2].id], capacity: 1, label: 'Product', catalogue: source.key } };
  site.pages[0].sections.push(card);
  expect(discoverBindings(site, website)).toHaveLength(1);
  collection.records[2].data.title = 'Updated in Content Hub';
  const result = applyBindings(site, [collection]);
  expect(JSON.stringify(result.pages[0].sections[1].content)).toContain('Updated in Content Hub');
  expect((result.pages[0].sections[1].content as {product:{productId:string}}).product.productId).toBe(source.products[2].id);
 });
 it('keeps selected configuration in the design snapshot and reads only supplied published records', () => {
  const { site, collection, source } = catalogue();
  site.pages[0].sections[0].contentHub = { products: { mode: 'selected', productIds: [source.products[2].id], capacity: 2, label: 'Products', catalogue: source.key } };
  const published = structuredClone(collection); published.records[2].data.title = 'Published title';
  collection.records[2].data.title = 'Unpublished secret';
  const result = applyBindings(site, [published], true);
  expect(JSON.stringify(result)).toContain('Published title'); expect(JSON.stringify(result)).not.toContain('Unpublished secret');
  expect(applyBindings(site, [], true).pages[0].sections).toHaveLength(0);
  expect(() => applyBindings(site, [], false, 'draft')).toThrow('unavailable');
 });
 it('ignores trashed selections, hides empty published sections and never substitutes another item', () => {
  const { site, collection, source } = catalogue();
  site.pages[0].sections[0].contentHub = { products: { mode: 'selected', productIds: [source.products[0].id], capacity: 1, label: 'Products', catalogue: source.key } };
  collection.records[0].deleted = true;
  expect(applyBindings(site, [collection], true).pages[0].sections).toHaveLength(0);
  expect(selectedProducts(productCatalogue(collection), site.pages[0].sections[0].contentHub!.products)).toEqual([]);
 });
 it('rejects duplicate IDs, unrelated settings and incompatible component capacity', () => {
  const { source } = catalogue(), section = makeCommerceSection('commerce.object-pedestal', 'one');
  expect(() => materializeProducts(section, 'product', source.products)).toThrow('1–1');
  expect(() => parseSection({ ...section, contentHub: { product: { mode: 'selected', capacity: 1, label: 'Products', productIds: ['same', 'same'] } } })).toThrow();
  expect(collectionKey('page', 'section', 'products')).toBe('page-section-products');
 });
});

describe('product display edge cases',()=>{
 it('populates an initially empty catalogue design from an existing Hub source',()=>{
  const {site,collection,source}=catalogue(),section=site.pages[0].sections[0];
  const empty=parseSection({...section,content:{...section.content,products:[]}});
  expect(()=>materializeProducts(empty,'products',source.products)).not.toThrow();
  expect(collection.records.length).toBeGreaterThan(0);
 });
 it('retains featured flags when converting positional features to catalogue display',()=>{
  const {site,collection,source}=catalogue();collection.records[0].featured=true;collection.records[0].featuredOrder=1;
  site.pages[0].sections[0].contentHub={products:{mode:'all',capacity:24,label:'Products',catalogue:source.key}};
  const rows=recordsFromLab(site,collection);
  expect(rows[0]).toMatchObject({featured:true});expect(rows[0].featuredOrder).toBeUndefined();expect(rows).toHaveLength(collection.records.length);
  expect(collection.records[0].featuredOrder).toBe(1);
 });
 it('supports own-catalogue selected settings authored without a source reference',()=>{
  const {site,collection,source}=catalogue();
  site.pages[0].sections[0].contentHub={products:{mode:'selected',productIds:[source.products[2].id],capacity:2,label:'Products'}};
  const result=applyBindings(site,[collection]);
  expect((result.pages[0].sections[0].content as {products:unknown[]}).products.map(productSourceId)).toEqual([source.products[2].id]);
 });
 it('does not attach unrelated product options and variants to a newly selected product',()=>{
  const {source}=catalogue(),section=makeCommerceSection('commerce.option-atelier','options');
  const different={...source.products[0],id:'different-product',value:{...source.products[0].value,productId:'different-product'}};
  expect(()=>materializeProducts(section,'product',[different])).toThrow('options and variants');
 });
});

describe('catalogue source lifecycle',()=>{
 const row=(collection:ReturnType<typeof discoverBindings>[number],published:number|null)=>({id:website,website_id:website,organization_id:'org',enabled:true,version:1,key:collection.binding.key,module:collection.binding.module,label:collection.binding.label,page_id:collection.binding.pageId,section_id:collection.binding.sectionId,field:collection.binding.field,adapter:'professional',config:collection.config,draft:collection.records,published:published?collection.records:[],revision:1,published_revision:published});
 it('retains a source collection when its original section is removed but another component still uses it',async()=>{
  const {site,collection,source}=catalogue();
  const card=makeCommerceSection('commerce.object-pedestal','shared-product');
  card.contentHub={product:{mode:'selected',capacity:1,label:'Product',catalogue:source.key,productIds:[source.products[0].id]}};
  site.pages[0].sections=[card];
  const db=new FakeAdmin({website_content_collections:[row(collection,null)]});
  const result=await ensureProfessionalBindings(db.asClient(),website,'org',site);
  expect(result).toHaveLength(1);expect(result[0].binding.key).toBe(source.key);expect(db.rows('website_content_collections')[0].enabled).toBe(true);
 });
 it('keeps published bindings enabled while an unpublished Lab design replaces their section',async()=>{
  const {site,collection}=catalogue();site.pages[0].sections=[];
  const db=new FakeAdmin({website_content_collections:[row(collection,1)]});
  await ensureProfessionalBindings(db.asClient(),website,'org',site);
  expect(db.rows('website_content_collections')[0].enabled).toBe(true);
 });
});

it('uses the Hub’s explicit featured ordering when a catalogue has positioned features',()=>{
 const {source}=catalogue();source.products[0].featured=true;source.products[0].featuredOrder=2;source.products[3].featured=true;source.products[3].featuredOrder=1;
 expect(selectedProducts(source,{mode:'featured',capacity:2,label:'Products'}).map(p=>p.id)).toEqual([source.products[3].id,source.products[0].id]);
});
