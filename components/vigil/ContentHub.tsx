'use client';
import {Download,Layers,Globe,PenLine,Save,Send} from 'lucide-react';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {PremiumWall} from './PremiumWall';
import {CollectionEditor,type HubCollection} from './CollectionEditor';
import {useDraftNavigation} from './DraftNavigation';
import {moduleLabels,type ContentModule} from '@/lib/vigil/content/contract';
import {contentIcons} from './content-ui';
import {BlogLibrary} from './BlogLibrary';
import type {ComponentProps} from 'react';
export {CollectionEditor} from './CollectionEditor';
export type {HubCollection} from './CollectionEditor';
type HubSite={id:string;name:string;access:boolean;eligible?:boolean;kind?:string;status:string};
export function ContentHub({sites,selected,collections,canWrite,blog,previews,editorServices,exportHref,initialModule}:{sites:HubSite[];selected:string;collections:HubCollection[];canWrite:boolean;blog:ComponentProps<typeof BlogLibrary>|null;previews:Record<string,string>;editorServices?:Pick<ComponentProps<typeof CollectionEditor>,"persist"|"mediaServices">;exportHref?:string|null;initialModule?:ContentModule}){
 const {request}=useDraftNavigation();
 const site=sites.find(s=>s.id===selected),router=useRouter(),[contentModule,setModule]=useState<ContentModule>(collections.some(c=>c.module===initialModule)?initialModule!:collections[0]?.module??'blog');
 const tabs=[...new Set(collections.map(c=>c.module))];
 return <div className="content-hub">
  <header className="hub-home-header hub-surface"><div className="hub-home-copy"><p className="hub-eyebrow"><Layers size={14}/>YOUR WEBSITE, IN YOUR WORDS</p><h1>Content Hub</h1><p>Keep your website fresh. Edit here, publish when you’re ready.</p><div className="hub-workflow" aria-label="How content updates work"><span><PenLine size={13}/>Edit content</span><i/><span><Save size={13}/>Save a draft</span><i/><span><Send size={13}/>Publish to your site</span></div></div><div className="hub-home-tools">{site&&<span className="hub-site-label"><Globe size={14}/>{site.name}</span>}{sites.length>1&&<label className="hub-site">Website<select value={selected} onChange={e=>{const id=e.target.value;request(()=>router.push(`/dashboard/content?website=${id}`));}}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}{site?.access&&canWrite&&exportHref!==null&&<a className="hub-export-link" href={exportHref??`/api/content/${site.id}/export`}><Download size={14}/>Download your content</a>}</div></header>
  {!site?<div className="hub-empty">Your website’s editable content will appear here when it is configured.</div>:!site.access&&site.eligible?<PremiumWall feature="Content Hub" mode="launch" title="Your Content Hub opens at launch" planHint="Included in your plan" description="Once your website is live, you’ll be able to add and update content here. Your plan already includes access." note="Vigil is preparing your website. You can review its progress from your dashboard."/>:!site.access?<PremiumWall feature="Content Hub" title="Unlock your Content Hub" planHint="Included with Care and higher" description="Self-service editing for your website’s configured content is included with Care and higher." note="Your saved content is retained. Your files and website export remain available under your agreement."/>:!tabs.length?<div className="hub-empty"><h2>No editable collections yet</h2><p>Vigil will connect the content collections supported by your website. Your existing content remains in place.</p></div>:<>
   <div className="hub-tabs" role="tablist" aria-label="Website content">{tabs.map(tab=>{const Icon=contentIcons[tab];return <button type="button" key={tab} role="tab" aria-selected={contentModule===tab} aria-controls={`hub-${tab}`} id={`tab-${tab}`} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=tabs.indexOf(contentModule),next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[tabs.length-1]:tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];request(()=>{setModule(next);document.getElementById(`tab-${next}`)?.focus();});}}} tabIndex={contentModule===tab?0:-1} onClick={()=>request(()=>setModule(tab))}><Icon size={17} aria-hidden/>{collections.filter(c=>c.module===tab).length===1?collections.find(c=>c.module===tab)!.label:moduleLabels[tab]}</button>;})}</div>
   {tabs.map(tab=><section role="tabpanel" hidden={contentModule!==tab} key={tab} id={`hub-${tab}`} aria-labelledby={`tab-${tab}`}>
    {tab==='blog'?blog&&<BlogLibrary {...blog}/>:collections.filter(c=>c.module===tab).map(c=><CollectionEditor {...editorServices} key={c.id} collection={c} website={selected} canWrite={canWrite} previews={previews}/>)}
   </section>)}
  </>}
 </div>;
}
