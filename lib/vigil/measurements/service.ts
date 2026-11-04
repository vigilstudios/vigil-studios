import "server-only";
import type { DbClient, Tables } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import {
  collectMeasurement,
  measurementConfig,
  type MeasurementConfig,
  type MeasurementTarget,
} from "./providers";
import { MeasurementError, publicOrigin } from "./http";
import {
  measurementKinds,
  measurementPayloadSchema,
  payloadMatchesKind,
  type MeasurementKind,
} from "./contract";

type Connection = Tables<"website_measurement_connections">;
export async function measurementTarget(
  admin: DbClient,
  connection: Pick<Connection, "organization_id" | "website_id" | "kind">,
): Promise<MeasurementTarget> {
  const { data: site, error } = await admin
    .from("websites")
    .select("id,organization_id,live_url,status")
    .eq("id", connection.website_id)
    .eq("organization_id", connection.organization_id)
    .maybeSingle();
  if (error) throw error;
  if (!site || site.status !== "live" || !site.live_url)
    throw new MeasurementError("website_unavailable");
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id,archived_at")
    .eq("id", connection.organization_id)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!org || org.archived_at)
    throw new MeasurementError("website_unavailable");
  const target: MeasurementTarget = { origin: publicOrigin(site.live_url) };
  if (!["traffic", "repository_security", "search"].includes(connection.kind))
    return target;
  let query = admin
    .from("provider_links")
    .select("external_id,metadata,provider")
    .eq("entity_type", "website")
    .eq("entity_id", site.id)
    .eq(
      "resource_kind",
      connection.kind === "traffic"
        ? "site"
        : connection.kind === "search"
          ? "search_console_property"
          : "repository",
    );
  if (connection.kind === "traffic") query = query.eq("provider", "vercel");
  if (connection.kind === "search") query = query.eq("provider", "other");
  const { data: links, error: linkError } = await query;
  if (linkError) throw linkError;
  if (links?.length !== 1) throw new MeasurementError("invalid_mapping");
  const link = links[0];
  if (connection.kind === "traffic") {
    target.projectId = link.external_id;
    const start = (
      link.metadata as { analytics_collection_started_at?: unknown } | null
    )?.analytics_collection_started_at;
    if (typeof start === "string") target.trafficCollectionStartedAt = start;
  } else if (connection.kind === "search")
    target.searchProperty = link.external_id;
  else {
    const meta = link.metadata as { full_name?: unknown } | null;
    if (typeof meta?.full_name !== "string")
      throw new MeasurementError("invalid_mapping");
    target.repository = meta.full_name;
    if (/^\d{1,20}$/.test(link.external_id))
      target.repositoryId = link.external_id;
  }
  return target;
}

export type MeasurementRunResult = {
  id: string;
  kind: string;
  status: "saved" | "discarded" | "failed";
  errorCode?: string;
};
export async function runMeasurementBatch(
  admin: DbClient,
  options: {
    limit?: number;
    config?: MeasurementConfig;
    now?: Date;
    collect?: typeof collectMeasurement;
    enabled?: boolean;
  } = {},
) {
  if (!(options.enabled ?? process.env.VIGIL_MEASUREMENTS_ENABLED === "true"))
    return { enabled: false, results: [] as MeasurementRunResult[] };
  const now = options.now ?? new Date(),
    results: MeasurementRunResult[] = [];
  const config = options.config ?? measurementConfig(),
    collect = options.collect ?? collectMeasurement;
  // One deadline covers all provider calls in this invocation, below the route limit.
  const deadline = AbortSignal.timeout(150_000);
  const request: typeof fetch = (input, init) =>
    fetch(input, {
      ...init,
      signal: init?.signal
        ? AbortSignal.any([deadline, init.signal])
        : deadline,
    });
  const { error: healthError } = await admin
    .from("measurement_runner_health")
    .upsert({
      runner: "analytics",
      started_at: now.toISOString(),
      finished_at: null,
      status: "running",
    });
  if (healthError) throw healthError;
  try {
    for (let i = 0; i < Math.max(1, Math.min(options.limit ?? 1, 2)); i++) {
      if (deadline.aborted) break;
      const { data: claimed, error } = await admin.rpc(
        "claim_website_measurement",
        {},
      );
      if (error) throw error;
      const connection = claimed?.[0];
      if (!connection) break;
      let target: MeasurementTarget | null = null;
      try {
        if (!measurementKinds.includes(connection.kind as MeasurementKind))
          throw new MeasurementError("invalid_mapping");
        target = await measurementTarget(admin, connection);
        const payload = measurementPayloadSchema.parse(
          await collect(
            connection.kind as MeasurementKind,
            target,
            config,
            now,
            request,
          ),
        );
        if (!payloadMatchesKind(connection.kind as MeasurementKind, payload))
          throw new MeasurementError("invalid_response");
        const coverage =
          (payload.kind === "field" && !payload.sufficient) ||
          (payload.kind === "search" && payload.clicks === null)
            ? "insufficient"
            : payload.kind === "repository_security" && !payload.complete
              ? "partial"
              : payload.kind === "site_security"
                ? "partial"
                : "complete";
        const { data: saved, error: saveError } = await admin.rpc(
          "finish_website_measurement",
          {
            p_connection: connection.id,
            p_revision: connection.revision,
            p_lease: connection.lease_token!,
            p_origin: target.origin,
            p_payload: payload as unknown as Json,
            p_coverage: coverage,
            p_observed:
              payload.kind === "quality"
                ? payload.measuredAt
                : now.toISOString(),
          },
        );
        if (saveError) throw saveError;
        results.push({
          id: connection.id,
          kind: connection.kind,
          status: saved ? "saved" : "discarded",
        });
      } catch (error) {
        const errorCode =
          error instanceof MeasurementError ? error.code : "invalid_response";
        // Re-derive the origin if the website has moved; the SQL commit still rejects stale runs.
        if (!target) {
          try {
            target = await measurementTarget(admin, {
              ...connection,
              kind: "site_security",
            });
          } catch {
            /* Lease expires safely; no evidence is published. */
          }
        }
        if (target) {
          const { error: saveError } = await admin.rpc(
            "finish_website_measurement",
            {
              p_connection: connection.id,
              p_revision: connection.revision,
              p_lease: connection.lease_token!,
              p_origin: target.origin,
              p_error: errorCode,
            },
          );
          if (saveError) throw saveError;
        }
        results.push({
          id: connection.id,
          kind: connection.kind,
          status: "failed",
          errorCode,
        });
      }
    }
    const { error: cleanupError } = await admin.rpc(
      "prune_website_measurements",
    );
    if (cleanupError) throw cleanupError;
    const { error: finishError } = await admin
      .from("measurement_runner_health")
      .update({
        status: results.some((r) => r.status === "failed") ? "error" : "ok",
        finished_at: new Date().toISOString(),
      })
      .eq("runner", "analytics")
      .eq("started_at", now.toISOString());
    if (finishError) throw finishError;
    return { enabled: true, results };
  } catch (error) {
    await admin
      .from("measurement_runner_health")
      .update({ status: "error", finished_at: new Date().toISOString() })
      .eq("runner", "analytics")
      .eq("started_at", now.toISOString());
    throw error;
  }
}
