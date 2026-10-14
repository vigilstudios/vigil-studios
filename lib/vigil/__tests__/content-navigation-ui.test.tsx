import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {NavLink} from '@/components/vigil/AppFrame';
import {CollectionEditor} from '@/components/vigil/CollectionEditor';
import {BlogLibrary} from '@/components/vigil/BlogLibrary';
import {payloadSchemas} from '../content/contract';
import {vi} from 'vitest';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}));
const row={id:'one',slug:'one',deleted:false,featured:false,data:payloadSchemas.gallery.parse({title:'A photograph',media:[{type:'image',src:'https://cdn.example/photo.webp',alt:'Photo'}]})};
describe('Content Hub presentation',()=>{
 it('keeps paid locked destinations clickable and coming-soon destinations without a target',()=>{const paid=renderToStaticMarkup(<NavLink active={false} collapsed={false} item={{href:'/dashboard/requests',label:'Requests',icon:'requests',locked:true,premium:true}}/>);expect(paid).toContain('href="/dashboard/requests"');expect(paid).toContain('Upgrade to access');expect(paid).not.toContain('aria-disabled');const soon=renderToStaticMarkup(<NavLink active={false} collapsed item={{href:'/dashboard/insights',label:'Insights',icon:'insights',locked:true,disabled:true}}/>);expect(soon).toContain('aria-disabled="true"');expect(soon).not.toContain('href=');expect(soon).toContain('Coming soon');});
 it('renders a real table with thumbnail before title and zero drafts for unchanged published records',()=>{const html=renderToStaticMarkup(<CollectionEditor collection={{id:'collection',key:'gallery',module:'gallery',label:'Gallery',records:[row],publishedRecords:[row],revision:2,publishedRevision:1}} website="site" canWrite={false} previews={{}}/>);expect(html).toContain('<table');expect(html).toContain('Drafts (0)');expect(html.indexOf('https://cdn.example/photo.webp')).toBeLessThan(html.indexOf('A photograph'));expect(html).not.toContain('Preview drafts');});
 it('keeps saved changed entries visibly Draft with a persistent outline',()=>{const edited={...row,data:{...row.data,title:'Edited photograph'}};const html=renderToStaticMarkup(<CollectionEditor collection={{id:'collection',key:'gallery',module:'gallery',label:'Gallery',records:[edited],publishedRecords:[row],revision:2,publishedRevision:1}} website="site" canWrite={false} previews={{}}/>);expect(html).toContain('Drafts (1)');expect(html).toContain('library-draft-row');expect(html).toContain('library-pill-draft');});
 it('includes rounded thumbnails in Blog tables too',()=>{const html=renderToStaticMarkup(<BlogLibrary sites={[{id:'site',name:'Website',status:'building'}]} canWrite={false} posts={[{id:'post',website_id:'site',title:'Blog title',excerpt:'Intro',status:'draft',updated_at:'2026-10-14T12:00:00Z',deleted_at:null,coverUrl:'https://cdn.example/blog.webp'}]}/>);expect(html).toContain('library-thumbnail');expect(html.indexOf('https://cdn.example/blog.webp')).toBeLessThan(html.indexOf('Blog title'));expect(html).toContain('Drafts (1)');});
});
