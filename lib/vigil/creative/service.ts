import "server-only";

import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import { GitHubRepositoryProvider } from "@/lib/vigil/providers/github";
import { findProviderLink } from "@/lib/vigil/services/provider-links";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { planAssets, recordDownloaded, recordFailed, type AssetRow, type ManifestEntry } from "./assets";
import { CREATIVE_PROMPT_VERSION, CREATIVE_SCHEMA_VERSION, CREATIVE_TEMPLATE_VERSION, CREATIVE_WORKFLOW_VERSION, CREATIVE_WORKSPACE_ROOT, readCreativeConfig, type CreativeConfig } from "./config";
import { extractPdfDocument, type ExtractedDocument, type PdfTextReader } from "./documents";
import { publishWorkspace, type WorkspaceRepository } from "./publish";
import { validateCreativeIntelligence, type CreativeIntelligence } from "./schema";
import { buildSourceSnapshot, sha256, type SourceAssetSummary } from "./source";
import type { CreativeStatus } from "./status";
import { createCreativeModelProvider, type CreativeModelProvider } from "./terra";
import { buildWorkspace } from "./workspace";

/**
 * Creative Workspace generation: the operation Create Repo hands off to.
 *
 * Runs from the job runner with the service-role client. Each step writes
 * its status to creative_workspaces so staff can watch it, and the
 * validated model output is stored as soon as it exists so a retry after a
 * later failure (storage, GitHub) reuses it instead of paying for it again.
 * The repository write is one commit that never touches outputs/ and never
 * overwrites a file a person edited.
 */
export type GenerateDeps = {
  config?: CreativeConfig;
  model?: CreativeModelProvider;
  repository?: WorkspaceRepository;
  /** Fetch an asset's bytes from the private bucket; the default uses the service-role storage client. */
  downloadAsset?: (bucketId: string, objectPath: string) => Promise<Buffer>;
  /** Text-layer reader for PDFs; the default is pdf-parse. */
  readPdf?: PdfTextReader;
  now?: () => Date;
};

export type GenerateResult = {
  status: CreativeStatus;
  commitSha: string | null;
  written: number;
  preserved: number;
  warnings: string[];
  intelligence: "generated" | "reused" | "missing";
};

type WorkspaceRow = {
  id: string;
  idempotency_key: string | null;
  intelligence: Json | null;
  intelligence_at: string | null;
  intelligence_usage: Json | null;
  generated_files: Json;
  generated_at: string | null;
  commit_sha: string | null;
};

