/**
 * Creative Workspace configuration. Everything a run depends on that is not
 * customer data lives here as environment, with a default that boots.
 * Versions are code constants: bumping one changes the idempotency key, so
 * a retry after a prompt or schema change regenerates on purpose.
 */

/** Bump when the generated layout or a file's meaning changes. */
export const CREATIVE_WORKFLOW_VERSION = 1;
/** Bump when the Terra prompt wording changes. */
export const CREATIVE_PROMPT_VERSION = 1;
/** Bump when the structured-output schema changes. */
export const CREATIVE_SCHEMA_VERSION = 1;
/** Bump when ASTRA_INSTRUCTIONS.md or README.md templates change. */
export const CREATIVE_TEMPLATE_VERSION = 1;

export const CREATIVE_WORKSPACE_ROOT = ".vigil/creative";

export type CreativeConfig = {
  /** `openai` calls the model; `null` writes the workspace without intelligence and warns. */
  provider: "openai" | "null";
  apiKey: string | null;
  baseUrl: string;
  modelId: string;
  reasoningEffort: "minimal" | "low" | "medium" | "high";
  maxOutputTokens: number;
  /** Characters of customer text sent to the model; the brief is truncated past this. */
  maxInputChars: number;
  requestTimeoutMs: number;
  /** Git inclusion policy: files at or under this size are copied into the repository. */
  inlineAssetMaxBytes: number;
  /** Ceiling on the bytes copied into one workspace; later files stay in storage once it is reached. */
  inlineAssetTotalMaxBytes: number;
  /** MIME prefixes that stay in object storage whatever their size. */
  externalOnlyTypes: string[];
  /** Read the text layer of customer PDFs for Terra and Astra. */
  documentText: boolean;
  /** PDFs above this size are not downloaded for text. */
  documentTextMaxBytes: number;
  /** Characters kept per document. */
  documentTextMaxChars: number;
  /** Project kinds that get a workspace automatically after Create Repo. */
  autoProjectKinds: Set<string> | "all";
};

const int = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export function readCreativeConfig(env: Record<string, string | undefined> = process.env): CreativeConfig {
  const provider = (env.CREATIVE_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai" && provider !== "null") {
    throw new Error(`Unknown CREATIVE_PROVIDER "${provider}" (expected null | openai).`);
  }
  const effort = (env.CREATIVE_REASONING_EFFORT ?? "medium").toLowerCase();
  const kinds = (env.CREATIVE_WORKSPACE_PROJECT_KINDS ?? "professional,custom").trim().toLowerCase();
  return {
    provider,
    apiKey: env.OPENAI_API_KEY?.trim() || null,
    baseUrl: (env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    modelId: env.CREATIVE_MODEL?.trim() || "gpt-5.6-terra",
    reasoningEffort: effort === "minimal" || effort === "low" || effort === "high" ? effort : "medium",
    maxOutputTokens: int(env.CREATIVE_MAX_OUTPUT_TOKENS, 16_000),
    maxInputChars: int(env.CREATIVE_MAX_INPUT_CHARS, 60_000),
    requestTimeoutMs: int(env.CREATIVE_REQUEST_TIMEOUT_MS, 180_000),
    inlineAssetMaxBytes: int(env.CREATIVE_ASSET_INLINE_MAX_BYTES, 25 * 1024 * 1024),
    inlineAssetTotalMaxBytes: int(env.CREATIVE_ASSET_INLINE_TOTAL_MAX_BYTES, 600 * 1024 * 1024),
    externalOnlyTypes: (env.CREATIVE_ASSET_EXTERNAL_TYPES ?? "video/").split(",").map((s) => s.trim()).filter(Boolean),
    documentText: (env.CREATIVE_DOCUMENT_TEXT ?? "true").toLowerCase() !== "false",
    documentTextMaxBytes: int(env.CREATIVE_DOCUMENT_TEXT_MAX_BYTES, 15 * 1024 * 1024),
    documentTextMaxChars: int(env.CREATIVE_DOCUMENT_TEXT_MAX_CHARS, 20_000),
    autoProjectKinds: kinds === "all" ? "all" : new Set(kinds.split(",").map((s) => s.trim()).filter(Boolean)),
  };
}

/** Whether Create Repo should queue a workspace for this project kind on its own. */
export function autoGeneratesFor(config: CreativeConfig, projectKind: string | null | undefined): boolean {
  if (config.autoProjectKinds === "all") return true;
  return Boolean(projectKind && config.autoProjectKinds.has(projectKind));
}
