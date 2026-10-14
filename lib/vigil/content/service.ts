import 'server-only';
import { z } from 'zod';
import {createAdminClient} from '@/lib/supabase/admin';
import type {DbClient} from '@/lib/vigil/types';
import type {Json} from '@/types/database.types';
import {ForbiddenError,ValidationError} from '@/lib/vigil/auth/errors';
import {moduleSchema,bindingSchema,parseRecords,publicationIssues,type ContentRecord} from './contract';
import {applyBindings,discoverBindings,type BoundCollection,type AdapterConfig} from './professional';
import {projectDocument} from '@/lib/vigil/professional/document';
export async function contentSites(client:DbClient,org:string){
 const {data,error}=await client.from('websites').select('id,name,status,project_id,live_url').eq('organization_id',org).order('created_at');if(error)throw error;
 return Promise.all((data??[]).map(async site=>{const [access,project]=await Promise.all([client.rpc('website_content_access',{p_website:site.id}),client.from('projects').select('kind').eq('id',site.project_id!).maybeSingle()]);if(access.error)throw access.error;if(project.error)throw project.error;return {...site,access:access.data===true,kind:project.data?.kind};}));
}
export async function contentCollections(client:DbClient,website:string,org:string,mode:'draft'|'published'='draft'):Promise<BoundCollection[]>{
 const {data,error}=await client.from('website_content_collections').select('*').eq('website_id',website).eq('organization_id',org).eq('enabled',true).order('key');if(error)throw error;
 return (data??[]).map(c=>{const contentModule=moduleSchema.parse(c.module);return {id:c.id,binding:bindingSchema.parse({version:c.version,key:c.key,module:contentModule,label:c.label,pageId:c.page_id,sectionId:c.section_id,field:c.field,adapter:c.adapter}),config:c.config as unknown as AdapterConfig,records:contentModule==='blog'?[]:parseRecords(contentModule,c[mode]),revision:c.revision,publishedRevision:c.published_revision};});
}
export async function authorizeCollection(client:DbClient,org:string,id:string){
 const {data:c,error}=await client.from('website_content_collections').select('id,website_id,organization_id,module,adapter,enabled').eq('id',z.string().uuid().parse(id)).eq('organization_id',org).maybeSingle();if(error)throw error;
 if(!c?.enabled||c.module==='blog')throw new ForbiddenError('This collection is unavailable.');
 const {data:access,error:gate}=await client.rpc('website_content_access',{p_website:c.website_id});if(gate||!access)throw new ForbiddenError('Upgrade to Care or higher on an eligible website to edit content.');
 return c;
}
export async function validateDelivery(admin:DbClient,website:string,org:string,collectionId:string,records:ContentRecord[]){
 const collections=await contentCollections(admin,website,org,'published');const collection=collections.find(c=>c.id===collectionId);if(!collection)throw new ForbiddenError();
 if(collection.binding.adapter==='standalone'&&collection.config.featuredSlotBudget&&records.filter(r=>!r.deleted&&r.featured&&'media' in r.data&&r.data.media.some(m=>m.type==='video')).length!==collection.config.featuredSlotBudget)throw new ValidationError(`Choose exactly ${collection.config.featuredSlotBudget} featured videos for the existing homepage slots. New entries can remain in the full collection.`);
 if(collection.binding.adapter==='professional'){
  const {data:workspace,error}=await admin.from('design_workspaces').select('site_definition,project_id').eq('website_id',website).eq('organization_id',org).maybeSingle();if(error)throw error;if(!workspace)throw new ValidationError('The website binding needs attention from Vigil. Your published content is unchanged.');
  try{applyBindings(projectDocument(workspace.site_definition,workspace.project_id),collections.filter(c=>c.binding.adapter==='professional'&&(c.id===collectionId||c.publishedRevision!==null)).map(c=>({...c,records:c.id===collectionId?records:c.records})),true);}catch{throw new ValidationError('These entries do not fit the website section. Check required fields and the number of entries. Your published version is unchanged.');}
 }
}
export async function saveCollection(client:DbClient,org:string,actor:string,id:string,expected:number,input:unknown,intent:'draft'|'publish'|'unpublish'|'trash'){
 const c=await authorizeCollection(client,org,id),contentModule=moduleSchema.exclude(['blog']).parse(c.module),records=parseRecords(contentModule,input),admin=createAdminClient();
 const current=(await contentCollections(admin,c.website_id,org)).find(v=>v.id===id);
 if(contentModule==='testimonials'&&current?.records.some(old=>'placeholder' in old.data&&old.data.placeholder&&records.some(r=>r.id===old.id&&'placeholder' in r.data&&!r.data.placeholder)))throw new ForbiddenError('Review placeholders must remain marked until Vigil confirms publication permission.');
 if(current?.binding.adapter==='professional'&&records.some(r=>'media' in r.data&&r.data.media.length>(current.config.maxMedia??1)))throw new ValidationError('This website entry supports one primary media item. Replace it rather than appending extra media.');
 if(intent==='trash'){const published=(await contentCollections(admin,c.website_id,org,'published')).find(v=>v.id===id);if(published)await validateDelivery(admin,c.website_id,org,id,published.records.filter(r=>!records.some(n=>n.id===r.id&&n.deleted)));}
 if(intent==='publish'){const issues=publicationIssues(contentModule,records);if(issues.length)throw new ValidationError(issues[0]);await validateDelivery(admin,c.website_id,org,id,records);}
 const {data,error}=await admin.rpc('save_website_content',{p_collection:id,p_expected:expected,p_records:records as unknown as Json,p_intent:intent,p_actor:actor}).abortSignal(AbortSignal.timeout(15000));
 if(error){if((error.code==='PT409'||error.code==='40001'))throw new ValidationError('Someone saved this collection in another window. Reload before saving; your changes remain here.');throw new ValidationError('Content could not be saved. Check your access and fields, then try again.');}return {revision:data!};
}
/** Explicit, idempotent backfill from a validated site document. Existing collections are never overwritten. */
export async function ensureProfessionalBindings(admin:DbClient,website:string,org:string,site:Parameters<typeof discoverBindings>[0]){
 const discovered=discoverBindings(site,website),existing=await contentCollections(admin,website,org),seen=new Set(existing.map(c=>c.binding.key));
 const keys=new Set(discovered.map(c=>c.binding.key));
 for(const c of existing.filter(c=>c.binding.adapter==='professional'&&c.config.autoDiscovered&&!keys.has(c.binding.key))){const {error}=await admin.from('website_content_collections').update({enabled:false}).eq('id',c.id).eq('website_id',website);if(error)throw error;}
 for(const c of discovered){if(seen.has(c.binding.key))continue;
  const {error}=await admin.from('website_content_collections').upsert({website_id:website,organization_id:org,key:c.binding.key,module:c.binding.module,label:c.binding.label,page_id:c.binding.pageId,section_id:c.binding.sectionId,field:c.binding.field,adapter:'professional',config:c.config as unknown as Json,draft:c.records as unknown as Json}, {onConflict:'website_id,key',ignoreDuplicates:true});if(error)throw error;
 }
 return contentCollections(admin,website,org);
}
