import {z} from 'zod';
export const blogInputSchema=z.object({slug:z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),title:z.string().trim().min(1).max(160),excerpt:z.string().trim().max(400),body:z.string().max(60000),publish:z.boolean()}).refine(v=>!v.publish||v.body.trim().length>0,{path:['body'],message:'Write the post before publishing.'});
/** Plain text blocks: no HTML or executable markup, rendered as React text by both surfaces. */
export function blogBlocks(body:string){return body.replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(block=>block.trim()).map(block=>{const text=block.trim();return text.startsWith('## ')?{kind:'heading' as const,text:text.slice(3)}:{kind:'paragraph' as const,text};});}
