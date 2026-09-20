import { FILE_TYPES } from "@/lib/vigil/files";
import type { CreativeConfig } from "./config";
import { CREATIVE_WORKSPACE_ROOT } from "./config";
import { sha256 } from "./source";

/**
 * Client assets in the workspace. Every project file gets a manifest entry;
 * the Git inclusion policy decides which are copied into the repository and
 * which stay in Vigil's object storage and appear only as a manifest entry
 * plus a small reference file. Nothing here reads file contents — the
 * service downloads what the plan says to inline and hands the bytes back.
 */

export const ASSET_CATEGORIES = ["logos", "images", "videos", "documents", "references"] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

const CATEGORY_FOR_KIND: Record<string, AssetCategory> = { logo: "logos", photo: "images", video: "videos", document: "documents", other: "references" };

export type AssetRow = {
  id: string;
  kind: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  caption: string | null;
  created_at: string;
  /** SHA-256 the browser computed at upload (migration 0026); null for older rows. */
  checksum?: string | null;
};

export type AssetAvailability = "committed" | "external" | "failed";

export type ManifestEntry = {
  id: string;
  originalFilename: string;
  filename: string;
  category: AssetCategory;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  checksum: { algorithm: "sha256"; value: string } | null;
  /** `upload`: the browser's hash at upload; `verified`: confirmed against the stored bytes; `download`: computed now from the stored bytes (no upload hash). */
  checksumSource: "upload" | "verified" | "download" | null;
  /** Provider-neutral pointer; the Vigil backend resolves it to a signed download for an authorised person. */
  storage: { provider: "vigil"; reference: string };
  repositoryPath: string | null;
  referencePath: string | null;
  availability: AssetAvailability;
  reason: string | null;
  description: string | null;
  uploadedAt: string;
};

export type AssetPlan = { entry: ManifestEntry; inline: boolean };

/** Decide, deterministically, where each asset goes. Order is by upload time then id so names never shuffle between runs. */
export function planAssets(rows: AssetRow[], config: Pick<CreativeConfig, "inlineAssetMaxBytes" | "inlineAssetTotalMaxBytes" | "externalOnlyTypes">): AssetPlan[] {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const taken = new Set<string>();
  let budget = config.inlineAssetTotalMaxBytes;
  return sorted.map((row) => {
    const category = CATEGORY_FOR_KIND[row.kind] ?? "references";
    const filename = uniqueName(safeFilename(row.file_name, row.content_type), category, taken);
    let externalReason = externalOnlyReason(row, config);
    if (externalReason === null && row.size_bytes > budget) externalReason = `The ${Math.round(config.inlineAssetTotalMaxBytes / (1024 * 1024))} MB Git inclusion budget for this workspace was reached.`;
    const inline = externalReason === null;
    if (inline) budget -= row.size_bytes;
    const dir = `${CREATIVE_WORKSPACE_ROOT}/client-assets/${category}`;
    return {
      inline,
      entry: {
        id: row.id,
        originalFilename: row.file_name.slice(0, 200),
        filename,
        category,
        kind: row.kind,
        mimeType: row.content_type,
        sizeBytes: row.size_bytes,
        checksum: row.checksum ? { algorithm: "sha256", value: row.checksum } : null,
        checksumSource: row.checksum ? "upload" : null,
        storage: { provider: "vigil", reference: `project_asset:${row.id}` },
        repositoryPath: inline ? `${dir}/${filename}` : null,
        referencePath: inline ? null : `${dir}/${filename}.reference.json`,
        availability: inline ? "committed" : "external",
        reason: externalReason,
        description: row.caption?.trim() ? row.caption.trim().slice(0, 400) : null,
        uploadedAt: row.created_at,
      },
    };
  });
}

function externalOnlyReason(row: AssetRow, config: Pick<CreativeConfig, "inlineAssetMaxBytes" | "externalOnlyTypes">): string | null {
  if (config.externalOnlyTypes.some((prefix) => row.content_type.startsWith(prefix))) return `${row.content_type} files stay in storage by policy.`;
  if (row.size_bytes > config.inlineAssetMaxBytes) return `Larger than the ${Math.round(config.inlineAssetMaxBytes / (1024 * 1024))} MB Git inclusion limit.`;
  return null;
}