export async function generateCreativeWorkspace(admin: DbClient, websiteId: string, deps: GenerateDeps = {}): Promise<GenerateResult> {
  const config = deps.config ?? readCreativeConfig();
  const model = deps.model ?? createCreativeModelProvider(config);
  const repository = deps.repository ?? new GitHubRepositoryProvider();
  const downloadAsset = deps.downloadAsset ?? ((bucket, path) => downloadFromStorage(admin, bucket, path));
  const readPdf = deps.readPdf;
  const now = deps.now ?? (() => new Date());

  const { data: website, error } = await admin
    .from("websites")
    .select("id, name, organization_id, project_id, template_slug, organization:organizations!websites_organization_id_fkey(id, name, slug), project:projects!websites_project_id_fkey(id, name, kind, status, template_slug, launch_target, intake_completed_at, brief)")
    .eq("id", websiteId)
    .maybeSingle();
  if (error) throw error;
  if (!website) throw new NotFoundError(`Website ${websiteId} not found.`);
  const organization = one(website.organization);
  const project = one(website.project);
  if (!organization) throw new NotFoundError("The website organization was not found.");

  const row = await ensureRow(admin, { websiteId, organizationId: organization.id, projectId: project?.id ?? null });
  const startedAt = now().toISOString();
  await setStatus(admin, row.id, "collecting_source", { started_at: startedAt, finished_at: null, error: null });

  try {
    const link = await findProviderLink(admin, { provider: "other", resourceKind: "repository", entityType: "website", entityId: websiteId });
    const linkMetadata = (link?.metadata ?? {}) as { full_name?: string; default_branch?: string };
    if (!link || !linkMetadata.full_name) throw new ValidationError("Create the customer repository before generating the creative workspace.");
    const fullName = linkMetadata.full_name;
    const branch = linkMetadata.default_branch || "main";

    // 1. Source: the file list, the bytes the policy lets into Git (or that
    //    carry readable text), and the brief — all as they are.
    const assetRows = project ? await loadAssets(admin, project.id) : [];
    const plans = planAssets(assetRows, config);
    const manifest: ManifestEntry[] = [];
    const assetBytes = new Map<string, Buffer>();
    const documents: ExtractedDocument[] = [];
    const warnings: string[] = [];
    for (const plan of plans) {
      const source = assetRows.find((a) => a.id === plan.entry.id)!;
      const readable = config.documentText && source.content_type === "application/pdf" && source.size_bytes <= config.documentTextMaxBytes;
      if (!plan.inline && !readable) {
        manifest.push(plan.entry);
        continue;
      }
      let bytes: Buffer;
      try {
        bytes = await downloadAsset(source.bucket_id, source.object_path);
      } catch (downloadError) {
        const message = downloadError instanceof Error ? downloadError.message : String(downloadError);
        console.error(`[creative] asset ${plan.entry.id} download failed:`, message);
        manifest.push(plan.inline ? recordFailed(plan.entry, message) : plan.entry);
        if (!plan.inline) warnings.push(`${plan.entry.originalFilename}: could not be fetched for text extraction (${message.slice(0, 120)}).`);
        continue;
      }
      const recorded = recordDownloaded(plan.entry, bytes);
      if (recorded.warning) warnings.push(recorded.warning);
      if (plan.inline) {
        manifest.push(recorded.entry);
        assetBytes.set(plan.entry.id, bytes);
      } else {
        // Not committed, but its hash was checked while we had the bytes.
        manifest.push({ ...recorded.entry, availability: "external", repositoryPath: null, referencePath: plan.entry.referencePath, reason: plan.entry.reason });
      }
      if (readable) {
        const extracted = await extractPdfDocument({ assetId: source.id, filename: plan.entry.filename, originalFilename: plan.entry.originalFilename, bytes, maxChars: config.documentTextMaxChars }, readPdf);
        if (extracted.ok) documents.push(extracted.document);
        else warnings.push(`${plan.entry.originalFilename}: no text extracted (${extracted.reason}).`);
      }
    }
    const snapshot = buildSourceSnapshot({
      organization: { id: organization.id, name: organization.name, slug: organization.slug },
      website: { id: website.id, name: website.name, templateSlug: website.template_slug },
      project: project
        ? { id: project.id, name: project.name, kind: project.kind, status: project.status, templateSlug: project.template_slug, launchTarget: project.launch_target, intakeCompletedAt: project.intake_completed_at, brief: project.brief }
        : null,
      assets: assetRows.map(summarize),
      documents,
    });
    warnings.unshift(...snapshot.warnings);
    const idempotencyKey = sha256([websiteId, snapshot.checksum, CREATIVE_WORKFLOW_VERSION, CREATIVE_PROMPT_VERSION, CREATIVE_SCHEMA_VERSION, CREATIVE_TEMPLATE_VERSION, model.modelId].join(":"));
    const sameGeneration = row.idempotency_key === idempotencyKey;
    const generatedAt = sameGeneration && row.generated_at ? row.generated_at : startedAt;

    // 2. Intelligence: reuse what this exact source already produced, else ask Terra once.
    let intelligence: { data: CreativeIntelligence; modelId: string; generatedAt: string; responseId: string | null } | null = null;
    let intelligenceOutcome: GenerateResult["intelligence"] = "missing";
    const cached = sameGeneration && row.intelligence ? validateCreativeIntelligence(row.intelligence) : null;
    if (cached?.ok) {
      intelligence = { data: cached.data, modelId: model.modelId, generatedAt: row.intelligence_at ?? generatedAt, responseId: (row.intelligence_usage as { responseId?: string } | null)?.responseId ?? null };
      intelligenceOutcome = "reused";
    } else if (!project || isBlankBrief(project.brief)) {
      warnings.push("Terra was not called: there is no onboarding brief to normalise yet.");
    } else {
      await setStatus(admin, row.id, "generating_intelligence");
      const result = await model.normalize({
        organizationName: organization.name,
        projectKind: project.kind,
        customerBriefMarkdown: snapshot.customerBriefMarkdown,
        projectRequirements: snapshot.projectRequirements,
        assetSummary: assetRows.map((a) => `${a.file_name} — ${a.kind}, ${a.content_type}, ${a.size_bytes} bytes${a.caption ? `, "${a.caption.replace(/[\r\n]+/g, " ").slice(0, 200)}"` : ""}`),
        documentTexts: documents.map((d) => ({ filename: d.filename, pages: d.pages, text: d.text })),
      });
      if (result.ok) {
        const at = now().toISOString();
        intelligence = { data: result.intelligence, modelId: model.modelId, generatedAt: at, responseId: result.usage.responseId };
        intelligenceOutcome = "generated";
        // Persist before anything else can fail: this is the expensive, non-deterministic step.
        await update(admin, row.id, {
          intelligence: result.intelligence as unknown as Json,
          intelligence_at: at,
          intelligence_usage: { ...result.usage } as Json,
          idempotency_key: idempotencyKey,
          generated_at: generatedAt,
          model_id: model.modelId,
        });
      } else {
        warnings.push("Creative intelligence was not generated: the model provider is not configured (set OPENAI_API_KEY, or CREATIVE_PROVIDER=null to silence this). Retry after configuring.");
      }
    }

    // 3. Manifest is complete; record what the run will publish.
    await setStatus(admin, row.id, "packaging_assets", { idempotency_key: idempotencyKey, generated_at: generatedAt, source_checksum: snapshot.checksum });

    // 4. Files, then one commit.
    const build = buildWorkspace({
      organization: { id: organization.id, name: organization.name, slug: organization.slug },
      website: { id: website.id, name: website.name },
      project: project ? { id: project.id, name: project.name, kind: project.kind } : null,
      snapshot,
      intelligence,
      manifest,
      assetBytes,
      generatedAt,
      warnings,
    });
    await setStatus(admin, row.id, "writing_repository", { asset_counts: build.assetCounts as Json });
    const previouslyGenerated = (row.generated_files && typeof row.generated_files === "object" && !Array.isArray(row.generated_files) ? row.generated_files : {}) as Record<string, string>;
    const published = await publishWorkspace(repository, {
      fullName,
      branch,
      message: `Creative workspace: ${published_message(intelligenceOutcome, sameGeneration)}\n\nGenerated by Vigil Studios (workflow v${CREATIVE_WORKFLOW_VERSION}, source ${snapshot.checksum.slice(0, 12)}).`,
      files: build.files,
      previouslyGenerated,
    });
    const finalWarnings = [...build.warnings, ...published.preserved.map((p) => `${relative(p.path)} was edited by hand and was kept; the regenerated version is ${relative(p.writtenAs)}.`)];
    const status: CreativeStatus = finalWarnings.length ? "ready_with_warnings" : "ready";
    await update(admin, row.id, {
      status,
      warnings: finalWarnings as Json,
      error: null,
      generated_files: published.generated as Json,
      commit_sha: published.commitSha ?? row.commit_sha,
      finished_at: now().toISOString(),
      workflow_version: CREATIVE_WORKFLOW_VERSION,
      template_version: CREATIVE_TEMPLATE_VERSION,
      prompt_version: CREATIVE_PROMPT_VERSION,
      schema_version: CREATIVE_SCHEMA_VERSION,
      model_id: model.modelId,
      project_id: project?.id ?? null,
    });
    await admin.rpc("log_audit_event", {
      p_action: "website.creative_workspace_generated",
      p_entity_type: "website",
      p_entity_id: websiteId,
      p_org: organization.id,
      p_after: { status, commit_sha: published.commitSha, written: published.written.length, preserved: published.preserved.length, warnings: finalWarnings.length, intelligence: intelligenceOutcome },
    });
    console.info(`[creative] website ${websiteId} ${status}: wrote ${published.written.length}, preserved ${published.preserved.length}, intelligence ${intelligenceOutcome}${published.commitSha ? `, commit ${published.commitSha.slice(0, 8)}` : ", no commit needed"}`);
    return { status, commitSha: published.commitSha, written: published.written.length, preserved: published.preserved.length, warnings: finalWarnings, intelligence: intelligenceOutcome };
  } catch (failure) {
    const message = failure instanceof Error ? failure.message : String(failure);
    const code = failure && typeof failure === "object" && "code" in failure ? String((failure as { code: unknown }).code) : "unknown";
    await update(admin, row.id, { status: "failed", error: { code, message: message.slice(0, 1000) }, finished_at: now().toISOString() }).catch((updateError) => {
      console.error("[creative] could not record the failure:", updateError);
    });
    throw failure;
  }
}

