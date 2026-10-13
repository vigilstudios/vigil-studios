import "server-only";
import {ensureProfessionalBindings} from '@/lib/vigil/content/service';
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GitHubRefMovedError, GitHubRepositoryProvider } from "@/lib/vigil/providers/github";
import { ValidationError } from "@/lib/vigil/auth/errors";
import type { DbClient } from "@/lib/vigil/types";
import { findProviderLink } from "@/lib/vigil/services/provider-links";
import { gitBlobSha } from "@/lib/vigil/creative/workspace";
import { resolveRoutes } from "@/design-engine/site/routes";
import { serializeSite } from "@/design-engine/site/persistence";
import type { SiteDefinition } from "@/design-engine/site/model";
import { assertDeployable, assetUrl, projectDocument, selectedAssetUrls } from "./document";
import { ensureDesignWorkspace, professionalProject, projectAssets, runtimeManifest } from "./workspace";

type Repository = Pick<GitHubRepositoryProvider, "getBranchHead" | "listTree" | "commitFiles">;
export function projectMetadata(input: { projectId: string; websiteId: string; engineVersion: string; revision: number; creativeId?: string | null }) {
  return JSON.stringify({ version: 1, projectId: input.projectId, websiteId: input.websiteId, package: "professional",
    designEngineVersion: input.engineVersion, siteDefinition: ".vigil/site-definition.json", siteDefinitionRevision: input.revision,
    creativePackage: { id: input.creativeId ?? null, path: ".vigil/creative" },
  }, null, 2) + "\n";
}
const htmlText = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export function siteRouteFiles(site: SiteDefinition, engineVersion: string) {
  const document = serializeSite(site).replace(/</g, "\\u003c");
  const runtime = `/_vigil/runtime/${engineVersion}`;
  const routes = resolveRoutes(site);
  return site.pages.map(page => ({ path: `site${routes.get(page.id) === "/" ? "" : routes.get(page.id)}/index.html`, content:
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlText(page.seo.title ?? page.title + " · " + site.title)}</title><meta name="description" content="${htmlText(page.seo.description ?? "")}"><meta name="robots" content="${page.seo.noIndex ? "noindex,nofollow" : "index,follow"}"><link rel="icon" href="data:,"><link rel="stylesheet" href="${runtime}/client.css"><link rel="stylesheet" href="${runtime}/fonts.css"></head><body><div id="root"></div><script id="vigil-site" type="application/json">${document}</script><script src="${runtime}/client.js" defer></script></body></html>\n`,
  }));
}

/** Lease + compare-and-swap + non-forced Git commit. Failed exports retain the saved draft. */
export async function syncProjectRepository(admin: DbClient, projectId: string, deps: {
  repository?: Repository; downloadAsset?: (bucket: string, objectPath: string) => Promise<Buffer>;
} = {}): Promise<{ commitSha: string; revision: number; branch: string }> {
  const repository = deps.repository ?? new GitHubRepositoryProvider();
  const { project, website } = await professionalProject(admin, projectId);
  await ensureDesignWorkspace(admin, project.id);
  const token = randomUUID();
  const { data: claimed, error: claimError } = await admin.rpc("claim_design_sync", { p_project_id: project.id, p_token: token });
  if (claimError) throw claimError;
  if (!claimed) throw new ValidationError("A repository export is already running. Retry after it finishes; interrupted exports unlock after 15 minutes.");
  try {
    const { data: workspace, error } = await admin.from("design_workspaces").select("*").eq("project_id", project.id).single();
    if (error) throw error;
    const site = projectDocument(workspace.site_definition, project.id);
    assertDeployable(site);
    const link = await findProviderLink(admin, { provider: "other", resourceKind: "repository", entityType: "website", entityId: website.id });
    const meta = link?.metadata as { full_name?: string; default_branch?: string; project_id?: string; website_id?: string } | undefined;
    if (!meta?.full_name || meta.project_id !== project.id || meta.website_id !== website.id) throw new ValidationError("Create or repair this project's repository link before export.");
    const branch = meta.default_branch || "main";
    const { data: creative, error: creativeError } = await admin.from("creative_workspaces").select("id").eq("project_id", project.id).eq("website_id", website.id).maybeSingle();
    if (creativeError) throw creativeError;
    const collections=await ensureProfessionalBindings(admin,website.id,project.organization_id,site);
    const runtimeId=createHash('sha256').update(serializeSite(site)+workspace.engine_version).digest('hex');
    const snapshotId=`${runtimeId.slice(0,8)}-${runtimeId.slice(8,12)}-4${runtimeId.slice(13,16)}-a${runtimeId.slice(17,20)}-${runtimeId.slice(20,32)}`;
    const {error:snapshotError}=await admin.from('website_content_runtimes').upsert({id:snapshotId,website_id:website.id,organization_id:project.organization_id,site_definition:site as unknown as import('@/types/database.types').Json,engine_version:workspace.engine_version,binding_keys:collections.map(c=>c.binding.key)}, {onConflict:'id',ignoreDuplicates:true});if(snapshotError)throw snapshotError;
    const files: { path: string; content: Buffer | string }[] = [
      { path: ".vigil/site-definition.json", content: serializeSite(site) },
      { path: "vigil.project.json", content: projectMetadata({ projectId: project.id, websiteId: website.id, engineVersion: workspace.engine_version, revision: workspace.revision, creativeId: creative?.id }) },
      ...siteRouteFiles(site, workspace.engine_version),
      // Static routes are actual files. Removed pages disappear on export; unknown paths stay 404.
      { path: "site/vercel.json", content: JSON.stringify({ cleanUrls:true,trailingSlash:false,git:{deploymentEnabled:false},rewrites:site.pages.map(page=>({source:resolveRoutes(site).get(page.id),destination:`https://www.vigilstudios.co/api/content/${website.id}/runtime/${snapshotId}/${page.id}?review=published`})) },null,2) },
    ];
    const manifest = await runtimeManifest(workspace.engine_version);
    for (const file of manifest.files) {
      const bytes = await readFile(path.join(process.cwd(), "public/design-engine-runtime", workspace.engine_version, file.path));
      if (createHash("sha256").update(bytes).digest("hex") !== file.sha256) throw new ValidationError("Pinned engine distribution checksum failed. Rebuild or restore the matching release.");
      files.push({ path: `site/_vigil/runtime/${workspace.engine_version}/${file.path}`, content: bytes });
    }
    const assets = await projectAssets(admin, project.id, project.organization_id);
    let totalBytes = 0;
    for (const url of selectedAssetUrls(site)) {
      const asset = assets.find(asset => assetUrl(asset) === url);
      if (!asset) throw new ValidationError("A selected asset is missing or belongs to another project.");
      totalBytes += asset.size_bytes;
      if (totalBytes > 100 * 1024 * 1024) throw new ValidationError("Selected site media exceeds the 100 MB export limit. Use optimized media before retrying.");
      const bytes = deps.downloadAsset ? await deps.downloadAsset(asset.bucket_id, asset.object_path) : await download(admin, asset.bucket_id, asset.object_path);
      if (asset.checksum && createHash("sha256").update(bytes).digest("hex") !== asset.checksum) throw new ValidationError(`Checksum mismatch for ${asset.file_name}. Re-upload the asset before exporting.`);
      files.push({ path: `site${url}`, content: bytes });
    }
    const generated = Object.fromEntries(files.map(file => [file.path, gitBlobSha(file.content)]));
    const previous = workspace.generated_files as Record<string, string>;
    const pending = workspace.pending_files as Record<string, string>;
    let commitSha = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const head = await repository.getBranchHead(meta.full_name, branch);
      const tree = await repository.listTree(meta.full_name, head.treeSha, "");
      const changes = files.filter(file => tree.get(file.path) !== generated[file.path]);
      const deletions = Object.keys(previous).filter(file => !generated[file] && tree.has(file));
      for (const file of [...changes.map(file => file.path), ...deletions]) {
        const current = tree.get(file);
        if (current && current !== previous[file] && current !== pending[file]) throw new ValidationError(`Repository file ${file} was edited outside the workspace. Reconcile the change before retrying export.`);
      }
      const { error: pendingError } = await admin.from("design_workspaces").update({ pending_files: generated }).eq("project_id", project.id).eq("sync_token", token);
      if (pendingError) throw pendingError;
      try {
        commitSha = changes.length || deletions.length ? (await repository.commitFiles(meta.full_name, {
          branch, parentSha: head.commitSha, baseTreeSha: head.treeSha, message: `Professional site: project ${project.id}, revision ${workspace.revision}`,
          files: changes, deletions,
        })).commitSha : head.commitSha;
        break;
      } catch (failure) { if (!(failure instanceof GitHubRefMovedError) || attempt === 2) throw failure; }
    }
    const { data: recorded, error: recordError } = await admin.from("design_workspaces").update({ repository_revision: workspace.revision,
      repository_commit: commitSha, generated_files: generated, pending_files: {}, sync_error: null,
    }).eq("project_id", project.id).eq("sync_token", token).select("revision").single();
    if (recordError) throw recordError;
    if (recorded.revision !== workspace.revision) throw new ValidationError("The project changed during export. The exported revision is recorded; export the latest saved revision before preview.");
    return { commitSha, revision: workspace.revision, branch };
  } catch (failure) {
    const message = failure instanceof Error ? failure.message : String(failure);
    await admin.from("design_workspaces").update({ sync_error: message.slice(0,1000) }).eq("project_id", project.id).eq("sync_token", token);
    throw failure;
  } finally {
    const { error } = await admin.from("design_workspaces").update({ sync_token: null, sync_until: null }).eq("project_id", project.id).eq("sync_token", token);
    if (error) throw error;
  }
}
async function download(admin: DbClient, bucket: string, objectPath: string): Promise<Buffer> {
  const { data, error } = await admin.storage.from(bucket).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