/**
 * A repository-safe name: ASCII letters, digits, dot, dash and underscore
 * only, no leading dot, extension taken from the MIME type rather than the
 * upload name so a mislabeled file cannot land as .html or .js.
 */
export function safeFilename(original: string, contentType: string): string {
  const base = original.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const rawStem = dot > 0 ? base.slice(0, dot) : base;
  const stem = rawStem.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.\-_]+|[.\-_]+$/g, "").replace(/-{2,}/g, "-").slice(0, 80) || "asset";
  const ext = FILE_TYPES[contentType]?.ext ?? "bin";
  return `${stem}.${ext}`;
}

function uniqueName(name: string, category: string, taken: Set<string>): string {
  const key = (n: string) => `${category}/${n}`.toLowerCase();
  if (!taken.has(key(name))) {
    taken.add(key(name));
    return name;
  }
  const dot = name.lastIndexOf(".");
  const stem = name.slice(0, dot), ext = name.slice(dot);
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`;
    if (!taken.has(key(candidate))) {
      taken.add(key(candidate));
      return candidate;
    }
  }
}

/**
 * Stamp a downloaded file with the hash of its stored bytes, confirm the
 * byte count the row claimed, and — when the upload recorded a hash —
 * confirm the bytes are the ones the customer sent.
 */
export function recordDownloaded(entry: ManifestEntry, bytes: Buffer): { entry: ManifestEntry; warning: string | null } {
  const checksum = { algorithm: "sha256" as const, value: sha256(bytes) };
  const uploadHash = entry.checksumSource === "upload" ? entry.checksum?.value : undefined;
  if (uploadHash && uploadHash !== checksum.value) {
    return {
      entry: { ...entry, checksum, checksumSource: "download", sizeBytes: bytes.length, reason: "Stored bytes do not match the checksum recorded at upload." },
      warning: `${entry.originalFilename}: the stored bytes do not match the checksum recorded at upload; the stored bytes were used.`,
    };
  }
  const checksumSource = uploadHash ? "verified" : "download";
  if (bytes.length !== entry.sizeBytes) {
    return {
      entry: { ...entry, checksum, checksumSource, sizeBytes: bytes.length, reason: `Stored size ${bytes.length} bytes differs from the recorded ${entry.sizeBytes}.` },
      warning: `${entry.originalFilename}: stored size ${bytes.length} bytes differs from the recorded ${entry.sizeBytes}; the stored bytes were used.`,
    };
  }
  return { entry: { ...entry, checksum, checksumSource }, warning: null };
}

/** The asset could not be fetched: keep the entry, mark it, and leave the reference so it is not silently lost. */
export function recordFailed(entry: ManifestEntry, message: string): ManifestEntry {
  const dir = `${CREATIVE_WORKSPACE_ROOT}/client-assets/${entry.category}`;
  return { ...entry, availability: "failed", repositoryPath: null, referencePath: `${dir}/${entry.filename}.reference.json`, reason: message.slice(0, 300) };
}

/** The small file that stands in for an asset kept out of Git. */
export function renderReferenceFile(entry: ManifestEntry, organizationId: string): string {
  return JSON.stringify(
    {
      note: "This file stands in for a customer asset that is not committed to Git. Download the original from the Vigil admin (Customer files) when you need it.",
      assetId: entry.id,
      originalFilename: entry.originalFilename,
      mimeType: entry.mimeType,
      sizeBytes: entry.sizeBytes,
      checksum: entry.checksum,
      availability: entry.availability,
      reason: entry.reason,
      description: entry.description,
      retrieval: { kind: "vigil_admin_files", organizationId, reference: entry.storage.reference },
    },
    null,
    2
  ) + "\n";
}

export function assetCounts(entries: ManifestEntry[]): Record<string, number> {
  const counts: Record<string, number> = { total: entries.length, committed: 0, external: 0, failed: 0 };
  for (const category of ASSET_CATEGORIES) counts[category] = 0;
  for (const entry of entries) {
    counts[entry.availability] += 1;
    counts[entry.category] += 1;
  }
  return counts;
}