function published_message(outcome: GenerateResult["intelligence"], regeneration: boolean): string {
  if (outcome === "generated") return regeneration ? "regenerate with fresh intelligence" : "initial generation";
  if (outcome === "reused") return "regenerate (intelligence reused)";
  return regeneration ? "regenerate (no intelligence)" : "initial generation (no intelligence)";
}

function relative(path: string): string {
  return path.startsWith(`${CREATIVE_WORKSPACE_ROOT}/`) ? path.slice(CREATIVE_WORKSPACE_ROOT.length + 1) : path;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function isBlankBrief(brief: unknown): boolean {
  if (!brief || typeof brief !== "object") return true;
  const keys = Object.keys(brief as Record<string, unknown>).filter((k) => k !== "version" && k !== "progress" && k !== "kickoff");
  return keys.length === 0;
}

type StoredAsset = AssetRow & { bucket_id: string; object_path: string };

async function loadAssets(admin: DbClient, projectId: string): Promise<StoredAsset[]> {
  const { data, error } = await admin
    .from("project_assets")
    .select("id, kind, file_name, content_type, size_bytes, caption, created_at, checksum, bucket_id, object_path")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []) as StoredAsset[];
}

function summarize(asset: StoredAsset): SourceAssetSummary {
  return { id: asset.id, kind: asset.kind, fileName: asset.file_name, contentType: asset.content_type, sizeBytes: asset.size_bytes, caption: asset.caption };
}

