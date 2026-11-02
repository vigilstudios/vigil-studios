import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContentFields } from '@/design-engine/preview/composition/ContentFields';
import { ContentHubControls } from '@/design-engine/preview/composition/ContentHubControls';
import { makeCommerceSection } from '@/design-engine/preview/commerce-fixtures';
import { hubOwnsProductPath,collectionKey } from '@/design-engine/content/products';
import { siteFromComposition } from '@/design-engine/site/model';
describe('Lab product content ownership',()=>{
 it('keeps merchandising notes editable while the catalogue owns product data',()=>{
  const section=makeCommerceSection('commerce.merchant-edit','edit');
  section.contentHub={items:{mode:'all',capacity:5,label:'Products',catalogue:'catalogue'}};
  const html=renderToStaticMarkup(<ContentFields section={section} onChange={()=>{}}/>);
  expect(html).toContain('Items 1 · Note');expect(html).not.toContain('Items 1 · Product · Title');
  expect(html).not.toContain('Remove item 1');expect(html).not.toContain('Add items item');
 });
 it('keeps campaign imagery separate from the connected product gallery',()=>{
  const section=makeCommerceSection('commerce.campaign-interleave','campaign');
  section.contentHub={spreads:{mode:'all',capacity:4,label:'Products',catalogue:'catalogue'}};
  expect(hubOwnsProductPath(section,['content','spreads',0,'product','media',0,'image'])).toBe(true);
  expect(hubOwnsProductPath(section,['content','spreads',0,'campaignMedia','image'])).toBe(false);
  expect(hubOwnsProductPath(section,['content','spreads',0,'story'])).toBe(false);
 });
 it('shows all three product modes and full source choices independently of the narrowed preview',()=>{
  const section=makeCommerceSection('commerce.catalog-ledger','catalogue');
  const site=siteFromComposition({id:'products',label:'Products',site:{brand:{theme:'neutral'},typography:'neo-grotesk',artDirection:'precision',motion:'restrained',icons:{id:'core',strokeWidth:1.5}},sections:[section]});
  const html=renderToStaticMarkup(<ContentHubControls section={section} site={site} pageId="page-home" onChange={()=>{}}/>);
  for(const label of ['All products','Featured products','Specific products','Content Hub catalogue','Apply product display'])expect(html).toContain(label);
  expect(html).toContain(collectionKey('page-home','catalogue','products'));
 });
});
