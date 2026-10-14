import {describe,it,expect} from 'vitest';
import {standaloneMediaPreviews,contentPreviewUrl} from '../content/preview';
import {payloadSchemas,type ContentRecord} from '../content/contract';
const records:ContentRecord[]=[{id:'one',slug:'one',deleted:false,featured:false,data:payloadSchemas.gallery.parse({title:'Photo',media:[{type:'image',src:'/assets/gallery/photo.webp',alt:'Photo'},{type:'video',src:'/assets/video.mp4',poster:'/assets/poster.webp',alt:'Video'}]})}];
const site={status:'building',live_url:null,preview_url:'https://customer-preview.example/'};
describe('standalone media previews',()=>{
 it('loads images and video posters from their website, without changing stored authoring data',()=>{
  const original=structuredClone(records);const previews=standaloneMediaPreviews(records,site);
  expect(previews['/assets/gallery/photo.webp']).toBe('https://customer-preview.example/assets/gallery/photo.webp');
  expect(previews['/assets/poster.webp']).toBe('https://customer-preview.example/assets/poster.webp');
  expect(contentPreviewUrl(previews,'/assets/gallery/photo.webp')).toBe(previews['/assets/gallery/photo.webp']);
  expect(records).toEqual(original);
 });
 it('uses the live origin after launch, and retains already absolute images',()=>{
  expect(standaloneMediaPreviews(records,{...site,status:'live',live_url:'https://customer.example/'} )['/assets/video.mp4']).toBe('https://customer.example/assets/video.mp4');
  expect(contentPreviewUrl({},'https://cdn.example/image.webp')).toBe('https://cdn.example/image.webp');
 });
 it('keeps private upload and poster ID signatures authoritative',()=>{
  const uploaded=structuredClone(records);if('media' in uploaded[0].data)uploaded[0].data.media[0].id='ad000000-0000-4000-8000-000000000001';
  expect(standaloneMediaPreviews(uploaded,site)['/assets/gallery/photo.webp']).toBeUndefined();
  expect(contentPreviewUrl({upload:'signed-private-url','/assets/photo.webp':'public-url'},'/assets/photo.webp','upload')).toBe('signed-private-url');
 });
 it('does not resolve relative paths with an absent, malformed, insecure or credential-bearing site address',()=>{
  for(const preview_url of [null,'bad-url','http://customer.example','https://user:password@customer.example'])expect(standaloneMediaPreviews(records,{...site,preview_url})).toEqual({});
 });
});
