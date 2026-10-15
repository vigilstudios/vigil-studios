import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {collectionCapabilities} from '@/design-engine/content/settings';
import {parseSection,sectionSchemas,type SectionInstance} from '@/design-engine/composition/schemas';
import {siteFromComposition} from '@/design-engine/site/model';
import {makeCollectionSection} from '@/design-engine/preview/production-fixtures';
import {makeCommerceSection} from '@/design-engine/preview/commerce-fixtures';
import {makeEvidenceSection} from '@/design-engine/preview/evidence-fixtures';
import {makeServiceSection} from '@/design-engine/preview/service-fixtures';
import {discoverBindings,applyBindings,recordsFromLab,configFromLab} from '../content/professional';
const document=(section:SectionInstance)=>siteFromComposition({id:'features',label:'Features',site:{brand:{theme:'neutral'},typography:'neo-grotesk',artDirection:'precision',motion:'restrained',icons:{id:'core',strokeWidth:1.5}},sections:[section]});
const website='af000000-0000-4000-8000-000000000001';
const cases=[makeCollectionSection('work.open-index','portfolio'),makeCollectionSection('work.contact-room','gallery'),makeCommerceSection('commerce.catalog-ledger','products'),makeCommerceSection('commerce.merchant-edit','product-edit'),makeCommerceSection('commerce.object-pedestal','one-product'),makeEvidenceSection('proof.moving-chorus','proof'),makeServiceSection('services.offering-index','services')];
describe('Lab configured featured sections',()=>{
 it.each(cases.map(s=>[s.component,s] as const))('%s derives positions from its actual schema and preserves the full collection',(_name,section)=>{
  const [cap]=collectionCapabilities(section.component,sectionSchemas[section.component]);expect(cap).toBeDefined();
  const capacity=Math.max(1,cap.minimum),featured=parseSection({...section,contentHub:{[cap.field]:{mode:'featured',capacity,label:'Selected work'}}});
  const site=document(featured),[collection]=discoverBindings(site,website),total=collection.records.length;
  expect(collection.config.featuredSlotBudget).toBe(capacity);expect(collection.records.filter(r=>r.featured)).toHaveLength(capacity);
  const preview=applyBindings(site,[collection],false,'draft');const rows=recordsFromLab(preview,collection);
  expect(rows).toHaveLength(total);expect(rows.filter(r=>!r.deleted)).toHaveLength(total);expect(rows.filter(r=>r.featured)).toHaveLength(capacity);
  expect(()=>parseSection({...section,contentHub:{[cap.field]:{mode:'featured',capacity:cap.maximum+1,label:'Invalid'}}})).toThrow();
 });
 it('does not infer features for an unconfigured compatible section',()=>{const site=document(cases[1]),[collection]=discoverBindings(site,website);expect(collection.config.featuredSlotBudget).toBe(0);expect(collection.records.some(r=>r.featured)).toBe(false);});
 it('hides the entire Lab setting for unsupported components',()=>{expect(collectionCapabilities('content.feature-list',sectionSchemas['content.feature-list'])).toEqual([]);});
 it('rejects unrelated collection metadata',()=>{expect(()=>parseSection({...cases[0],contentHub:{products:{mode:'featured',capacity:1,label:'Invalid'}}})).toThrow();});
 it('preserves published selection and capacity while Lab changes draft capacity',()=>{
  const section=cases[0],[cap]=collectionCapabilities(section.component,sectionSchemas[section.component]);const initial=Math.min(cap.maximum,(section.content as {projects:unknown[]}).projects.length);
  const site=document(parseSection({...section,contentHub:{[cap.field]:{mode:'featured',capacity:initial,label:'Featured'}}})),[collection]=discoverBindings(site,website);
  const draft=applyBindings(site,[collection],false,'draft');draft.pages[0].sections[0].contentHub![cap.field].capacity=Math.max(1,cap.minimum);
  const config=configFromLab(draft,collection),records=recordsFromLab(draft,collection);
  expect(config.publishedFeatured?.featuredSlotBudget).toBe(initial);expect(records).toHaveLength(collection.records.length);
  const published=applyBindings(draft,[{...collection,config,records:collection.records}]);
  expect((published.pages[0].sections[0].content as {projects:unknown[]}).projects).toHaveLength(initial);
  expect(published.pages[0].sections[0].contentHub![cap.field].capacity).toBe(initial);
 });
 it('disabling features retains nonfeatured content and clears positions',()=>{
  const section=cases[1],[cap]=collectionCapabilities(section.component,sectionSchemas[section.component]);const site=document(parseSection({...section,contentHub:{[cap.field]:{mode:'featured',capacity:Math.max(1,cap.minimum),label:'Gallery picks'}}})),[collection]=discoverBindings(site,website);
  const draft=applyBindings(site,[collection],false,'draft');delete draft.pages[0].sections[0].contentHub;
  const rows=recordsFromLab(draft,collection);expect(rows).toHaveLength(collection.records.length);expect(rows.every(r=>!r.deleted&&!r.featured&&!r.featuredOrder)).toBe(true);const config=configFromLab(draft,collection);expect(config.featuredSlotBudget).toBe(0);const published=applyBindings(draft,[{...collection,config}]);expect(published.pages[0].sections[0].contentHub?.[cap.field].capacity).toBe(Math.max(1,cap.minimum));
 });
});
