import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
import {ClientContentPreview,clientPreviewCollections} from '@/app/(vigil)/content-hub-preview/ClientContentPreview';
import {parseRecords} from '../content/contract';
describe('isolated client Content Hub preview',()=>{
 it('uses valid sample products and team records with multiple product images',()=>{
  const collections=clientPreviewCollections();expect(collections.map(c=>c.module)).toEqual(['products','team']);
  for(const collection of collections){if(collection.module==='blog')throw Error('fixture');expect(parseRecords(collection.module,collection.records)).toHaveLength(collection.records.length);}
  expect('media' in collections[0].records[0].data&&collections[0].records[0].data.media).toHaveLength(2);
 });
 it.each(['products','team'] as const)('opens %s in the real client UI with a visible simulation notice and no real export link',initialModule=>{
  const html=renderToStaticMarkup(<ClientContentPreview initialModule={initialModule}/>);
  expect(html).toContain('Local client preview.');expect(html).toContain('no real client or website is updated');
  expect(html).toContain(`aria-selected="true" aria-controls="hub-${initialModule}"`);
  expect(html).not.toContain('/api/content/');expect(html).not.toContain('Download your content');
  expect(html).toContain('Add product');expect(html).toContain('Add team member');
 });
});
