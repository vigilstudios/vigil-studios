export const SECURITY_CHECKS = [
  { key: "vulnerabilities", label: "Vulnerabilities" },
  { key: "exploits", label: "Exploits" },
  { key: "activity", label: "Suspicious activity" },
  { key: "firewall", label: "Firewall" },
] as const;
export type SecurityCheckKey = (typeof SECURITY_CHECKS)[number]["key"];
export type SecurityReport = {
  observedAt: string;
  expiresAt: string;
  checks: Record<SecurityCheckKey, "clear" | "alert" | "unknown">;
  /** Unresolved alerts only. Expired checks must never hide an active alert. */
  alerts: {
    id: string;
    title: string;
    category: SecurityCheckKey;
    severity: "warning" | "critical";
    detectedAt: string;
  }[];
};
export function securityChecksCurrent(report: SecurityReport, asOf: string) {
  const now = Date.parse(asOf),
    observed = Date.parse(report.observedAt),
    expires = Date.parse(report.expiresAt);
  return (
    Number.isFinite(now) &&
    Number.isFinite(observed) &&
    Number.isFinite(expires) &&
    observed <= now &&
    expires >= now &&
    expires > observed
  );
}
export function securityState(report: SecurityReport | null, asOf: string) {
  if (!report) return "unconnected";
  if (
    report.alerts.length ||
    SECURITY_CHECKS.some(({ key }) => report.checks[key] === "alert")
  )
    return "alert";
  if (
    securityChecksCurrent(report, asOf) &&
    SECURITY_CHECKS.every(({ key }) => report.checks[key] === "clear")
  )
    return "secured";
  return "pending";
}
export type SiteQualityReport = {
  measuredAt: string;
  device: "desktop" | "mobile";
  seo: number | null;
  performance: number | null;
  /** Largest Contentful Paint, in milliseconds; never presented as an invented score. */
  lcpMs: number | null;
};
export function auditScore(value: number | null | undefined): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
    ? value
    : null;
}
export function speedSeconds(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value / 1000
    : null;
}
