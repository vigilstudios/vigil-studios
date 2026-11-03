import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import type {
  SecurityReport,
  SiteQualityReport,
} from "@/lib/vigil/overview/monitoring";
import {
  measurementKinds,
  measurementPayloadSchema,
  payloadMatchesKind,
  rangesFromTraffic,
  type ConnectionState,
  type MeasurementConnectionView,
  type MeasurementKind,
  type WebsiteMeasurements,
} from "@/lib/vigil/measurements/contract";
import { publicOrigin } from "@/lib/vigil/measurements/http";

const columns =
  "id,organization_id,website_id,kind,enabled,revision,last_attempt_at,last_success_at,last_error_code,next_run_at,created_at,updated_at" as const;
function absentSchema(error: { code?: string } | null) {
  return error && ["42P01", "PGRST205"].includes(error.code ?? "");
}
/** Reads only stored evidence. Rendering a dashboard never calls a measurement provider. */
export async function getWebsiteMeasurements(
  client: DbClient,
  organizationId: string,
  websiteId: string,
  asOf = new Date().toISOString(),
): Promise<WebsiteMeasurements> {
  const { data: site, error: siteError } = await client
    .from("websites")
    .select("id,live_url,status")
    .eq("id", websiteId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) return { available: false, connections: [] };
  const { data: rows, error } = await client
    .from("website_measurement_connections")
    .select(columns)
    .eq("organization_id", organizationId)
    .eq("website_id", websiteId);
  if (absentSchema(error)) return { available: false, connections: [] };
  if (error) throw error;
  let origin: string | null = null;
  try {
    origin = publicOrigin(site.live_url ?? "");
  } catch {
    /* A prelaunch website has no measurement target. */
  }
  const connections = await Promise.all(
    (rows ?? []).map(async (row): Promise<MeasurementConnectionView | null> => {
      const kind = row.kind as MeasurementKind;
      if (!measurementKinds.includes(kind)) return null;
      let payload: MeasurementConnectionView["payload"] = null,
        observedAt: string | null = null,
        expiresAt: string | null = null;
      let state: ConnectionState = !row.enabled
        ? "not_connected"
        : row.last_error_code
          ? "attention"
          : "collecting";
      if (row.enabled && origin) {
        const { data: snapshot, error: snapshotError } = await client
          .from("website_measurement_snapshots")
          .select("id,payload,observed_at,expires_at,coverage")
          .eq("organization_id", organizationId)
          .eq("website_id", websiteId)
          .eq("connection_id", row.id)
          .eq("connection_revision", row.revision)
          .eq("target_origin", origin)
          .lte("observed_at", asOf)
          .order("observed_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (snapshotError) throw snapshotError;
        if (snapshot) {
          const parsed = measurementPayloadSchema.safeParse(snapshot.payload);
          if (parsed.success && payloadMatchesKind(kind, parsed.data)) {
            payload = parsed.data;
            observedAt = snapshot.observed_at;
            expiresAt = snapshot.expires_at;
            if (!row.last_error_code)
              state =
                Date.parse(expiresAt) < Date.parse(asOf)
                  ? "stale"
                  : snapshot.coverage === "insufficient"
                    ? "insufficient"
                    : "current";
          } else state = "attention";
        }
      }
      if (row.enabled && site.status !== "live") state = "paused";
      return {
        id: row.id,
        kind,
        enabled: row.enabled,
        revision: row.revision,
        lastAttemptAt: row.last_attempt_at,
        lastSuccessAt: row.last_success_at,
        nextRunAt: row.next_run_at,
        state,
        observedAt,
        expiresAt,
        payload,
      } satisfies MeasurementConnectionView;
    }),
  );
  return {
    available: true,
    connections: connections.filter(
      (row): row is MeasurementConnectionView => row !== null,
    ),
    updatesEnabled: process.env.VIGIL_MEASUREMENTS_ENABLED === "true",
  };
}

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
