"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { archiveExpressVariant, createExpressVariant } from "@/lib/vigil/actions/express-library";
import type { ExpressDraft } from "@/lib/vigil/express/document";
import { Card, inputClass, labelClass } from "./ui";
export type LibraryVariant = { id: string; slug: string; draft: ExpressDraft; revision: number; published_revision: number | null; archived_at: string | null };
export function ExpressLibrary({ variants }: { variants: LibraryVariant[] }) {
 const router=useRouter(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [archived,setArchived]=useState(false);
 async function create(form: FormData) {
  setBusy(true); setMessage("");
  const result=await createExpressVariant({name:String(form.get("name")??""),industry:String(form.get("industry")??""),duplicateId:String(form.get("duplicate")??"")||undefined});
  setBusy(false); if (!result.ok) {setMessage(result.error);return;} router.push(`/admin/lab/express/${result.data.id}`);
 }
 async function remove(variant: LibraryVariant) {
  setBusy(true); const result=await archiveExpressVariant(variant.id,variant.revision,Boolean(variant.archived_at)); setBusy(false);
  setMessage(result.ok ? variant.archived_at ? "Variant restored." : "Variant removed from the catalog. Restore it from Removed variants." : result.error); if(result.ok) router.refresh();
 }
 return <><Card><h2 className="font-semibold">Add a variant</h2><form action={create} className="mt-4 grid gap-4 md:grid-cols-4"><label className={labelClass}>Variant name<input className={inputClass} name="name" required maxLength={80} placeholder="e.g. Editorial"/></label><label className={labelClass}>Industry<input className={inputClass} name="industry" required maxLength={80} defaultValue="Creator" list="express-industries"/><datalist id="express-industries">{[...new Set(variants.map(v=>v.draft.industry))].map(industry=><option key={industry}>{industry}</option>)}</datalist></label><label className={labelClass}>Starting point<select name="duplicate" className={inputClass}><option value="">Blank · component library</option>{variants.filter(v=>!v.archived_at).map(v=><option key={v.id} value={v.id}>{v.draft.industry} · {v.draft.variant}</option>)}</select></label><button className="btn-primary self-end" disabled={busy}>Create variant</button></form></Card>
 <div className="my-5 flex items-center justify-between"><p role="status" className="text-sm">{message||"Save drafts privately. Publish when ready for the public catalog."}</p><button className="btn-secondary" aria-pressed={archived} onClick={()=>setArchived(!archived)}>{archived?"Active variants":"Removed variants"}</button></div>
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{variants.filter(v=>Boolean(v.archived_at)===archived).map(v=><Card key={v.id}><p className="text-xs uppercase tracking-widest" style={{color:v.draft.accent}}>{v.draft.industry}</p><h2 className="mt-2 text-xl font-semibold">{v.draft.variant}</h2><p className="mt-2 text-sm text-[color:var(--text-secondary)]">{v.draft.description||"A new variant ready to customize."}</p><p className="mt-4 text-xs">{v.archived_at?"Removed":v.published_revision===null?"Private draft":v.revision===v.published_revision?"Published":"Draft changes · published version retained"} · {v.draft.kind==="site"?"Component editor":"HTML source"}</p><div className="mt-4 flex flex-wrap gap-2">{!v.archived_at&&<Link className="btn-primary" href={`/admin/lab/express/${v.id}`}>Open variant</Link>}{!v.archived_at&&v.published_revision!==null&&<a className="btn-secondary" href={`/express-preview/${v.slug}`} target="_blank" rel="noreferrer">Live preview ↗</a>}<button disabled={busy} className="btn-secondary" onClick={()=>remove(v)}>{v.archived_at?"Restore":"Remove"}</button></div></Card>)}</div></>;
}
