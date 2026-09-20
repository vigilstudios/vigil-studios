/**
 * Creative Workspace generation is its own operation with its own status,
 * separate from the repository job that triggers it and from deployments.
 * Stored on creative_workspaces.status (a check constraint mirrors this
 * list); shown to staff on the website page.
 */
export const CREATIVE_STATUSES = [
  "not_started",
  "queued",
  "collecting_source",
  "generating_intelligence",
  "packaging_assets",
  "writing_repository",
  "ready",
  "ready_with_warnings",
  "failed",
] as const;

export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];

export const CREATIVE_STATUS_LABELS: Record<CreativeStatus, string> = {
  not_started: "Not started",
  queued: "Queued",
  collecting_source: "Collecting source",
  generating_intelligence: "Generating intelligence",
  packaging_assets: "Packaging assets",
  writing_repository: "Writing repository",
  ready: "Ready",
  ready_with_warnings: "Ready with warnings",
  failed: "Failed",
};

export function isTerminalCreativeStatus(status: CreativeStatus): boolean {
  return status === "ready" || status === "ready_with_warnings" || status === "failed";
}

export function creativeStatusTone(status: CreativeStatus): "good" | "bad" | "info" | "warn" {
  if (status === "ready") return "good";
  if (status === "failed") return "bad";
  if (status === "ready_with_warnings") return "warn";
  return "info";
}
