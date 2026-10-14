import {isSameOriginRequest} from '@/lib/vigil/auth/origin';
import {requirePublicSupabaseEnv} from '@/lib/supabase/env';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireOrgContextOrThrow,assertOrgRole} from '@/lib/vigil/auth/session';
import {authorizeCollection} from '@/lib/vigil/content/service';
import {ForbiddenError,ValidationError,isVigilError} from '@/lib/vigil/auth/errors';
import {boundedImageForm,normalizeBlogImage} from '@/lib/vigil/blog/image-upload';
import {enforceRateLimit,RATE_LIMITS} from '@/lib/vigil/rate-limit';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
async function context(request:Request,websiteId:string){
 if(!request.headers.get('origin')||!isSameOriginRequest(request))throw new ForbiddenError();
 const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);const client=await createClient(),collection=z.string().uuid().parse(new URL(request.url).searchParams.get('collection')),c=await authorizeCollection(client,ctx.organization.id,collection);if(c.website_id!==websiteId||!['portfolio','gallery','testimonials','products','services'].includes(c.module))throw new ForbiddenError();return {ctx,client,collection,admin:createAdminClient()};
}
export async function POST(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 try{const {websiteId}=await params,{ctx,client,collection,admin}=await context(request,websiteId);await enforceRateLimit(`content-media:${ctx.organization.id}`,RATE_LIMITS.filesOrg);
  const isImage=(request.headers.get('content-type')??'').startsWith('multipart/form-data;');
  let bytes:Buffer|undefined,name:string,type:string,size:number,width:number|undefined,height:number|undefined;
  if(isImage){const form=await boundedImageForm(request),file=form.get('image');if(!(file instanceof File))throw new ValidationError('Choose a photo.');const normalized=await normalizeBlogImage(file);bytes=normalized.data;name=file.name.replace(/\.[^.]*$/,'').slice(0,170)+'.webp';type='image/webp';size=bytes.byteLength;width=normalized.width;height=normalized.height;}
  else{if(Number(request.headers.get('content-length'))>2048)throw new ValidationError('Upload videos directly.');const parsed=z.object({name:z.string().min(1).max(180),type:z.enum(['video/mp4','video/webm']),size:z.number().int().positive().max(524288000)}).strict().parse(await request.json());({name,type,size}=parsed);}
  const id=randomUUID(),{data:path,error}=await client.rpc('reserve_content_media',{p_collection:collection,p_id:id,p_name:name,p_type:type,p_size:size});if(error||!path)throw new ValidationError('Upload could not start. Check the supported format and your file-library allowance.');
  if(bytes){const {error:uploadError}=await admin.storage.from('content-media').upload(path,bytes,{contentType:type,upsert:false});if(uploadError)throw new Error('Upload failed');const {error:readyError}=await admin.from('website_content_media').update({ready:true}).eq('id',id).eq('website_id',websiteId);if(readyError)throw readyError;const {data:signed,error:signError}=await admin.storage.from('content-media').createSignedUrl(path,900);if(signError)throw signError;return Response.json({media:{id,type:'image',src:'',alt:'',caption:'',width,height},url:signed.signedUrl},{headers});}
  const {data:token,error:tokenError}=await admin.storage.from('content-media').createSignedUploadUrl(path,{upsert:false});if(tokenError)throw tokenError;
  const storageUrl=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);storageUrl.hostname=storageUrl.hostname.replace('.supabase.co','.storage.supabase.co');
  return Response.json({id,path,token:token.token,endpoint:`${storageUrl.origin}/storage/v1/upload/resumable/sign`,anonKey:requirePublicSupabaseEnv().publishableKey},{headers});
 }catch(error){return Response.json({error:isVigilError(error)?error.message:'Upload could not start. Please try again.'},{status:isVigilError(error)?error.status:503,headers});}
}
export async function PATCH(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 try{const {websiteId}=await params,{ctx,admin}=await context(request,websiteId),{id}=z.object({id:z.string().uuid()}).strict().parse(await request.json());
  const {data:media,error}=await admin.from('website_content_media').select('id,type').eq('id',id).eq('website_id',websiteId).eq('organization_id',ctx.organization.id).maybeSingle();if(error||!media)throw new ForbiddenError();
  const {data:asset,error:assetError}=await admin.from('project_assets').select('object_path,size_bytes,content_type').eq('id',id).eq('organization_id',ctx.organization.id).eq('bucket_id','content-media').single();if(assetError)throw assetError;
  const {data:info,error:infoError}=await admin.storage.from('content-media').info(asset.object_path);if(infoError||!info||Number(info.size)!==asset.size_bytes||info.contentType!==asset.content_type)throw new ValidationError('Upload is incomplete or does not match the selected file. Try again.');
  const {error:readyError}=await admin.from('website_content_media').update({ready:true}).eq('id',id).eq('website_id',websiteId);if(readyError)throw readyError;
  const {data:signed,error:signError}=await admin.storage.from('content-media').createSignedUrl(asset.object_path,900);if(signError)throw signError;
  return Response.json({media:{id,type:media.type,src:'',alt:'',caption:''},url:signed.signedUrl},{headers});
 }catch(error){return Response.json({error:isVigilError(error)?error.message:'Upload could not finish. Please try again.'},{status:isVigilError(error)?error.status:503,headers});}
}
