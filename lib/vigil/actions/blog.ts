'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
import {requireOrgContextOrThrow,assertOrgRole} from '../auth/session';
import {blogMediaSchema} from '../blog/media-contract';
import {blogInputSchema} from '../blog/contract';
import {ForbiddenError,ValidationError,toActionError,type ActionResult} from '../auth/errors';
export async function saveBlogPost(websiteId:string,postId:string|null,form:FormData):Promise<ActionResult<{id:string}>>{
 try{
  const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);const client=await createClient();
  const website=z.string().uuid().parse(websiteId);const {data:site,error:lookup}=await client.from('websites').select('id').eq('id',website).eq('organization_id',ctx.organization.id).maybeSingle();
  if(lookup)throw lookup;if(!site)throw new ForbiddenError();
  const intent=z.enum(['draft','publish']).safeParse(form.get('intent'));if(!intent.success)throw new ValidationError('Choose Save draft or Publish post.');
  const parsed=blogInputSchema.safeParse({slug:form.get('slug'),title:form.get('title'),excerpt:form.get('excerpt'),body:form.get('body'),publish:intent.data==='publish'});
  if(!parsed.success)throw new ValidationError(parsed.error.issues[0]?.message??'Check your post.');
  const media=blogMediaSchema.safeParse(JSON.parse(String(form.get('media')??'{"cover":null,"images":[]}')));if(!media.success)throw new ValidationError('Check your images.');
  const v=parsed.data,expected=String(form.get('expected')??'');
  const {data,error}=await client.rpc('save_website_blog_post',{p_website:website,p_slug:v.slug,p_title:v.title,p_excerpt:v.excerpt,p_body:v.body,p_publish:v.publish,p_media:media.data,...(postId?{p_post:z.string().uuid().parse(postId),p_expected:z.string().datetime({offset:true}).parse(expected)}:{})});
  if(error){if(error.code==='40001')throw new ValidationError('This post changed in another window. Reload before saving.');if(error.code==='23505')throw new ValidationError('Another post already uses that address.');throw new ValidationError('Your post could not be saved. Check the fields and keep the published address unchanged.');}
  if(!data)throw new ValidationError('Your post could not be saved.');revalidatePath('/dashboard/blog');return {ok:true,data:{id:data}};
 }catch(error){return toActionError(error);}
}
