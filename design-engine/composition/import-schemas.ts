import { z } from "zod";
import { imageSchema } from "../media/types";
import { photoRecordSchema } from "./collection-schemas";
const text = (max:number) => z.string().trim().min(1).max(max);
const intro = {title:text(180),introduction:text(600),eyebrow:text(100).optional()};
const unique = <T extends {id:string}>(items:T[]) => new Set(items.map(i=>i.id)).size === items.length;
const media = z.array(photoRecordSchema).min(3).max(16).refine(unique,"Unique media IDs required").refine(items=>items.length<=8 || items.every(i=>i.thumbnail),"More than eight images require dedicated thumbnails");
export const importSectionSchemas = {
 "hero.image-marquee":z.object({content:z.object({...intro,images:media}).strict(),structure:z.enum(["center","start"]),motion:z.enum(["none","marquee"]),direction:z.enum(["left","right"]),speed:z.enum(["slow","medium","fast"]),tilt:z.enum(["flat","alternating"]),ratio:z.enum(["portrait","square","landscape"]),surface:z.enum(["transparent","surface","framed"])}).strict(),
 "story.process-timeline":z.object({content:z.object({...intro,period:text(100).optional(),image:imageSchema.optional(),steps:z.array(z.object({id:text(80),label:text(60),title:text(120),body:text(600)}).strict()).min(2).max(10).refine(unique,"Unique step IDs required")}).strict(),structure:z.enum(["alternating","above"]),motion:z.enum(["none","horizontal-scroll"]),density:z.enum(["open","compact"]),surface:z.enum(["transparent","surface","framed"])}).strict(),
 "work.image-sphere":z.object({content:z.object({...intro,images:z.array(photoRecordSchema).min(4).max(32).refine(unique,"Unique media IDs required").refine(items=>items.length<=8 || items.every(i=>i.thumbnail),"More than eight images require dedicated thumbnails")}).strict(),structure:z.enum(["center","split"]),motion:z.enum(["none","depth-shift"]),speed:z.enum(["slow","medium","fast"]),direction:z.enum(["left","right"]),shape:z.enum(["circle","rounded"]),surface:z.enum(["transparent","surface","framed"])}).strict(),
} as const;
export const importSectionIds = ["hero.image-marquee","story.process-timeline","work.image-sphere"] as const;
export type ImportSectionId = typeof importSectionIds[number];
