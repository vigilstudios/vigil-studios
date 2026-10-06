/** Shared customer labels for database feature rows, including current rollout status. */
export const PLAN_FEATURE_LABELS: [string, string][] = [
  ["hosting.managed", "Managed hosting, SSL and security"],
  ["domain.managed", "Domain status and management"],
  ["requests.enabled", "Website updates and content changes"],
  ["leads.enabled", "Lead Hub · in development"],
  ["insights.enabled", "Vigil Insights · in development"],
  ["virtue.enabled", "Virtue automation · in development"],
];

export function planBullets(includes: { code: string; label: string; on: boolean }[]): string[] {
  return includes.filter((feature) => feature.on).map((feature) => feature.label);
}

export function planHasVirtue(includes: { code: string; on: boolean }[]): boolean {
  return includes.some((feature) => feature.code === "virtue.enabled" && feature.on);
}
