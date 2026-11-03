import type {
  SecurityReport,
  SiteQualityReport,
} from "@/lib/vigil/overview/monitoring";
import {
  rangesFromTraffic,
  type WebsiteMeasurements,
  type MeasurementKind,
  type MeasurementConnectionView,
} from "./contract";

/** Shared projection for live Overview and the isolated design preview. */
export function overviewMeasurementData(measurements: WebsiteMeasurements) {
  const find = (kind: MeasurementKind) =>
    measurements.connections.find(
      (c) => c.kind === kind && c.enabled && c.payload,
    );
  const traffic = find("traffic"),
    quality = find("quality_mobile") ?? find("quality_desktop");
  const baseline = find("site_security"),
    repository = find("repository_security");
  let security: SecurityReport | null = null;
  if (baseline || repository) {
    const connected = [baseline, repository].filter(
      (row): row is MeasurementConnectionView => Boolean(row),
    );
    const findings =
      repository?.payload?.kind === "repository_security"
        ? repository.payload.findings
        : [];
    const dependencyComplete =
      repository?.payload?.kind === "repository_security" &&
      repository.payload.complete &&
      repository.state === "current";
    security = {
      observedAt: connected.map((c) => c.observedAt!).sort()[0],
      expiresAt: connected.map((c) => c.expiresAt!).sort()[0],
      checks: {
        vulnerabilities: findings.length
          ? "alert"
          : dependencyComplete
            ? "clear"
            : "unknown",
        exploits: "unknown",
        activity: "unknown",
        firewall: "unknown",
      },
      alerts: findings.map((f) => ({
        id: f.reference,
        title: f.title,
        category: "vulnerabilities",
        severity: f.severity === "critical" ? "critical" : "warning",
        detectedAt: f.detectedAt,
      })),
      coverage: "partial",
      dependencyOnly: Boolean(repository),
      baseline:
        baseline?.payload?.kind === "site_security"
          ? baseline.payload.checks
          : [],
    };
  }
  let qualityReport: SiteQualityReport | null = null;
  if (quality?.payload?.kind === "quality")
    qualityReport = {
      measuredAt: quality.payload.measuredAt,
      device: quality.payload.device,
      seo: quality.payload.seo,
      performance: quality.payload.performance,
      lcpMs: quality.payload.lcpMs,
      expiresAt: quality.expiresAt!,
      source: "lab",
    };
  return {
    traffic:
      traffic?.payload?.kind === "traffic"
        ? rangesFromTraffic(traffic.payload)
        : null,
    security,
    quality: qualityReport,
  };
}
