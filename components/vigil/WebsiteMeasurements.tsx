import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Search,
  ShieldCheck,
  Smartphone,
  Monitor,
  Gauge,
} from "lucide-react";
import {
  measurementKinds,
  measurementLabels,
  measurementSources,
  measurementStateLabels,
  type MeasurementConnectionView,
  type MeasurementKind,
  type MeasurementPayload,
  type WebsiteMeasurements,
} from "@/lib/vigil/measurements/contract";
import { formatDateTime } from "@/lib/vigil/format";
import "./website-measurements.css";

const icons = {
  traffic: BarChart3,
  quality_mobile: Smartphone,
  quality_desktop: Monitor,
  field_performance: Gauge,
  site_security: ShieldCheck,
  repository_security: ShieldCheck,
  search: Search,
};
const value = (number: number | null, unit = "") =>
  number === null
    ? "—"
    : `${number.toLocaleString("en-US", { maximumFractionDigits: unit === "s" ? 1 : 2 })}${unit}`;
function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="vm-facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
function Ranking({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  return (
    <div className="vm-ranking">
      <h4>{title}</h4>
      {items.length ? (
        <ol>
          {items.slice(0, 5).map((item, index) => (
            <li key={`${item.label}:${index}`}>
              <span>{item.label}</span>
              <strong>{item.value.toLocaleString()}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p>No recorded breakdown for this period.</p>
      )}
    </div>
  );
}
function Evidence({ payload }: { payload: MeasurementPayload }) {
  switch (payload.kind) {
    case "traffic": {
      const report = payload.ranges["30"];
      return (
        <>
          <Facts
            items={[
              {
                label: "Recorded visitors · 30 days",
                value: value(report.visitors),
              },
              { label: "Page views · 30 days", value: value(report.pageViews) },
            ]}
          />
          <p className="vm-context">
            {report.periodStart.slice(0, 10)} to {report.periodEnd.slice(0, 10)}{" "}
            · UTC. Provider-reported visitors; visitor identities reset daily.
          </p>
          <Ranking title="Top pages · page views" items={report.pages} />
          <Ranking title="Referrers · visitors" items={report.sources} />
        </>
      );
    }
    case "quality":
      return (
        <>
          <Facts
            items={[
              {
                label: "SEO audit",
                value: value(payload.seo, payload.seo === null ? "" : "/100"),
              },
              {
                label: "Performance",
                value: value(
                  payload.performance,
                  payload.performance === null ? "" : "/100",
                ),
              },
              {
                label: "Largest Contentful Paint",
                value:
                  payload.lcpMs === null
                    ? "—"
                    : value(payload.lcpMs / 1000, "s"),
              },
              {
                label: "Accessibility",
                value: value(
                  payload.accessibility,
                  payload.accessibility === null ? "" : "/100",
                ),
              },
            ]}
          />
          <p className="vm-context">
            A controlled {payload.device} lab test. SEO audit scores describe
            technical checks, not search rankings.
          </p>
          {payload.issues.length ? (
            <details className="vm-details">
              <summary>{payload.issues.length} recorded opportunities</summary>
              <ul>
                {payload.issues.map((issue) => (
                  <li key={issue.id}>{issue.title}</li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="vm-context">
              No opportunities were included in this audit response.
            </p>
          )}
        </>
      );
    case "field":
      return payload.sufficient ? (
        <>
          <Facts
            items={[
              {
                label: "LCP · 75th percentile",
                value:
                  payload.lcpMs === null
                    ? "—"
                    : value(payload.lcpMs / 1000, "s"),
              },
              {
                label: "Interaction to Next Paint",
                value: value(payload.inpMs, "ms"),
              },
              { label: "Cumulative Layout Shift", value: value(payload.cls) },
            ]}
          />
          <p className="vm-context">
            Real Chrome users on phones · {payload.periodStart} to{" "}
            {payload.periodEnd}. Different measurement conditions from a lab
            test.
          </p>
        </>
      ) : (
        <p className="vm-empty">
          This website does not yet have enough eligible real-user data. Lab
          audits remain available separately.
        </p>
      );
    case "site_security":
      return (
        <>
          <ul className="vm-checks">
            {payload.checks.map((check) => (
              <li key={check.id}>
                <div>
                  <strong>{check.title}</strong>
                  <p>{check.detail}</p>
                </div>
                <span data-state={check.status}>
                  {check.status === "passed"
                    ? "Passed"
                    : check.status === "attention"
                      ? "Review"
                      : "Unknown"}
                </span>
              </li>
            ))}
          </ul>
          <p className="vm-context">
            HTTPS and response-header observations only. Firewall, exploit and
            suspicious-activity monitoring need separate evidence.
          </p>
        </>
      );
    case "repository_security":
      return (
        <>
          <Facts
            items={[
              {
                label: payload.complete
                  ? "Open dependency alerts"
                  : "Open dependency alerts · at least",
                value: value(payload.openCount),
              },
            ]}
          />
          {payload.findings.length ? (
            <ul className="vm-findings">
              {payload.findings.slice(0, 12).map((item) => (
                <li key={item.reference}>
                  <span>{item.severity}</span>
                  {item.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="vm-context">
              No open alerts returned in this dependency check. This does not
              establish the absence of website vulnerabilities or exploitation.
            </p>
          )}
          {!payload.complete ? (
            <p className="vm-context">
              The provider result is partial. Review the remaining alerts with
              Vigil.
            </p>
          ) : null}
        </>
      );
    case "search":
      return (
        <>
          <Facts
            items={[
              { label: "Google search clicks", value: value(payload.clicks) },
              {
                label: "Search impressions",
                value: value(payload.impressions),
              },
              {
                label: "Click-through rate",
                value: `${(payload.ctr * 100).toFixed(1)}%`,
              },
              { label: "Average position", value: value(payload.position) },
            ]}
          />
          <p className="vm-context">
            Finalized search data · {payload.periodStart} to {payload.periodEnd}{" "}
            · Pacific time. Search terms may be withheld or limited by Google.
          </p>
          <Ranking
            title="Top search terms · clicks"
            items={payload.queries.map((query) => ({
              label: query.label,
              value: query.clicks,
            }))}
          />
        </>
      );
  }
}
function MeasurementCard({
  kind,
  connection,
}: {
  kind: MeasurementKind;
  connection?: MeasurementConnectionView;
}) {
  const Icon = icons[kind],
    state = connection?.state ?? "not_connected",
    payload = connection?.payload;
  return (
    <article className="vm-card">
      <header>
        <div className="vm-icon">
          <Icon size={18} aria-hidden="true" />
        </div>
        <div>
          <h3>{measurementLabels[kind]}</h3>
          <p>{measurementSources[kind]}</p>
        </div>
        <span className="vm-state" data-state={state}>
          {measurementStateLabels[state]}
        </span>
      </header>
      {state === "attention" ? (
        <p className="vm-notice">
          Vigil needs to check this connection.{" "}
          {payload
            ? "The last recorded evidence remains below."
            : "A verified report is not available yet."}
        </p>
      ) : state === "stale" ? (
        <p className="vm-notice">
          An update is overdue. These are the last recorded results.
        </p>
      ) : null}
      {payload ? (
        <Evidence payload={payload} />
      ) : (
        <p className="vm-empty">
          {connection?.enabled
            ? "Results will appear after the first successful measurement."
            : "Vigil will connect this source when your website reporting is configured."}
        </p>
      )}
      <footer>
        <Activity size={13} aria-hidden="true" />
        {connection?.observedAt ? (
          <time dateTime={connection.observedAt}>
            Checked {formatDateTime(connection.observedAt)}
          </time>
        ) : (
          "No successful measurement recorded"
        )}
      </footer>
    </article>
  );
}
export function WebsiteMeasurementsView({
  data,
}: {
  data: WebsiteMeasurements;
}) {
  return (
    <div className="vm-workspace">
      {!data.available ? (
        <p className="vm-notice">
          Vigil is preparing website reporting. No measurements have been
          substituted with estimates.
        </p>
      ) : data.updatesEnabled === false ? (
        <p className="vm-notice">
          Scheduled reporting updates are paused. Recorded reports remain
          available with their original dates.
        </p>
      ) : null}
      <div className="vm-grid">
        {measurementKinds.map((kind) => (
          <MeasurementCard
            key={kind}
            kind={kind}
            connection={data.connections.find((c) => c.kind === kind)}
          />
        ))}
      </div>
      <p className="vm-footnote">
        <ArrowUpRight size={14} aria-hidden="true" />
        Every report retains its source and measurement time. Missing
        measurements are shown explicitly.
      </p>
    </div>
  );
}
