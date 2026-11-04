import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWebsiteMeasurements } from "@/lib/vigil/queries/measurements";
import { measurementConfig } from "@/lib/vigil/measurements/providers";
import {
  measurementKinds,
  measurementLabels,
  measurementSources,
  measurementStateLabels,
  runnerState,
} from "@/lib/vigil/measurements/contract";
import {
  saveWebsiteMeasurement,
  refreshWebsiteMeasurement,
} from "@/lib/vigil/actions/measurements";
import { ActionButton, ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader } from "@/components/vigil/ui";
import { WebsiteMeasurementsView } from "@/components/vigil/WebsiteMeasurements";
import { formatDateTime } from "@/lib/vigil/format";

export const metadata: Metadata = { title: "Website reporting connections" };
const errors: Record<string, string> = {
  collection_not_enabled:
    "Enable Web Analytics in the mapped Vercel project and deploy its tracking script. This connection does not enroll or upgrade the project.",
  configuration_required:
    "The server credential or source mapping needs configuration.",
  permission_required: "The provider account needs read access to this source.",
  plan_required:
    "The provider requires a different plan. Do not upgrade without spending approval.",
  invalid_mapping: "Review the website's provider mapping.",
  invalid_target: "Use a live public HTTPS website URL.",
  target_redirected:
    "The audit reached a different origin. Review the canonical website URL.",
  rate_limited:
    "Provider quota reached. The runner will retry within its bounded schedule.",
  provider_unavailable: "The provider did not return an available report.",
  invalid_response:
    "The source returned an incomplete or unrecognized report; no values were fabricated.",
  audit_failed: "The audit did not complete successfully.",
  https_unavailable: "A valid public HTTPS response could not be verified.",
  private_target:
    "The hostname resolved to a non-public address; no request was sent.",
  dns_unavailable: "Public DNS lookup did not complete.",
};
export default async function ReportingConnectionsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  await requireStaff();
  const { websiteId } = await params,
    client = await createClient();
  const { data: site, error } = await client
    .from("websites")
    .select("id,name,organization_id,status,live_url")
    .eq("id", websiteId)
    .maybeSingle();
  if (error) throw error;
  if (!site) notFound();
  const data = await getWebsiteMeasurements(
      client,
      site.organization_id,
      site.id,
    ),
    config = measurementConfig();
  const { data: health } = data.available
    ? await client
        .from("measurement_runner_health")
        .select("runner,started_at,finished_at,status")
    : { data: null };
  const { data: connections } = data.available
    ? await client
        .from("website_measurement_connections")
        .select("id,last_error_code")
        .eq("website_id", site.id)
        .eq("organization_id", site.organization_id)
    : { data: null };
  const ready = {
    traffic: Boolean(config.vercelToken),
    quality_mobile: true,
    quality_desktop: true,
    field_performance: Boolean(config.cruxKey),
    site_security: true,
    repository_security: Boolean(config.githubToken),
    search: Boolean(
      (config.googleWifAudience && config.googleServiceAccountEmail) ||
        config.googleServiceAccount,
    ),
  };
  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Reporting connections"
        description="Enable only the evidence sources this website needs. Credentials remain server-side; provider upgrades and tracking enrollment are separate actions."
        actions={
          <Link
            className="btn-secondary text-sm"
            href={`/admin/websites/${site.id}`}
          >
            Back to website
          </Link>
        }
      />
      <Card className="mb-4">
        <p className="text-sm">
          Scheduled measurements:{" "}
          <strong>
            {process.env.VIGIL_MEASUREMENTS_ENABLED === "true"
              ? "Enabled"
              : "Paused"}
          </strong>
        </p>
        <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
          The runner processes at most two due sources per invocation. Traffic
          refreshes every six hours; lab audits weekly; other checks daily. No
          connection is enabled by default.
        </p>
        {health?.map((row) => (
          <p className="mt-2 text-xs" key={row.runner}>
            {row.runner} runner · {runnerState(row)} ({row.status}) · last
            started {formatDateTime(row.started_at)} · last completed{" "}
            {formatDateTime(row.finished_at)}
          </p>
        ))}
      </Card>
      {!data.available ? (
        <Card>
          <p>
            Apply the reviewed website measurements migration before configuring
            sources. No provider was contacted.
          </p>
        </Card>
      ) : (
        <div className="vm-admin-grid">
          {measurementKinds.map((kind) => {
            const connection = data.connections.find((c) => c.kind === kind),
              errorCode = connections?.find(
                (c) => c.id === connection?.id,
              )?.last_error_code;
            return (
              <section className="vm-admin-item" key={kind}>
                <h3>{measurementLabels[kind]}</h3>
                <p>
                  {measurementSources[kind]} ·{" "}
                  {measurementStateLabels[connection?.state ?? "not_connected"]}
                </p>
                {!ready[kind] ? (
                  <p>
                    Server credential setup required before collecting this
                    source.
                  </p>
                ) : null}
                {errorCode ? (
                  <p>
                    {errors[errorCode] ??
                      "Review the source connection before retrying."}
                  </p>
                ) : null}
                <ActionForm
                  action={saveWebsiteMeasurement.bind(null, site.id, kind)}
                  submitLabel="Save connection"
                  resetOnSuccess={false}
                >
                  <label>
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={connection?.enabled ?? false}
                      disabled={site.status !== "live"}
                    />
                    Enable scheduled measurements
                  </label>
                  {kind === "search" ? (
                    <>
                      <label htmlFor="search-property">
                        Exact Search Console property
                      </label>
                      <input
                        id="search-property"
                        type="text"
                        name="search_property"
                        placeholder="https://www.example.com/ or sc-domain:www.example.com"
                        maxLength={2048}
                      />
                      <p>
                        Grant the configured Google service account read access
                        to this exact website property. Leave blank to keep an
                        existing matching mapping.
                      </p>
                    </>
                  ) : null}
                  {kind === "traffic" ? (
                    <p>
                      Verify the mapped project, Web Analytics collection and
                      the deployed website script first. Never point a client at
                      Vigil&apos;s own analytics project.
                    </p>
                  ) : null}
                </ActionForm>
                {connection?.enabled ? (
                  <div className="vm-admin-controls">
                    <ActionButton
                      action={refreshWebsiteMeasurement.bind(
                        null,
                        connection.id,
                      )}
                    >
                      Schedule a refresh
                    </ActionButton>
                    <small className="text-[color:var(--text-secondary)]">
                      At most once per hour after an attempt
                    </small>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
      <div className="mt-6">
        <WebsiteMeasurementsView data={data} />
      </div>
    </div>
  );
}
