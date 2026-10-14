import { z } from 'zod';
export const modules = ['blog','portfolio','gallery','testimonials','products','services','faq'] as const;
export const moduleSchema = z.enum(modules);
export type ContentModule = z.infer<typeof moduleSchema>;
export const moduleLabels: Record<ContentModule,string> = {blog:'Blog',portfolio:'Portfolio',gallery:'Gallery',testimonials:'Testimonials',products:'Products',services:'Services',faq:'FAQ'};
const text = (max:number) => z.string().max(max);
export const safeContentUrl = z.string().max(2000).refine(v => !v || /^(https:\/\/|\/(?!\/))[^\s\\]*$/.test(v)&&!/^https:\/\/[^/]*@/.test(v)&&!/(?:\/storage\/v1\/object\/(?:sign|authenticated)|\/api\/admin\/|[?&]draft=1)/i.test(v), 'Use an HTTPS or website link.');
export const mediaSchema = z.object({id:z.string().uuid().optional(),type:z.enum(['image','video']),src:safeContentUrl,poster:safeContentUrl.optional(),posterId:z.string().uuid().optional(),alt:text(240),caption:text(400).default(''),width:z.number().int().positive().max(25000).optional(),height:z.number().int().positive().max(25000).optional()}).strict();
const common={title:text(160),description:text(4000).default(''),category:text(100).default(''),media:z.array(mediaSchema).max(30).default([])};
export const payloadSchemas={
 portfolio:z.object({...common,context:text(700).default(''),brand:text(160).default(''),tags:z.array(text(80)).max(20).default([]),link:safeContentUrl.default('')}).strict(),
 gallery:z.object({...common,collection:text(100).default('')}).strict(),
 testimonials:z.object({title:text(160),quote:text(4000),attribution:text(160),role:text(160).default(''),company:text(160).default(''),placeholder:z.boolean().default(false),media:z.array(mediaSchema).max(1).default([])}).strict(),
 products:z.object({...common,priceLabel:text(160).default(''),link:safeContentUrl.default(''),providerRef:text(200).default('')}).strict(),
 services:z.object({...common,link:safeContentUrl.default('')}).strict(),
 faq:z.object({title:text(160),answer:text(4000)}).strict(),
};
export type ContentPayload = z.infer<(typeof payloadSchemas)[keyof typeof payloadSchemas]>;
export type ContentMedia = z.infer<typeof mediaSchema>;
export const recordSchema = z.object({id:z.string().uuid(),slug:z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(120),data:z.unknown(),deleted:z.boolean().default(false),featured:z.boolean().default(false)}).strict();
export type ContentRecord = Omit<z.infer<typeof recordSchema>,'data'> & {data:ContentPayload};
export const bindingSchema=z.object({version:z.literal(1),key:z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(180),module:moduleSchema,pageId:z.string().max(100),sectionId:z.string().max(100),field:z.string().max(100),adapter:z.enum(['professional','standalone','blog']),label:z.string().max(160)}).strict();
export type ContentBinding=z.infer<typeof bindingSchema>;
export function parseRecords(module:Exclude<ContentModule,'blog'>,input:unknown):ContentRecord[]{
 const rows=z.array(recordSchema).max(500).parse(input);
 if(new Set(rows.map(r=>r.id)).size!==rows.length||new Set(rows.map(r=>r.slug)).size!==rows.length)throw new Error('Each entry needs a unique address.');
 return rows.map(row=>({...row,data:payloadSchemas[module].parse(row.data)}));
}
export function publicationIssues(module:Exclude<ContentModule,'blog'>,rows:ContentRecord[]):string[]{
 return rows.filter(row=>!row.deleted).flatMap(row=>{
  const d=row.data,issues:string[]=[];
  if(!d.title.trim())issues.push('Add a title to every entry.');
  if(module==='testimonials'&&'quote' in d&&(!d.quote.trim()||!d.attribution.trim()))issues.push('Add the quote and attribution.');
  if(module==='faq'&&'answer' in d&&!d.answer.trim())issues.push('Add an answer.');
  if('media' in d&&d.media.some(m=>!m.alt.trim()||m.type==='video'&&!m.poster&&!m.posterId))issues.push('Add media descriptions and a poster for each video.');
  return issues;
 });
}
