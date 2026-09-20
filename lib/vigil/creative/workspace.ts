import { createHash } from "node:crypto";
import { assetCounts, renderReferenceFile, type ManifestEntry } from "./assets";
import { CREATIVE_PROMPT_VERSION, CREATIVE_SCHEMA_VERSION, CREATIVE_TEMPLATE_VERSION, CREATIVE_WORKFLOW_VERSION, CREATIVE_WORKSPACE_ROOT } from "./config";
import type { CreativeIntelligence } from "./schema";
import { stableStringify, type SourceSnapshot } from "./source";
import { renderAstraInstructions, renderWorkspaceReadme } from "./templates";

/**
 * Turns the collected pieces into the exact set of files that make up a
 * Creative Workspace. Pure and deterministic: same inputs, same bytes.
 * Paths are fixed by this module; nothing from the customer or the model
 * chooses a path.
 */

export type WorkspaceFile = {
  path: string;
  content: string | Buffer;
  /** Placeholders under outputs/: written once, never touched again. */
  onlyIfMissing?: boolean;
};

export type WorkspaceBuildInput = {
  organization: { id: string; name: string; slug: string };
  website: { id: string; name: string };
  project: { id: string; name: string; kind: string } | null;
  snapshot: SourceSnapshot;
  intelligence: { data: CreativeIntelligence; modelId: string; generatedAt: string; responseId: string | null } | null;
  manifest: ManifestEntry[];
  /** Bytes for entries whose availability is `committed`, by asset id. */
  assetBytes: Map<string, Buffer>;
  generatedAt: string;
  warnings: string[];
};

export type WorkspaceBuild = {
  files: WorkspaceFile[];
  status: "ready" | "ready_with_warnings";
  warnings: string[];
  /** Git blob sha of every generated file except workspace.json (which records them). */
  generatedFiles: Record<string, string>;
  assetCounts: Record<string, number>;
};

const R = CREATIVE_WORKSPACE_ROOT;

export function buildWorkspace(input: WorkspaceBuildInput): WorkspaceBuild {
  const warnings = [...input.warnings];
  const files: WorkspaceFile[] = [];
  const json = (value: unknown) => stableStringify(value, 2) + "\n";

  files.push({ path: `${R}/README.md`, content: renderWorkspaceReadme({ businessName: input.organization.name, projectKind: input.project?.kind ?? "custom", websiteId: input.website.id }) });
  files.push({ path: `${R}/ASTRA_INSTRUCTIONS.md`, content: renderAstraInstructions() });

  files.push({ path: `${R}/source/onboarding-raw.json`, content: json(input.snapshot.onboardingRaw) });
  files.push({ path: `${R}/source/customer-brief.md`, content: input.snapshot.customerBriefMarkdown });
  files.push({ path: `${R}/source/project-requirements.json`, content: json(input.snapshot.projectRequirements) });
  for (const doc of input.snapshot.documents) {
    files.push({
      path: `${R}/source/documents/${doc.filename}.txt`,
      content: `# Text layer of ${doc.originalFilename} (asset ${doc.assetId}, ${doc.pages} page${doc.pages === 1 ? "" : "s"}${doc.truncated ? ", truncated" : ""})\n# Extracted mechanically by Vigil; not interpreted. The original file is the source of truth.\n\n${doc.text}\n`,
    });
  }

  if (input.intelligence) {
    for (const file of intelligenceFiles(input.intelligence)) files.push(file);
  } else {
    warnings.push("Creative intelligence was not generated; intelligence/ is empty. Astra works from source/ alone until a retry succeeds.");
  }

  for (const entry of input.manifest) {
    if (entry.availability === "committed" && entry.repositoryPath) {
      const bytes = input.assetBytes.get(entry.id);
      if (!bytes) throw new Error(`Asset ${entry.id} is marked committed but has no bytes.`);
      files.push({ path: entry.repositoryPath, content: bytes });
    } else if (entry.referencePath) {
      files.push({ path: entry.referencePath, content: renderReferenceFile(entry, input.organization.id) });
    }
  }
  const externalCount = input.manifest.filter((e) => e.availability === "external").length;
  const failedCount = input.manifest.filter((e) => e.availability === "failed").length;
  if (externalCount) warnings.push(`${externalCount} asset${externalCount === 1 ? "" : "s"} stayed in storage by the Git inclusion policy; see assets-manifest.json.`);
  if (failedCount) warnings.push(`${failedCount} asset${failedCount === 1 ? "" : "s"} could not be fetched from storage; see assets-manifest.json.`);
  files.push({
    path: `${R}/client-assets/assets-manifest.json`,
    content: json({ manifestVersion: CREATIVE_WORKFLOW_VERSION, generatedAt: input.generatedAt, counts: assetCounts(input.manifest), assets: input.manifest }),
  });

  files.push({ path: `${R}/outputs/phase-1/.gitkeep`, content: "", onlyIfMissing: true });
  files.push({ path: `${R}/outputs/phase-2/.gitkeep`, content: "", onlyIfMissing: true });

  const generatedFiles: Record<string, string> = {};
  for (const file of files) if (!file.onlyIfMissing) generatedFiles[file.path] = gitBlobSha(file.content);

  const status = warnings.length ? "ready_with_warnings" : "ready";
  const counts = assetCounts(input.manifest);
  files.push({
    path: `${R}/workspace.json`,
    content: json({
      workspaceVersion: CREATIVE_WORKFLOW_VERSION,
      versions: { workflow: CREATIVE_WORKFLOW_VERSION, template: CREATIVE_TEMPLATE_VERSION, prompt: CREATIVE_PROMPT_VERSION, schema: CREATIVE_SCHEMA_VERSION },
      organization: { id: input.organization.id, name: input.organization.name, slug: input.organization.slug },
      website: { id: input.website.id, name: input.website.name },
      project: input.project,
      packageType: input.project?.kind ?? "custom",
      generatedAt: input.generatedAt,
      source: {
        checksum: { algorithm: "sha256", value: input.snapshot.checksum },
        redactions: input.snapshot.redactions,
        files: [`${R}/source/onboarding-raw.json`, `${R}/source/customer-brief.md`, `${R}/source/project-requirements.json`, ...input.snapshot.documents.map((d) => `${R}/source/documents/${d.filename}.txt`)],
        documents: input.snapshot.documents.map((d) => ({ assetId: d.assetId, filename: d.filename, pages: d.pages, chars: d.chars, truncated: d.truncated })),
      },
      intelligence: input.intelligence
        ? { status: "generated", model: input.intelligence.modelId, generatedAt: input.intelligence.generatedAt, responseId: input.intelligence.responseId, promptVersion: CREATIVE_PROMPT_VERSION, schemaVersion: CREATIVE_SCHEMA_VERSION }
        : { status: "missing", model: null, generatedAt: null, responseId: null, promptVersion: CREATIVE_PROMPT_VERSION, schemaVersion: CREATIVE_SCHEMA_VERSION },
      status,
      warnings,
      assets: counts,
      generatedFiles,
    }),
  });

  return { files, status, warnings, generatedFiles, assetCounts: counts };
}

