import { z } from "zod";
const text = (max = 220) => z.string().trim().min(1).max(max);
const id = text(40);
const image = z.object({ src: text(500), alt: text(300), width: z.number().positive(), height: z.number().positive() }).strict();
const detail = z.object({ label: text(60), href: z.string().regex(/^#[a-z0-9-]+$/) }).strict();
const item = { id, title: text(60) };
const base = { brand: text(60), title: text(100), introduction: text(260) };
const unique = <T extends {id:string}>(rows:T[]) => new Set(rows.map(r=>r.id)).size === rows.length;
const list = <T extends z.ZodTypeAny>(schema:T, min:number, max:number) => z.array(schema).min(min).max(max);
export const serviceStudySchemas = {
  C01: z.object({...base, entries:list(z.object({...item, summary:text(), deliverables:list(text(60),2,4), detail}).strict(),3,7).refine(unique,"Entry IDs must be unique")}).strict(),
  C02: z.object({...base, promise:text(120), principles:list(z.object({verb:text(28), pledge:text(160), boundary:text(120)}).strict(),3,5)}).strict(),
  C03: z.object({...base, capabilities:list(z.object({...item, category:text(32), description:text(), outcome:text(120), image, detail}).strict(),4,8).refine(unique,"Capability IDs must be unique")}).strict(),
  C04: z.object({...base, services:list(z.object({...item, summary:text(120), included:list(text(80),2,5), boundary:text(140), detail}).strict(),5,10).refine(unique,"Service IDs must be unique")}).strict(),
  C05: z.object({...base, situations:list(z.object({need:text(120), response:text(140), outcome:text(120), evidence:text(160)}).strict(),3,5)}).strict(),
  C06: z.object({...base, stages:list(z.object({...item, input:text(100), work:text(140), output:text(100), owner:text(60)}).strict(),3,6).refine(unique,"Stage IDs must be unique")}).strict(),
  C07: z.object({...base, phases:list(text(32),3,4), groups:list(z.object({name:text(40), capabilities:list(z.object({...item, coverage:list(z.enum(["Lead","Support","—"]),3,4)}).strict(),2,5).refine(unique,"Capability IDs must be unique")}).strict(),3,4)}).strict().refine(v=>v.groups.every(g=>g.capabilities.every(c=>c.coverage.length===v.phases.length)),"Every capability needs one coverage value per phase"),
  C08: z.object({...base, input:text(80), output:text(80), layers:list(z.object({...item, responsibility:text(100), components:list(text(50),2,4), handoff:text(80)}).strict(),3,5).refine(unique,"Layer IDs must be unique")}).strict(),
  C09: z.object({...base, plates:list(z.object({...item, image, caption:text(160), application:text(140), detail}).strict(),3,5).refine(unique,"Plate IDs must be unique")}).strict(),
  C10: z.object({...base, cases:list(z.object({...item, before:z.object({image,label:text(60),note:text(140)}).strict(), after:z.object({image,label:text(60),note:text(140)}).strict(), capability:text(80), evidence:text(180)}).strict(),2,4).refine(unique,"Case IDs must be unique")}).strict(),
  C11: z.object({...base, question:text(100), paths:list(z.object({...item, need:text(90), recommendation:text(100), reason:text(160), alternative:text(120), detail}).strict(),3,5).refine(unique,"Path IDs must be unique")}).strict(),
  C12: z.object({...base, criteria:list(text(60),5,10), offerings:list(z.object({...item, bestFor:text(140), values:list(text(70),5,10), boundary:text(120), detail}).strict(),2,3).refine(unique,"Offering IDs must be unique")}).strict().refine(v=>v.offerings.every(o=>o.values.length===v.criteria.length),"Every offering needs a value for each comparison criterion"),
};
export type ServiceStudyId = keyof typeof serviceStudySchemas;
export type StudyContent<K extends ServiceStudyId> = z.infer<(typeof serviceStudySchemas)[K]>;
export type ServiceContent = {[K in ServiceStudyId]:{kind:K;content:StudyContent<K>}}[ServiceStudyId];
