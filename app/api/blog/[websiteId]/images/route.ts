import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireOrgContextOrThrow,assertOrgRole} from '@/lib/vigil/auth/session';
import {ForbiddenError,isVigilError,ValidationError} from '@/lib/vigil/auth/errors';
import {enforceRateLimit,RATE_LIMITS} from '@/lib/vigil/rate-limit';
import {boundedImageForm,normalizeBlogImage} from '@/lib/vigil/blog/image-upload';
import {BLOG_IMAGE_BUCKET} from '@/lib/vigil/blog/media-contract';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{websiteId:string}>}){
 const headers={'Cache-Control':'no-store'};
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)throw new ForbiddenError();
  const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);
  const website=z.string().uuid().parse((await params).websiteId),client=await createClient();
  const {data:site,error}=await client.from('websites').select('project_id,organization_id').eq('id',website).eq('organization_id',ctx.organization.id).maybeSingle();
  if(error||!site?.project_id)throw new ForbiddenError();const {data:available,error:scopeError}=await client.rpc('website_blog_available',{p_website:website});if(scopeError||!available)throw new ForbiddenError();
  await enforceRateLimit(`blog-images:${ctx.organization.id}`,RATE_LIMITS.filesOrg);
  const form=await boundedImageForm(request),file=form.get('image');if(!(file instanceof File))throw new ValidationError('Choose a photo.');const normalized=await normalizeBlogImage(file);
  const admin=createAdminClient(),id=randomUUID(),path=`${ctx.organization.id}/${site.project_id}/${id}.webp`;
  const {error:uploadError}=await admin.storage.from(BLOG_IMAGE_BUCKET).upload(path,normalized.data,{contentType:'image/webp',upsert:false});if(uploadError)throw new Error('Storage unavailable');
  let recorded=false;
  try{
   // Existing project-assets quota trigger executes under the authenticated user.
   const {error:assetError}=await client.from('project_assets').insert({id,organization_id:ctx.organization.id,project_id:site.project_id,kind:'photo',bucket_id:BLOG_IMAGE_BUCKET,object_path:path,file_name:file.name.slice(0,180).replace(/\.[^.]*$/,'')+'.webp',content_type:'image/webp',size_bytes:normalized.data.byteLength,uploaded_by:ctx.user.id});
   if(assetError)throw new ValidationError('Your image could not be kept. Check your file-library allowance or try again.');recorded=true;
   const {error:recordError}=await admin.from('website_blog_images').insert({id,organization_id:ctx.organization.id,website_id:website,object_path:path,width:normalized.width,height:normalized.height});if(recordError)throw new Error('Image registration failed');
   const {data:signed,error:signError}=await admin.storage.from(BLOG_IMAGE_BUCKET).createSignedUrl(path,3600);if(signError||!signed)throw new Error('Image preview unavailable');
   return Response.json({image:{id,url:signed.signedUrl,width:normalized.width,height:normalized.height,alt:'',caption:''}},{headers});
  }catch(failure){if(recorded)await client.from('project_assets').delete().eq('id',id).eq('organization_id',ctx.organization.id);await admin.storage.from(BLOG_IMAGE_BUCKET).remove([path]);throw failure;}
 }catch(error){return Response.json({error:isVigilError(error)?error.message:'The image could not upload. Please try again.'},{status:isVigilError(error)?error.status:503,headers});}
}