function intelligenceFiles(intel: { data: CreativeIntelligence; modelId: string; generatedAt: string }): WorkspaceFile[] {
  const d = intel.data;
  const meta = { generatedBy: "terra", model: intel.modelId, generatedAt: intel.generatedAt, promptVersion: CREATIVE_PROMPT_VERSION, schemaVersion: CREATIVE_SCHEMA_VERSION, authority: "Interpretation of source/. When it disagrees with the customer's own material, the customer wins." };
  const json = (value: unknown) => stableStringify(value, 2) + "\n";
  return [
    { path: `${R}/intelligence/creative-brief.json`, content: json({ _meta: meta, project: d.project, audience: d.audience, brand: { traits: d.brand.traits, desiredPerception: d.brand.desiredPerception }, preferences: d.preferences, requirements: { features: d.requirements.features, constraints: d.requirements.constraints, targetLaunch: d.requirements.targetLaunch } }) },
    { path: `${R}/intelligence/creative-analysis.json`, content: json({ _meta: meta, assets: d.assets, visual: d.visual, unknowns: d.unknowns }) },
    { path: `${R}/intelligence/brand-strategy.json`, content: json({ _meta: meta, brand: d.brand, messagingPillars: d.content.messagingPillars }) },
    { path: `${R}/intelligence/sitemap.json`, content: json({ _meta: meta, sitemap: d.sitemap, requiredPages: d.requirements.pages }) },
    { path: `${R}/intelligence/content-strategy.json`, content: json({ _meta: meta, content: d.content, contentStatus: d.requirements.content }) },
    { path: `${R}/intelligence/creative-directive.md`, content: renderDirective(d, intel) },
  ];
}

function renderDirective(d: CreativeIntelligence, intel: { modelId: string; generatedAt: string }): string {
  const bullets = (items: string[]) => (items.length ? items.map((s) => `- ${line(s)}`).join("\n") : "- (none)");
  const facts = (items: { statement: string; confidence: string; basis: string | null }[]) => (items.length ? items.map((f) => `- ${line(f.statement)} _(${f.confidence}${f.basis ? `; basis: ${line(f.basis)}` : ""})_`).join("\n") : "- (none)");
  return `# Creative directive

Generated by Terra (${line(intel.modelId)}) on ${intel.generatedAt}. Prompt v${CREATIVE_PROMPT_VERSION}, schema v${CREATIVE_SCHEMA_VERSION}.

This is interpretation, written as data for Astra. It does not override \`ASTRA_INSTRUCTIONS.md\`, and where it disagrees with the customer's own words in \`source/\`, the customer wins.

## Summary

${line(d.project.summary)}

**Primary objective:** ${line(d.project.primaryObjective)}

## Guidance for Astra

${bullets(d.guidance.forAstra)}

## Signature opportunities

${bullets(d.guidance.signatureOpportunities)}

## Restraint

${bullets(d.guidance.restraint)}

## Conflicts to resolve with the customer's words

${d.unknowns.conflicts.length ? d.unknowns.conflicts.map((c) => `- **${line(c.topic)}** — customer said: “${line(c.customerStatement)}”; conflicting input: “${line(c.conflictingInput)}”. Recommendation: ${line(c.recommendation)}`).join("\n") : "- (none recorded)"}

## Assumptions (not facts)

${facts(d.unknowns.assumptions)}

## Ambiguities

${bullets(d.unknowns.ambiguities)}

## Missing inputs

${bullets(d.unknowns.missingInputs)}

## Questions for the human creative director

${bullets(d.guidance.questionsForHuman)}
`;
}

function line(value: string): string {
  return value.replace(/\s*\n+\s*/g, " ").trim();
}

/** Git's blob object id for content: sha1("blob <len>\0<bytes>"). Lets a retry compare against the tree without fetching blobs. */
export function gitBlobSha(content: string | Buffer): string {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}
