import React, {createRef,type ComponentProps} from 'react';
import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
import {ContentEntryEditor} from '@/components/vigil/ContentEntryEditor';
import {clientPreviewCollections} from '@/app/(vigil)/content-hub-preview/ClientContentPreview';
import {payloadSchemas} from '../content/contract';

type Props=ComponentProps<typeof ContentEntryEditor>;
function props(module:'products'|'team'='products'):Props{
 const collection=clientPreviewCollections().find(c=>c.module===module)!;
 return {collection,current:collection.records[0],website:'sample-site',dialogRef:createRef<HTMLDialogElement>(),canWrite:true,pending:false,uploading:false,dirty:false,isDraft:false,changes:0,previews:{},featurePolicy:null,slots:[],error:'',message:'',slugLocked:false,onClose:vi.fn(),onField:vi.fn(),onSlug:vi.fn(),onFeature:vi.fn(),onSlot:vi.fn(),onUpload:vi.fn(async()=>true),onAttach:vi.fn(),onBusy:vi.fn(),onSave:vi.fn()};
}
function render(overrides:Partial<Props>={},module:'products'|'team'='products'){return renderToStaticMarkup(<ContentEntryEditor {...props(module)} {...overrides}/>);}
describe('client content entry editor',()=>{
 it('explains product fields, media, visibility and managed prices without exposing provider identifiers',()=>{
  const html=render();
  for(const label of ['Product details','Product name','Description','Category','Images &amp; video','Website visibility','Featured product','Contact Vigil to update the price'])expect(html).toContain(label);
  expect(html).toMatch(/aria-label="Price display" readOnly=""/);
  expect(html).not.toContain('providerRef');expect(html).not.toContain('sample-product-11');
 });
 it('edits one selected image at a time while keeping the complete gallery selectable',()=>{
  const html=render();
  expect(html).toContain('Select image 1');expect(html).toContain('Select image 2');
  expect(html.match(/aria-label="Image or video description"/g)).toHaveLength(1);
  expect(html).toContain('Cover image');expect(html).toContain('Move image later');
  expect(html).toContain('Choose from Files');expect(html).toContain('Remove from entry');
 });
 it('disables saves until there are changes and prevents publishing while delivery is pending',()=>{
  expect(render()).toMatch(/disabled=""[^>]*>Publish changes/);
  expect(render({dirty:true,isDraft:true,changes:1})).toContain('Publish changes (1)');
  const p=props();expect(render({dirty:true,changes:1,collection:{...p.collection,deliveryPending:true}})).toMatch(/disabled=""[^>]*>Publish changes/);
 });
 it('keeps read-only access and ongoing uploads protected',()=>{
  expect(render({canWrite:false})).toMatch(/<fieldset[^>]*disabled=""/);
  expect(render({canWrite:false})).not.toContain('Publish changes');
  expect(render({uploading:true,dirty:true,changes:1})).toMatch(/<fieldset[^>]*disabled=""/);
 });
 it('uses a simple optional portrait and profile fields for team members',()=>{
  const html=render({},'team');
  for(const text of ['Full name','Short bio','Role','Profile photo','A portrait is optional.'])expect(html).toContain(text);
  expect(html).not.toContain('Featured product');expect(html).not.toContain('Price display');
 });
 it('retains numbered featured positions and video poster controls for portfolio content',()=>{
  const p=props(),current={...p.current,data:payloadSchemas.portfolio.parse({title:'Showreel',media:[{type:'video',src:'/video.mp4',poster:'/poster.webp',alt:'Showreel'}]})};
  const html=render({current,collection:{...p.collection,module:'portfolio',editableFields:undefined},featurePolicy:{capacity:2,label:'Featured work',mediaType:'video',requireFull:true},slots:[current,undefined]});
  expect(html).toContain('Featured position');expect(html).toContain('Position 2 of 2');
  expect(html).toContain('Choose video frame');expect(html).toContain('Choose poster from Files');
 });
});
