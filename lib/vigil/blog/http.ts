import 'server-only';
import {z} from 'zod';
import {readBlogMedia,signedBlogImages} from './images';
import {referencedImages} from './media-contract';
import {createAdminClient} from '@/lib/supabase/admin';
import type {DbClient} from '../types';
export async function publicWebsiteBlog(request:Request,websiteId:string,adminFactory:()=>DbClient=createAdminClient,stableImages=true):Promise<Response>{
 const headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'};
 const respond=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(!z.string().uuid().safeParse(websiteId).success)return respond({error:'Blog unavailable.'},404);
 const url=new URL(request.url),slug=url.searchParams.get('slug'),page=Number(url.searchParams.get('page')??1),review=url.searchParams.get('review')==='published';
 if(slug&&!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug&&slug.length>120||!Number.isInteger(page)||page<1||page>10000)return respond({error:'Invalid blog request.'},400);
 try{
  const admin=adminFactory();const {data:website,error}=await admin.from('websites').select('organization_id,status').eq('id',websiteId).maybeSingle();
  if(error)throw new Error('Registry unavailable');if(!website)return respond({error:'Blog unavailable.'},404);
  const {data:org,error:orgError}=await admin.from('organizations').select('archived_at').eq('id',website.organization_id).maybeSingle();
  if(orgError)throw new Error('Registry unavailable');
  const {data:available,error:accessError}=await admin.rpc('website_blog_available',{p_website:websiteId});
  if(accessError)throw new Error('Scope unavailable');if(!available)return respond({error:'Blog unavailable.'},404);
  // Building previews show normal published articles only. Drafts and trash remain private.
  // The preview selector never overrides live/paused site lifecycle gating.
  if((review?!['building','live'].includes(website.status):website.status!=='live')||!org||org.archived_at)return slug?respond({error:'Post unavailable.'},404):respond({posts:[],page,total:0});
  let query=admin.from('website_blog_posts').select(slug?'slug,title,excerpt,body,published_at,updated_at,media':'slug,title,excerpt,published_at,updated_at,media',{count:'exact'}).eq('website_id',websiteId).eq('organization_id',website.organization_id).eq('review_sample',false).eq('status','published').is('deleted_at',null);
  if(slug)query=query.eq('slug',slug);
  const rows=await query.order('published_at',{ascending:false}).order('id',{ascending:false}).range(slug?0:(page-1)*12,slug?0:page*12-1);
  if(rows.error)throw new Error('Posts unavailable');if(slug&&!rows.data?.length)return respond({error:'Post unavailable.'},404);
  const posts=await Promise.all((rows.data??[]).map(async value=>{const p=value as unknown as {slug:string;title:string;excerpt:string;body:string;published_at:string;updated_at:string;media:unknown};const media=readBlogMedia(p.media),selected=slug?referencedImages(p.body,media):media.images.filter(i=>i.id===media.cover);const images=await signedBlogImages(admin,websiteId,website.organization_id,selected);return {slug:p.slug,title:p.title,excerpt:p.excerpt,published_at:p.published_at,updated_at:p.updated_at,...(slug?{body:p.body}:{}),...(images.length?{images:images.map(image=>({...image,url:stableImages?`https://www.vigilstudios.co/api/blog/${websiteId}/media/${image.id}?slug=${encodeURIComponent(p.slug)}${review?'&review=published':''}`:image.url})),cover:media.cover}:{})};}));
  return respond({posts,page,total:rows.count??0});
 }catch{return respond({error:'The blog could not load. Please try again.'},503);}
}