async function downloadFromStorage(admin: DbClient, bucketId: string, objectPath: string): Promise<Buffer> {
  const { data, error } = await admin.storage.from(bucketId).download(objectPath);
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Storage returned no data.");
  return Buffer.from(await data.arrayBuffer());
}

async function ensureRow(admin: DbClient, input: { websiteId: string; organizationId: string; projectId: string | null }): Promise<WorkspaceRow> {
  const columns = "id, idempotency_key, intelligence, intelligence_at, intelligence_usage, generated_files, generated_at, commit_sha";
  const { data: existing, error } = await admin.from("creative_workspaces").select(columns).eq("website_id", input.websiteId).maybeSingle();
  if (error) throw error;
  if (existing) return existing as WorkspaceRow;
  const { data, error: insertError } = await admin
    .from("creative_workspaces")
    .insert({ website_id: input.websiteId, organization_id: input.organizationId, project_id: input.projectId, status: "queued" })
    .select(columns)
    .single();
  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced, error: racedError } = await admin.from("creative_workspaces").select(columns).eq("website_id", input.websiteId).single();
      if (racedError) throw racedError;
      return raced as WorkspaceRow;
    }
    throw insertError;
  }
  return data as WorkspaceRow;
}

type RowUpdate = Partial<{
  status: CreativeStatus;
  started_at: string | null;
  finished_at: string | null;
  error: Json | null;
  intelligence: Json | null;
  intelligence_at: string | null;
  intelligence_usage: Json | null;
  idempotency_key: string | null;
  generated_at: string | null;
  generated_files: Json;
  warnings: Json;
  asset_counts: Json;
  commit_sha: string | null;
  source_checksum: string | null;
  workflow_version: number;
  template_version: number | null;
  prompt_version: number | null;
  schema_version: number | null;
  model_id: string | null;
  project_id: string | null;
}>;

async function update(admin: DbClient, id: string, values: RowUpdate): Promise<void> {
  const { error } = await admin.from("creative_workspaces").update(values).eq("id", id);
  if (error) throw error;
}

async function setStatus(admin: DbClient, id: string, status: CreativeStatus, extra: RowUpdate = {}): Promise<void> {
  await update(admin, id, { status, ...extra });
}

/** Mark the row queued when the job is enqueued, so the admin sees it move before the runner picks it up. */
export async function markCreativeWorkspaceQueued(client: DbClient, input: { websiteId: string; organizationId: string; projectId: string | null }): Promise<void> {
  const { error } = await client
    .from("creative_workspaces")
    .upsert({ website_id: input.websiteId, organization_id: input.organizationId, project_id: input.projectId, status: "queued", error: null, finished_at: null }, { onConflict: "website_id" });
  if (error) throw error;
}
