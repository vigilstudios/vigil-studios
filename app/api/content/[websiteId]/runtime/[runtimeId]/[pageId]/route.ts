import {canDeliverPublishedWebsite} from '@/lib/vigil/content/delivery';
import {z} from 'zod';
import {createAdminClient} from '@/lib/supabase/admin';
import {contentCollections} from '@/lib/vigil/content/service';
import {applyBindings} from '@/lib/vigil/content/professional';
import {publicRecords} from '@/lib/vigil/content/media';
import {parseSiteDefinition} from '@/design-engine/site/persistence';
import {resolveRoutes} from '@/design-engine/site/routes';
import {renderPage} from '@/lib/vigil/content/generated/server.cjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string;runtimeId:string;pageId:string}>}){
 const {websiteId,runtimeId,pageId}=await params,headers={'Cache-Control':'no-store','Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'},unavailable=(status:number)=>new Response(status===404?'Page unavailable.':'Website temporarily unavailable.',{status,headers});
 if(!z.string().uuid().safeParse(websiteId).success||!z.string().uuid().safeParse(runtimeId).success)return unavailable(404);
 try{const admin=createAdminClient(),url=new URL(request.url),review=url.searchParams.get('review')==='published',[allowed,{data:snapshot,error}]=await Promise.all([canDeliverPublishedWebsite(admin,websiteId,review),admin.from('website_content_runtimes').select('*').eq('id',runtimeId).eq('website_id',websiteId).maybeSingle()]);if(error)throw error;if(!allowed||!snapshot)return unavailable(404);
  const original=parseSiteDefinition(snapshot.site_definition),collections=await contentCollections(admin,websiteId,snapshot.organization_id,'published');
  const site=applyBindings(original,collections.filter(c=>c.binding.adapter==='professional'&&snapshot.binding_keys.includes(c.binding.key)&&c.publishedRevision!==null).map(c=>({...c,records:publicRecords(c.records,websiteId,c.id,review)})),true);
  const page=site.pages.find(p=>p.id===pageId);if(!page)return unavailable(404);
  const {data:website}=await admin.from('websites').select('live_url,status').eq('id',websiteId).single();const origin=website?.live_url||new URL(request.url).origin,canonical=new URL(resolveRoutes(site).get(page.id)!,origin).href;
  const engine=`https://www.vigilstudios.co/design-engine-runtime/${snapshot.engine_version}`,document=JSON.stringify(site).replace(/</g,'\\u003c'),body=renderPage(site,page.id,`https://www.vigilstudios.co/api/contact/${websiteId}`),noindex=website?.status!=='live'||page.seo.noIndex;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.seo.title??page.title+' · '+site.title)}</title><meta name="description" content="${escape(page.seo.description??'')}"><meta name="robots" content="${noindex?'noindex,follow':'index,follow'}"><link rel="canonical" href="${escape(canonical)}"><link rel="stylesheet" href="${engine}/client.css"><link rel="stylesheet" href="${engine}/fonts.css"></head><body><div id="root" data-vigil-ssr="true" data-vigil-page="${escape(page.id)}" data-vigil-contact="https://www.vigilstudios.co/api/contact/${websiteId}">${body}</div><script id="vigil-site" type="application/json">${document}</script><script src="${engine}/client.js" defer></script></body></html>`;
  return new Response(html,{headers});
 }catch{return unavailable(503);}
}
