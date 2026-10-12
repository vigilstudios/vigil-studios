import 'server-only';
import type {DbClient} from '../types';
import {BLOG_IMAGE_BUCKET,blogMediaSchema,EMPTY_BLOG_MEDIA,type BlogImage,type BlogMedia} from './media-contract';
export function readBlogMedia(value:unknown):BlogMedia{const result=blogMediaSchema.safeParse(value);return result.success?result.data:EMPTY_BLOG_MEDIA;}
/** Sign only previously authorized, site+tenant-scoped rows. No browser URLs/paths are accepted. */
export async function signedBlogImages(admin:DbClient,website:string,org:string,images:BlogMedia['images']):Promise<BlogImage[]>{
 if(!images.length)return [];
 const {data:rows,error}=await admin.from('website_blog_images').select('id,object_path,width,height').eq('website_id',website).eq('organization_id',org).in('id',images.map(i=>i.id));
 if(error)throw new Error('Image library unavailable');if(!rows?.length)return [];
 const {data:signed,error:signError}=await admin.storage.from(BLOG_IMAGE_BUCKET).createSignedUrls(rows.map(r=>r.object_path),3600);if(signError)throw new Error('Images unavailable');
 return images.flatMap(image=>{const row=rows.find(r=>r.id===image.id),url=row&&signed?.find(s=>s.path===row.object_path)?.signedUrl;return row&&url?[{...image,url,width:row.width,height:row.height}]:[];});
}
