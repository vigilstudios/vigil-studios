import {describe,it,expect} from 'vitest';
import {discoverBindings,applyBindings,recordsFromLab} from '../content/professional';
import {parseRecords,publicationIssues,payloadSchemas} from '../content/contract';
import {siteFromComposition} from '@/design-engine/site/model';
import {makeCollectionSection} from '@/design-engine/preview/production-fixtures';
import {makeEndingSection} from '@/design-engine/preview/ending-fixtures';
import {makeEvidenceSection} from '@/design-engine/preview/evidence-fixtures';
import {makeServiceSection} from '@/design-engine/preview/service-fixtures';
import {makeCommerceSection} from '@/design-engine/preview/commerce-fixtures';
import type {SectionInstance} from '@/design-engine/composition/schemas';
import {renderPage} from '../content/generated/server.cjs';
const website='ad000000-0000-4000-8000-000000000001';
const site=(sections:SectionInstance[])=>siteFromComposition({id:'test-site',label:'Tenant site',site:{brand:{theme:'neutral'},typography:'neo-grotesk',artDirection:'precision',motion:'restrained',icons:{id:'core',strokeWidth:1.5}},sections});
describe('configured content adapters',()=>{
 it('discovers real collection fields and stable IDs, without inventing Blog or Products',()=>{
  const document=site([makeCollectionSection('work.open-index','portfolio')]);const first=discoverBindings(document,website),second=discoverBindings(document,website);
  expect(first.map(c=>c.binding.module)).toEqual(['portfolio']);expect(first[0].records.map(r=>r.id)).toEqual(second[0].records.map(r=>r.id));expect(discoverBindings(document,'ad000000-0000-4000-8000-000000000002')[0].records[0].id).not.toBe(first[0].records[0].id);
 });
 it('binds multiple actual Professional families, preserving layout and independent section fields',()=>{
  const document=site([makeCollectionSection('work.open-index','work'),makeCollectionSection('work.contact-room','photos'),makeEvidenceSection('proof.moving-chorus','quotes'),makeServiceSection('services.offering-index','services'),makeCommerceSection('commerce.catalog-ledger','products')]);
  const collections=discoverBindings(document,website);expect(collections.map(c=>c.binding.module)).toEqual(['portfolio','gallery','testimonials','services','products']);
  const changed=structuredClone(collections);changed[0].records[0].data.title='A customer-owned new title';const applied=applyBindings(document,changed);
  expect((applied.pages[0].sections[0].content as {projects:{title:string}[]}).projects[0].title).toBe('A customer-owned new title');expect(applied.settings).toEqual(document.settings);expect(applied.pages[0].sections.slice(1)).toEqual(document.pages[0].sections.slice(1));
 });
 it('writes supported Lab edits back to the same stable collection while preserving record identity',()=>{
  const document=site([makeCollectionSection('work.open-index','work')]),[collection]=discoverBindings(document,website),edited=applyBindings(document,[collection]);
  (edited.pages[0].sections[0].content as {projects:{title:string}[]}).projects[0].title='Edited in Lab';const records=recordsFromLab(edited,collection);
  expect(records[0].id).toBe(collection.records[0].id);expect(records[0].data.title).toBe('Edited in Lab');expect(applyBindings(document,[{...collection,records}]).settings).toEqual(document.settings);
 });
 it('renders publication content into initial HTML using the actual production renderer',()=>{
  const document=site([makeEndingSection('work.card-rail','cards')]),collections=discoverBindings(document,website);collections[0].records[0].data.title='Indexable customer title';
  const html=renderPage(applyBindings(document,collections),'page-home','https://vigil.example/api/contact/site');expect(html).toContain('Indexable customer title');expect(html).toContain('de-');
 });
 it('hides an explicitly unpublished surface while retaining other design sections',()=>{const document=site([makeCollectionSection('work.open-index','work'),makeEndingSection('work.card-rail','cards')]),collections=discoverBindings(document,website);const rendered=applyBindings(document,[{...collections[0],records:[]}],true);expect(rendered.pages[0].sections.map(s=>s.id)).toEqual(['cards']);expect(document.pages[0].sections).toHaveLength(2);});
 it('rejects publication that violates the real section collection constraints',()=>{
  const document=site([makeCollectionSection('work.open-index','work')]),[collection]=discoverBindings(document,website);expect(()=>applyBindings(document,[{...collection,records:[]}])).toThrow();
 });
 it('validates whitelisted payloads, unique record identity, safe links and video posters',()=>{
  const row={id:website,slug:'work',deleted:false,featured:false,data:payloadSchemas.portfolio.parse({title:'Owned work'})};expect(parseRecords('portfolio',[row])).toHaveLength(1);expect(()=>parseRecords('portfolio',[row,row])).toThrow();expect(()=>parseRecords('portfolio',[{...row,data:{...row.data,secret:'private'}}])).toThrow();
  expect(()=>parseRecords('portfolio',[{...row,data:{...row.data,media:[{type:'image',src:'https://store.example/storage/v1/object/sign/private?token=secret',alt:'Private',caption:''}]}}])).toThrow();
  const video={...row,data:{...row.data,media:[{type:'video' as const,src:'https://assets.example/clip.mp4',alt:'Clip',caption:''}]}};expect(publicationIssues('portfolio',[video])).toContain('Add media descriptions and a poster for each video.');
 });
});
