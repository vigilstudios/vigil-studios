"use client";
import Link from "next/link";
import { useRef } from "react";
import { CompositionLab } from "@/design-engine/preview/composition/CompositionLab";
import { DesktopLabShell } from "@/design-engine/preview/editor/DesktopLabShell";
import { saveProfessionalSite } from "@/lib/vigil/actions/professional";
import type { ProjectWorkspace } from "@/lib/vigil/professional/workspace";
import type { SourceValue } from "@/design-engine/preview/composition/ProjectControls";
export function ProfessionalProjectWorkspace({ data }: { data: ProjectWorkspace }) {
 const revision = useRef(data.workspace.revision);
 const sources: SourceValue[] = [];
 const collect = (value: unknown, path = "brief") => {
  if (typeof value === "string" && value.trim()) sources.push({ label: path, value });
  else if (value && typeof value === "object") Object.entries(value).forEach(([key,item]) => collect(item, `${path}.${key}`));
 }; collect(data.brief);
 const context = <>
  <section className="composition-panel"><h2>{data.customer.name}</h2><p>{data.project.name} · Professional</p><p>This document and media library belong to this customer project. Save commits edits to their workspace.</p><p><a href={`/admin/websites/${data.website.id}`}>Website operations ↗</a> · <a href={`/admin/reviews/${data.project.id}`}>Customer review ↗</a></p></section>
  <section className="composition-panel"><h2>Client brief</h2><pre>{JSON.stringify(data.brief,null,2)}</pre></section>
  <section className="composition-panel"><h2>Media</h2>{data.assets.length ? data.assets.map(asset => <p key={asset.id}><a href={asset.previewUrl} target="_blank" rel="noreferrer">{asset.file_name}</a></p>) : <p>Customer uploads will appear here.</p>}</section>
 </>;
 return <DesktopLabShell><CompositionLab key={data.project.id} workspaceSwitch={<><Link href="/admin/lab/projects">← Client projects</Link><span>{data.customer.name} · {data.project.name}</span></>} project={{ id: data.project.id, site: data.workspace.site_definition, assets: data.assets, sources, context, save: async site => {
  const result = await saveProfessionalSite(data.project.id, site, revision.current);
  if (!result.ok) throw new Error(result.error); revision.current = result.data.revision;
 } }}/></DesktopLabShell>;
}
