import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireOrgContextOrThrow,assertOrgRole} from '@/lib/vigil/auth/session';
import {authorizeCollection} from '@/lib/vigil/content/service';
import {ForbiddenError,ValidationError,isVigilError} from '@/lib/vigil/auth/errors';
import {isSameOriginRequest} from '@/lib/vigil/auth/origin';
import {CONTENT_LIBRARY_TYPES,libraryMediaType} from '@/lib/vigil/content/library';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function context(request:Request,website:string){
 const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);
 const client=await createClient(),id=z.string().uuid().parse(new URL(request.url).searchParams.get('collection'));
 const c=await authorizeCollection(client,ctx.organization.id,id);
 if(c.website_id!==website||!['portfolio','gallery','testimonials','products','services'].includes(c.module))throw new ForbiddenError();
 const {data:site,error}=await client.from('websites').select('project_id').eq('id',website).eq('organization_id',ctx.organization.id).single();
 if(error||!site.project_id)throw new ForbiddenError();
 return {ctx,client,collection:id,project:site.project_id,admin:createAdminClient()};
}
function failure(error:unknown){return Response.json({error:isVigilError(error)?error.message:'Your Files library could not load. Try again.'},{status:isVigilError(error)?error.status:503,headers});}
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 try{const {websiteId}=await params,{ctx,project,admin}=await context(request,websiteId);
  const {data:rows,error}=await admin.from('project_assets').select('id,file_name,content_type,size_bytes,bucket_id,object_path,caption').eq('organization_id',ctx.organization.id).eq('project_id',project).in('bucket_id',['project-assets','content-media']).in('content_type',[...CONTENT_LIBRARY_TYPES]).order('created_at',{ascending:false}).limit(500);if(error)throw error;
  const {data:mappings,error:mapError}=await admin.from('website_content_media').select('id,website_id,ready').in('id',(rows??[]).map(a=>a.id));if(mapError)throw mapError;
  const assets=(rows??[]).filter(a=>{const m=mappings?.find(m=>m.id===a.id);return (!m||m.website_id===websiteId&&m.ready)&&(a.bucket_id==='project-assets'||m?.ready)&&a.object_path.startsWith(`${ctx.organization.id}/${project}/`);});
  const signed=await Promise.all(['project-assets','content-media'].map(async bucket=>{const paths=assets.filter(a=>a.bucket_id===bucket).map(a=>a.object_path);if(!paths.length)return [];const {data,error}=await admin.storage.from(bucket).createSignedUrls(paths,900);if(error)throw error;return (data??[]).map(s=>({...s,bucket}));}));
  return Response.json({assets:assets.flatMap(a=>{const url=signed.flat().find(s=>s.bucket===a.bucket_id&&s.path===a.object_path&&!s.error)?.signedUrl;return url?[{id:a.id,name:a.file_name,type:libraryMediaType(a.content_type),size:a.size_bytes,url,caption:a.caption??''}]:[]})},{headers});
 }catch(error){return failure(error);}
}
export async function POST(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 try{if(!request.headers.get('origin')||!isSameOriginRequest(request))throw new ForbiddenError();
  const {websiteId}=await params,{ctx,client,collection,project,admin}=await context(request,websiteId);
  if(Number(request.headers.get('content-length'))>1024)throw new ValidationError('Choose a file from your library.');
  const {id}=z.object({id:z.string().uuid()}).strict().parse(await request.json());
  const {data:a,error}=await admin.from('project_assets').select('id,bucket_id,object_path,content_type,size_bytes,caption').eq('id',id).eq('organization_id',ctx.organization.id).eq('project_id',project).in('bucket_id',['project-assets','content-media']).single();
  if(error||!a||!libraryMediaType(a.content_type)||!a.object_path.startsWith(`${ctx.organization.id}/${project}/`))throw new ForbiddenError('This file is unavailable for this website.');
  const {data:info,error:infoError}=await admin.storage.from(a.bucket_id).info(a.object_path);if(infoError||!info||Number(info.size)!==a.size_bytes||info.contentType!==a.content_type)throw new ValidationError('This file is still uploading or unavailable. Try again when it finishes.');
  if(a.bucket_id==='project-assets'){const {error}=await client.rpc('attach_content_library_media',{p_collection:collection,p_asset:id});if(error)throw new ValidationError('This file is unavailable or its upload is incomplete.');}
  else{const {data:m,error}=await admin.from('website_content_media').select('id').eq('id',id).eq('website_id',websiteId).eq('organization_id',ctx.organization.id).eq('ready',true).maybeSingle();if(error||!m)throw new ForbiddenError();}
  const {data:signed,error:signError}=await admin.storage.from(a.bucket_id).createSignedUrl(a.object_path,900);if(signError)throw signError;
  return Response.json({media:{id,type:libraryMediaType(a.content_type),src:'',alt:'',caption:a.caption??''},url:signed.signedUrl},{headers});
 }catch(error){return failure(error);}
}
