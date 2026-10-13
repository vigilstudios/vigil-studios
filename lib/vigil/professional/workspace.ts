import "server-only";
import {createAdminClient} from '@/lib/supabase/admin';
import {ensureProfessionalBindings,contentCollections} from '@/lib/vigil/content/service';
import {applyBindings,recordsFromLab} from '@/lib/vigil/content/professional';
import {publicRecords} from '@/lib/vigil/content/media';
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { parseBrief } from "@/lib/vigil/onboarding/brief";
import { findProviderLink } from "@/lib/vigil/services/provider-links";
import { assetUrl, assertPortableSources, emptyProjectSite, projectDocument, selectedAssetUrls } from "./document";

export async function runtimeManifest(version?: string): Promise<{ version: string; schemaVersion: number; files: { path: string; sha256: string }[] }> {
  if (version && !/^v1-[a-f0-9]{20}$/.test(version)) throw new ValidationError("Invalid pinned Design Engine version.");
  return JSON.parse(await readFile(path.join(process.cwd(), "public/design-engine-runtime", ...(version ? [version] : []), "manifest.json"), "utf8"));
}
export async function professionalProject(client: DbClient, projectId: string) {
  const { data: project, error } = await client.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!project) throw new NotFoundError("Project not found.");
  if (project.kind !== "professional") throw new ValidationError("Open the Professional workspace from a Professional project.");
  const { data: website, error: siteError } = await client.from("websites").select("*").eq("project_id", project.id).eq("organization_id", project.organization_id).single();
  if (siteError) throw siteError;
  return { project, website };
}
export async function ensureDesignWorkspace(client: DbClient, projectId: string) {
  const { project, website } = await professionalProject(client, projectId);
  const { data: existing, error } = await client.from("design_workspaces").select("*").eq("project_id", project.id).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const manifest = await runtimeManifest();
  const { data, error: insertError } = await client.from("design_workspaces").insert({ project_id: project.id, website_id: website.id,
    organization_id: project.organization_id, site_definition: emptyProjectSite(project.id, project.name) as unknown as NonNullable<Json>, engine_version: manifest.version,
  }).select("*").single();
  if (insertError?.code === "23505") {
    const { data: winner, error: winnerError } = await client.from("design_workspaces").select("*").eq("project_id", project.id).single();
    if (winnerError) throw winnerError;
    return winner;
  }
  if (insertError) throw insertError;
  return data;
}
export async function projectAssets(client: DbClient, projectId: string, organizationId: string) {
  const { data, error } = await client.from("project_assets").select("*").eq("project_id", projectId).eq("organization_id", organizationId).eq("bucket_id","project-assets").order("created_at");
  if (error) throw error;
  for (const asset of data ?? []) {
    if (asset.bucket_id !== "project-assets" || !asset.object_path.startsWith(`${organizationId}/${projectId}/`)) {
      throw new ValidationError(`Asset ${asset.file_name} has inconsistent storage ownership. Repair its project association before use.`);
    }
  }
  return data ?? [];
}
export async function loadProjectWorkspace(client: DbClient, projectId: string) {
  const { project, website } = await professionalProject(client, projectId);
  const workspace = await ensureDesignWorkspace(client, project.id);
  const [org, creative, deployments, repository, assets] = await Promise.all([
    client.from("organizations").select("id,name,slug").eq("id", project.organization_id).single(),
    client.from("creative_workspaces").select("*").eq("website_id", website.id).eq("project_id", project.id).eq("organization_id", project.organization_id).maybeSingle(),
    client.from("deployments").select("*").eq("website_id", website.id).eq("organization_id", project.organization_id).order("created_at", { ascending: false }).limit(5),
    findProviderLink(client, { provider: "other", resourceKind: "repository", entityType: "website", entityId: website.id }),
    projectAssets(client, project.id, project.organization_id),
  ]);
  for (const result of [org, creative, deployments]) if (result.error) throw result.error;
  if (!org.data) throw new NotFoundError("Customer not found.");
  const media = await Promise.all(assets.map(async asset => {
    return { id: asset.id, file_name: asset.file_name, content_type: asset.content_type, caption: asset.caption, url: assetUrl(asset), previewUrl: `/api/admin/projects/${project.id}/assets/${asset.id}` };
  }));
  const document=projectDocument(workspace.site_definition,project.id);
  const collections=await ensureProfessionalBindings(createAdminClient(),website.id,project.organization_id,document);
  const bound=collections.filter(c=>c.binding.adapter==='professional');
  const editorSite=applyBindings(document,bound.map(c=>({...c,records:publicRecords(c.records,website.id,c.id,true).map(r=>({...r,data:'media' in r.data?{...r.data,media:r.data.media.map(m=>({...m,src:m.id?m.src+'&draft=1':m.src,poster:m.posterId?m.poster+'&draft=1':m.poster}))}:r.data}))})));
  return { project, website, contentRevisions:Object.fromEntries(bound.map(c=>[c.id,c.revision])), workspace: { ...workspace, site_definition: editorSite },
    customer: org.data, creative: creative.data, deployments: deployments.data ?? [], repository,
    assets: media, brief: parseBrief(project.brief) };
}
export async function saveProjectSite(client: DbClient, projectId: string, input: unknown, revision: number, userId: string, contentRevisions: Record<string,number> = {}, providedAdmin?:DbClient) {
  const { project,website } = await professionalProject(client, projectId);
  const site = projectDocument(input, project.id);
  if (JSON.stringify(site).length > 2_000_000) throw new ValidationError("Site Definition exceeds 2 MB.");
  const assets = await projectAssets(client, project.id, project.organization_id);
  const available = new Set(assets.map(assetUrl));
  if (selectedAssetUrls(site).some(url => !available.has(url))) throw new ValidationError("A selected asset is missing or belongs to another project. Select a current project asset.");
  const admin=providedAdmin??createAdminClient(),collections=await contentCollections(admin,website.id,project.organization_id);
  const bound=collections.filter(c=>c.binding.adapter==='professional');
  if(bound.some(c=>contentRevisions[c.id]!==c.revision))throw new ValidationError("Content changed in the Hub. Reload the workspace before saving; your unsaved design remains here.");
  const changes=bound.map(c=>({id:c.id,revision:c.revision,records:recordsFromLab(site,c)}));
  // Persist portable publication references, never editor signing addresses.
  const portable=applyBindings(site,bound.map(c=>({...c,records:publicRecords(changes.find(v=>v.id===c.id)!.records,website.id,c.id,true)})));
  assertPortableSources(portable);
  const {data,error}=await admin.rpc('save_content_design_workspace',{p_project:project.id,p_expected:revision,p_site:portable as unknown as Json,p_collections:changes as unknown as Json,p_actor:userId,p_engine:(await runtimeManifest()).version});
  if(error)throw new ValidationError(error.code==='40001'?"Another editor saved this project or its bound content. Reload before saving; your unsaved changes remain here.":"The workspace could not be saved.");
  const current=await ensureProfessionalBindings(admin,website.id,project.organization_id,portable);
  return {revision:data!,contentRevisions:Object.fromEntries(current.filter(c=>c.binding.adapter==='professional').map(c=>[c.id,c.revision]))};
}
export type ProjectWorkspace = Awaited<ReturnType<typeof loadProjectWorkspace>>;
