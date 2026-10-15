'use client';
import {Download} from 'lucide-react';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {PremiumWall} from './PremiumWall';
import {CollectionEditor,type HubCollection} from './CollectionEditor';
import {useDraftNavigation} from './DraftNavigation';
import {moduleLabels,type ContentModule} from '@/lib/vigil/content/contract';
import {BlogLibrary} from './BlogLibrary';
import type {ComponentProps} from 'react';
export {CollectionEditor} from './CollectionEditor';
export type {HubCollection} from './CollectionEditor';
type HubSite={id:string;name:string;access:boolean;eligible?:boolean;kind?:string;status:string};
export function ContentHub({sites,selected,collections,canWrite,blog,previews}:{sites:HubSite[];selected:string;collections:HubCollection[];canWrite:boolean;blog:ComponentProps<typeof BlogLibrary>|null;previews:Record<string,string>}){
 const {request}=useDraftNavigation();
 const site=sites.find(s=>s.id===selected),router=useRouter(),[contentModule,setModule]=useState<ContentModule>(collections[0]?.module??'blog');
 const tabs=[...new Set(collections.map(c=>c.module))];
 return <div className="content-hub">
  {site?.access&&canWrite&&<p className="hub-export"><a className="btn-secondary" href={`/api/content/${site.id}/export`}><Download size={15} aria-hidden/>Download your content</a></p>}
  {sites.length>1&&<label className="hub-site">Website<select value={selected} onChange={e=>{const id=e.target.value;request(()=>router.push(`/dashboard/content?website=${id}`));}}>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
  {!site?<div className="hub-empty">Your website’s editable content will appear here when it is configured.</div>:!site.access&&site.eligible?<PremiumWall feature="Content Hub" mode="launch" title="Your Content Hub opens at launch" planHint="Included in your plan" description="Once your website is live, you’ll be able to add and update content here. Your plan already includes access." note="Vigil is preparing your website. You can review its progress from your dashboard."/>:!site.access?<PremiumWall feature="Content Hub" title="Unlock your Content Hub" planHint="Included with Care and higher" description={site.kind==='express'?'Self-service content editing is available for Professional and Growth websites with Care or higher. Upgrade your website package to get access.':'Self-service content editing is included with Care and higher on Professional and Growth websites. Upgrade your plan to get access.'} note="Your saved content is retained. Your files and website export remain available under your agreement."/>:!tabs.length?<div className="hub-empty"><h2>No editable collections yet</h2><p>Vigil will connect the content collections supported by your website. Your existing content remains in place.</p></div>:<>
   <div className="hub-tabs" role="tablist" aria-label="Website content">{tabs.map(tab=><button type="button" key={tab} role="tab" aria-selected={contentModule===tab} aria-controls={`hub-${tab}`} id={`tab-${tab}`} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=tabs.indexOf(contentModule),next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[tabs.length-1]:tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];request(()=>{setModule(next);document.getElementById(`tab-${next}`)?.focus();});}}} tabIndex={contentModule===tab?0:-1} onClick={()=>request(()=>setModule(tab))}>{moduleLabels[tab]}</button>)}</div>
   {tabs.map(tab=><section role="tabpanel" hidden={contentModule!==tab} key={tab} id={`hub-${tab}`} aria-labelledby={`tab-${tab}`}>
    {tab==='blog'?blog&&<BlogLibrary {...blog}/>:collections.filter(c=>c.module===tab).map(c=><CollectionEditor key={c.id} collection={c} website={selected} canWrite={canWrite} previews={previews}/>)}
   </section>)}
  </>}
 </div>;
}
