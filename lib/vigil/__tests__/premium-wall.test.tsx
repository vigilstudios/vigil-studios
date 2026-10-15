import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/lib/vigil/actions/content',()=>({saveContentCollection:vi.fn()}));
vi.mock('@/lib/vigil/actions/blog',()=>({setBlogPostDeleted:vi.fn()}));
import {ContentHub} from '@/components/vigil/ContentHub';
import {GatedFeature} from '@/components/vigil/GatedFeature';
import {payloadSchemas} from '../content/contract';
describe('paid feature presentation',()=>{
 it('never exposes content downloads or real entries in the locked illustration',()=>{
  const html=renderToStaticMarkup(<ContentHub sites={[{id:'website',name:'Customer',access:false,kind:'express',status:'live'}]} selected="website" canWrite previews={{}} blog={null} collections={[{id:'collection',key:'gallery',module:'gallery',label:'Gallery',records:[{id:'record',slug:'record',deleted:false,featured:false,data:payloadSchemas.gallery.parse({title:'PRIVATE CUSTOMER RECORD'})}],revision:1,publishedRevision:1}]}/>);
  expect(html).not.toContain('Download your content');expect(html).not.toContain('PRIVATE CUSTOMER RECORD');expect(html).not.toContain('/api/content/website/export');
  expect(html).toContain('aria-hidden="true" inert=""');expect(html).toContain('role="dialog"');expect(html).toContain('View upgrade options');
 });
 it('shows a launch wall without an upsell or download to entitled prelaunch customers',()=>{
  const html=renderToStaticMarkup(<ContentHub sites={[{id:'website',name:'Customer',access:false,eligible:true,kind:'professional',status:'building'}]} selected="website" canWrite previews={{}} blog={null} collections={[]}/>);
  expect(html).toContain('Your Content Hub opens at launch');expect(html).toContain('Included in your plan');expect(html).toContain('View website status');expect(html).not.toContain('View upgrade options');expect(html).not.toContain('Download your content');
 });
 it('keeps prelaunch staff access editable when the server grants it',()=>{
  const html=renderToStaticMarkup(<ContentHub sites={[{id:'website',name:'Customer',access:true,eligible:true,kind:'professional',status:'building'}]} selected="website" canWrite previews={{}} blog={null} collections={[]}/>);
  expect(html).toContain('Download your content');expect(html).not.toContain('premium-stage');
 });
 it('uses the same dialog for Requests and never upsells an already entitled coming-soon feature',()=>{
  const locked=renderToStaticMarkup(<GatedFeature title="Requests" description="Website updates" planHint="Care and higher"/>);
  expect(locked).toContain('premium-stage');expect(locked).toContain('Unlock Requests');
  const entitled=renderToStaticMarkup(<GatedFeature title="Insights" description="Reporting" comingSoon/>);
  expect(entitled).not.toContain('View upgrade options');expect(entitled).not.toContain('premium-stage');expect(entitled).toContain('being built');
 });
});
