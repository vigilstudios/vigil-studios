"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CompositionLab } from "@/design-engine/preview/composition/CompositionLab";
import { DesktopLabShell } from "@/design-engine/preview/editor/DesktopLabShell";
import { saveExpressVariant } from "@/lib/vigil/actions/express-library";
import type { ExpressDraft } from "@/lib/vigil/express/document";
import type { LibraryVariant } from "./ExpressLibrary";
import { inputClass, labelClass } from "./ui";
export function ExpressVariantWorkspace({ variant }: { variant: LibraryVariant }) {
 const revision=useRef(variant.revision); const draft=useRef<ExpressDraft>(variant.draft);
 const [metadata,setMetadata]=useState(variant.draft); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 const [metadataDirty,setMetadataDirty]=useState(false);
 function editMetadata(key: "variant"|"industry"|"example"|"description"|"accent", value: string) {
  setMetadata(previous=>({...previous,[key]:value}));draft.current={...draft.current,[key]:value};setMetadataDirty(true);
 }
 useEffect(()=>{if(!metadataDirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[metadataDirty]);
 async function save(publish=false) {
  const result=await saveExpressVariant(variant.id,revision.current,draft.current,publish);
  if(!result.ok)throw new Error(result.error); revision.current=result.data.revision;setMetadataDirty(false);
  setMessage(publish?"Published. The public catalog now uses this version.":"Draft saved. The public catalog keeps the published version.");
 }
 const fields=<div className="grid gap-4">{(["variant","industry","example","description","accent"] as const).map(key=><label className={labelClass} key={key}>{({variant:"Variant name",industry:"Industry",example:"Example name",description:"Catalog description",accent:"Accent color"})[key]}{key==="description"?<textarea className={inputClass} value={metadata[key]} maxLength={1000} onChange={e=>editMetadata(key,e.target.value)}/>:<input className={inputClass} type={key==="accent"?"color":"text"} value={metadata[key]} maxLength={key==="example"?120:80} onChange={e=>editMetadata(key,e.target.value)}/>}</label>)}</div>;
 const context=<section className="composition-panel"><h2>Catalog settings</h2>{fields}<p className="mt-4 text-sm">Save draft stores your work privately. Publish updates the public catalog and the starting template for future purchases.</p><p role="status">{message}</p><a href={`/express-preview/${variant.slug}`} target="_blank" rel="noreferrer">Open published preview ↗</a></section>;
 const heading=<><Link href="/admin/lab/express">← Express catalog</Link><span>{metadata.industry} · {metadata.variant}</span></>;
 if(variant.draft.kind==="site")return <DesktopLabShell><CompositionLab key={variant.id} workspaceSwitch={heading} project={{id:variant.id,site:variant.draft.site,assets:[],sources:[],context,saveLabel:"Save draft",publishLabel:"Publish variant",contextLabel:"Catalog",save:async site=>{draft.current={...draft.current,kind:"site",site};await save();},publish:async site=>{draft.current={...draft.current,kind:"site",site};await save(true);}}}/></DesktopLabShell>;
 return <div className="p-6"><div className="mb-5 flex items-center gap-5">{heading}</div><div className="grid gap-6 lg:grid-cols-[320px_1fr]">{context}<div><label className={labelClass}>Template HTML<textarea className={`${inputClass} min-h-[420px] font-mono text-xs`} value={metadata.kind==="html"?metadata.html:""} onChange={e=>{setMetadata({...metadata,kind:"html",html:e.target.value});draft.current={...draft.current,kind:"html",html:e.target.value};setMetadataDirty(true);}}/></label><div className="my-4 flex gap-3">{[false,true].map(publish=><button key={String(publish)} className={publish?"btn-primary":"btn-secondary"} disabled={busy} onClick={async()=>{setBusy(true);try{await save(publish);}catch(error){setMessage(error instanceof Error?error.message:"Save failed.");}finally{setBusy(false);}}}>{publish?"Publish variant":"Save draft"}</button>)}</div><iframe className="h-[700px] w-full bg-white" title="Variant draft preview" sandbox="allow-scripts" srcDoc={metadata.kind==="html"?metadata.html:""}/></div></div></div>;
}
