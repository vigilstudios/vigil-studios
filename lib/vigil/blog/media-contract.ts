import {z} from 'zod';
export const BLOG_IMAGE_BUCKET='blog-images';
export const BLOG_IMAGE_MAX_BYTES=3*1024*1024;
export const blogMediaSchema=z.object({cover:z.string().uuid().nullable(),images:z.array(z.object({id:z.string().uuid(),alt:z.string().trim().max(240),caption:z.string().trim().max(400)})).max(10)}).superRefine((v,ctx)=>{if(new Set(v.images.map(i=>i.id)).size!==v.images.length||v.cover&&!v.images.some(i=>i.id===v.cover))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Check the images in this post.'});});
export type BlogMedia=z.infer<typeof blogMediaSchema>;
export type BlogImage=BlogMedia['images'][number]&{url:string;width:number;height:number};
export const EMPTY_BLOG_MEDIA:BlogMedia={cover:null,images:[]};
export const imageMarker=(id:string)=>`[[image:${id}]]`;
export function imageInBlock(text:string){return /^\[\[image:([0-9a-f-]{36})\]\]$/i.exec(text.trim())?.[1]?.toLowerCase()??null;}
export function referencedImages(body:string,media:BlogMedia){const ids=new Set(body.split(/\n\s*\n/).map(imageInBlock).filter(Boolean));if(media.cover)ids.add(media.cover);return media.images.filter(image=>ids.has(image.id));}
