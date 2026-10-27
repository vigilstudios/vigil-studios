"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Sparkles,
  ExternalLink,
  Globe2,
  Inbox,
  LockKeyhole,
  MousePointer2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteFrame } from "@/components/vigil/SiteFrame";
import { DownloadSiteButton } from "@/components/vigil/DownloadSiteButton";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { contactInitials, sourceLabel } from "@/lib/vigil/leads/presentation";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  comparison,
  type ChartView,
  type OverviewData,
  type ReportRange,
} from "@/lib/vigil/overview/model";
import {
  ChartSwitcher,
  RankedBars,
  RingChart,
  TrendChart,
} from "./OverviewCharts";

export function WebsitePanel({ data }: { data: OverviewData }) {
  let host = data.domain?.hostname || data.site.name;
  try {
    host = new URL(data.site.live_url || "").hostname;
  } catch {
    /* Use the recorded domain/name. */
  }
  return (
    <div className="ov-website">
      <div className="ov-website-title">
        <div>
          <span className="ov-live">
            <i />
            Live website
          </span>
          <h3>{host}</h3>
        </div>
        <a
          href={data.site.live_url!}
          target="_blank"
          rel="noreferrer"
          className="ov-icon-button"
          title="Open live website"
          aria-label="Open live website"
        >
          <ExternalLink size={17} />
        </a>
      </div>
      <div className="ov-preview">
        <SiteFrame
          key={`${data.site.id}:${data.site.last_deployed_at}`}
          src={data.site.live_url!}
          title={`${data.site.name} live preview`}
          address={host}
          desktopHeight={1000}
          desktopPreviewHeight={340}
        />
      </div>
      <div className="ov-website-footer">
        <span>
          <span className="ov-tiny-dot" />
          Published{" "}
          {data.site.last_deployed_at
            ? formatRelative(data.site.last_deployed_at)
            : "· date not recorded"}
        </span>
        <Link href="/dashboard/content">
          Manage content
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="ov-website-plan">
        <div className="ov-plan-label">
          <CreditCard size={14} /> Your Vigil plan
        </div>
        <ServicePanel data={data} />
      </div>
    </div>
  );
}

export function HealthPanel({ data }: { data: OverviewData }) {
  const checks = [
    {
      name: "Website availability",
      icon: Globe2,
      value: data.site.last_health_at ? data.site.health_ok : null,
      at: data.site.last_health_at,
    },
    {
      name: "Secure connection (SSL)",
      icon: LockKeyhole,
      value: data.domain?.ssl_ok ?? null,
      at: data.domain?.last_checked_at,
    },
    {
      name: "Domain connection",
      icon: ShieldCheck,
      value: data.domain?.dns_ok ?? null,
      at: data.domain?.last_checked_at,
    },
  ];
  const passed = checks.filter((check) => check.value === true).length;
  const attention = checks.some((check) => check.value === false);
  return (
    <div className="ov-health">
      <div className="ov-health-summary">
        <RingChart
          parts={[
            { value: passed, color: "var(--accent)", label: "Passed" },
            {
              value: checks.filter((c) => c.value === false).length,
              color: "var(--status-bad)",
              label: "Needs attention",
            },
            {
              value: checks.filter((c) => c.value === null).length,
              color: "var(--ov-ring-track)",
              label: "Not checked",
            },
          ]}
          center={`${passed}/3`}
          caption="checks passed"
          label={`${passed} of 3 recorded checks passed`}
        />
        <p className={attention ? "ov-health-attention" : ""}>
          {attention
            ? "Needs attention"
            : passed === 3
              ? "Checks passed"
              : "Checks pending"}
        </p>
      </div>
      <ul className="ov-checks">
        {checks.map((check) => (
          <li key={check.name}>
            <check.icon size={16} aria-hidden="true" />
            <div
              title={
                check.at
                  ? `Checked ${formatRelative(check.at)}`
                  : "Check date not recorded"
              }
            >
              <strong>{check.name}</strong>
              <small>
                {check.at
                  ? `Checked ${formatRelative(check.at)}`
                  : check.value === null
                    ? "Not checked yet"
                    : "Check date not recorded"}
              </small>
            </div>
            <span
              className="ov-check-state"
              data-state={
                check.value === null ? "unknown" : check.value ? "good" : "bad"
              }
            >
              {check.value === null ? (
                "Pending"
              ) : check.value ? (
                <>
                  <Check size={11} />
                  Passed
                </>
              ) : (
                "Attention"
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="ov-footnote">Latest recorded checks.</p>
      <Link className="ov-text-link" href="/dashboard/domain">
        View details
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

export function LeadTrendsPanel({
  data,
  range,
  view,
  onView,
}: {
  data: OverviewData;
  range: ReportRange;
  view: ChartView;
  onView: (v: ChartView) => void;
}) {
  const report = data.reports[range];
  return (
    <>
      <div className="ov-trend-top">
        <div className="ov-main-number">
          <strong>{report.total.toLocaleString()}</strong>
          <span>inquiries received</span>
          <small
            className={report.total >= report.previous ? "ov-positive" : ""}
          >
            {report.total >= report.previous ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            {data.completeHistory
              ? comparison(report.total, report.previous)
              : "Within the latest 10,000 records"}
          </small>
        </div>
        <ChartSwitcher value={view} onChange={onView} label="Inquiry trends" />
      </div>
      <TrendChart points={report.series} view={view} label="Inquiries" />
      <div className="ov-trend-footer">
        <span>
          <i />
          {range === 90 ? "Weekly" : "Daily"} inquiries · UTC · excludes spam
        </span>
        <Link href="/dashboard/leads">
          Explore Lead Hub
          <ArrowRight size={13} />
        </Link>
      </div>
      {!data.captureEnabled && (
        <p className="ov-data-note">
          <Inbox size={13} />
          Inquiry capture is not active for this website.{" "}
          <Link href="/dashboard/leads?view=settings">View setup</Link>
        </p>
      )}
    </>
  );
}

export function PipelinePanel({
  data,
  range,
  view,
  onView,
}: {
  data: OverviewData;
  range: ReportRange;
  view: "donut" | "bars";
  onView: (v: "donut" | "bars") => void;
}) {
  const report = data.reports[range];
  return (
    <div className="ov-pipeline">
      <div
        className="ov-segments ov-status-switch"
        role="group"
        aria-label="Lead status view"
      >
        <button
          type="button"
          aria-pressed={view === "donut"}
          onClick={() => onView("donut")}
        >
          Donut
        </button>
        <button
          type="button"
          aria-pressed={view === "bars"}
          onClick={() => onView("bars")}
        >
          Bars
        </button>
      </div>
      {view === "donut" ? (
        <>
          <RingChart
            parts={report.stages.map((item) => ({
              ...item,
              color: STAGE_COLORS[item.key],
            }))}
            center={report.total.toLocaleString()}
            caption="inquiries"
            label={`Current statuses of ${report.total} inquiries received in the selected period`}
          />
          <ul className="ov-legend">
            {report.stages.map((stage) => (
              <li key={stage.key}>
                <Link href={`/dashboard/leads?status=${stage.key}`}>
                  <i style={{ background: STAGE_COLORS[stage.key] }} />
                  <span title={stage.label}>
                    {stage.key === "lost" ? "Lost" : stage.label}
                  </span>
                  <strong>{stage.value}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <RankedBars
          items={report.stages.map((stage) => ({
            ...stage,
            color: STAGE_COLORS[stage.key],
          }))}
          label="Current lead statuses"
          total={report.total}
        />
      )}
      <p className="ov-footnote">
        Current status · inquiries received in the last {range} days.
      </p>
    </div>
  );
}

export function TrafficPanel({
  data,
  range,
  view,
  onView,
}: {
  data: OverviewData;
  range: ReportRange;
  view: ChartView;
  onView: (v: ChartView) => void;
}) {
  const [tab, setTab] = useState<"trend" | "sources" | "pages">("trend");
  const report = data.traffic?.[range];
  return (
    <>
      <div className="ov-traffic-tabs" role="group" aria-label="Traffic report">
        <div className="ov-underline-tabs">
          {(["trend", "sources", "pages"] as const).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {key === "trend"
                ? "Audience"
                : key === "sources"
                  ? "Sources"
                  : "Pages"}
            </button>
          ))}
        </div>
        {tab === "trend" && (
          <ChartSwitcher
            value={view}
            onChange={onView}
            label="Website traffic"
          />
        )}
      </div>
      {report ? (
        tab === "trend" ? (
          <>
            <div className="ov-traffic-metrics">
              <div>
                <span>Visitors</span>
                <strong>{report.visitors.toLocaleString()}</strong>
              </div>
              <div>
                <span>Page views</span>
                <strong>{report.pageViews.toLocaleString()}</strong>
              </div>
            </div>
            <TrendChart
              points={report.series}
              view={view}
              label="Visitors"
              color="var(--ov-cyan)"
            />
          </>
        ) : (
          <RankedBars
            items={tab === "sources" ? report.sources : report.pages}
            label={
              tab === "sources" ? "Visitor sources" : "Top pages by page views"
            }
            color="var(--ov-cyan)"
          />
        )
      ) : (
        <div className="ov-unconnected">
          <div className="ov-empty-chart" aria-hidden="true">
            <span />
            <span />
            <span />
            <svg viewBox="0 0 400 80">
              <path
                d="M0 65 L50 65 L100 65 L150 65 L200 65 L250 65 L300 65 L350 65 L400 65"
                fill="none"
                stroke="var(--ov-cyan)"
                strokeWidth="2"
                strokeDasharray="5 6"
              />
            </svg>
            <div>
              <MousePointer2 size={22} />
            </div>
          </div>
          <h3>Know who’s finding you.</h3>
          <p>
            Visitor{" "}
            {tab === "sources"
              ? "sources"
              : tab === "pages"
                ? "and page"
                : "and traffic"}{" "}
            trends will appear once website analytics is connected. No visitor
            data is available yet.
          </p>
          <span className="ov-neutral-pill">Analytics not connected</span>
        </div>
      )}
      <p className="ov-footnote">
        {report
          ? "Visitor metrics for the selected period."
          : "Inquiry capture and website analytics are separate connections."}
      </p>
    </>
  );
}

export function InsightsPanel() {
  return (
    <div className="ov-insights">
      <span className="ov-neutral-pill">Coming soon</span>
      <Sparkles size={26} aria-hidden="true" />
      <p>Performance highlights, emerging trends and suggested next steps.</p>
      <small>Insights and automated recommendations are not active yet.</small>
    </div>
  );
}

export function InboxPanel({
  data,
  compact = false,
}: {
  data: OverviewData;
  compact?: boolean;
}) {
  const [view, setView] = useState<"followup" | "recent">("followup");
  const rows = (view === "followup" ? data.queue : data.recent).slice(
    0,
    compact ? 3 : 5,
  );
  const contact = (lead: (typeof rows)[number]) => {
    const details =
      lead.contact &&
      typeof lead.contact === "object" &&
      !Array.isArray(lead.contact)
        ? lead.contact
        : {};
    return {
      name: typeof details.name === "string" ? details.name : "Website visitor",
      email: typeof details.email === "string" ? details.email : "",
    };
  };
  return (
    <>
      <div className="ov-inbox-top">
        <div className="ov-underline-tabs">
          <button
            type="button"
            aria-pressed={view === "followup"}
            onClick={() => setView("followup")}
          >
            {compact ? "First reply" : "Needs a first reply"}{" "}
            <span>{data.awaiting}</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "recent"}
            onClick={() => setView("recent")}
          >
            {compact ? "Recent" : "Recent inquiries"}
          </button>
        </div>
        {!compact && (
          <span className="ov-inbox-unread">{data.unread} unread</span>
        )}
      </div>
      {rows.length ? (
        compact ? (
          <ul className="ov-inbox-compact">
            {rows.map((lead) => {
              const { name } = contact(lead);
              return (
                <li key={lead.id}>
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    <span className="ov-avatar">{contactInitials(name)}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>
                        {sourceLabel(lead.source)} ·{" "}
                        {formatRelative(lead.received_at)}
                      </small>
                    </span>
                    <ArrowUpRight size={13} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="ov-inbox-table">
            <table>
              <caption className="ov-sr-only">
                {view === "followup"
                  ? "Oldest new inquiries awaiting a first reply"
                  : "Latest website inquiries"}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Contact</th>
                  <th scope="col" className="ov-source-cell">
                    Source
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">Received</th>
                  <th scope="col">
                    <span className="ov-sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => {
                  const { name, email } = contact(lead);
                  return (
                    <tr key={lead.id}>
                      <td>
                        <div className="ov-contact">
                          <span className="ov-avatar">
                            {contactInitials(name)}
                          </span>
                          <div>
                            <Link href={`/dashboard/leads/${lead.id}`}>
                              {!lead.read_at && <i className="ov-unread-dot" />}
                              {name}
                            </Link>
                            {email && <small>{email}</small>}
                          </div>
                        </div>
                      </td>
                      <td className="ov-source-cell">
                        {sourceLabel(lead.source)}
                      </td>
                      <td>
                        <span
                          className="ov-stage-pill"
                          style={
                            {
                              "--stage-color":
                                lead.status === "spam"
                                  ? "var(--ov-muted)"
                                  : STAGE_COLORS[lead.status],
                            } as React.CSSProperties
                          }
                        >
                          {lead.status === "spam"
                            ? "Spam"
                            : STAGE_LABELS[lead.status]}
                        </span>
                      </td>
                      <td>
                        <time dateTime={lead.received_at}>
                          {formatRelative(lead.received_at)}
                        </time>
                      </td>
                      <td>
                        <Link
                          className="ov-icon-button"
                          href={`/dashboard/leads/${lead.id}`}
                          aria-label={`Open inquiry from ${name}`}
                        >
                          <ArrowUpRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="ov-quiet-empty">
          <Inbox size={25} />
          <h3>
            {view === "followup"
              ? "You’re all caught up."
              : "Your next conversation starts here."}
          </h3>
          <p>
            {view === "followup"
              ? "No inquiries are marked New. New inquiries appear here until you update their status."
              : "Your latest website inquiries will appear here."}
          </p>
        </div>
      )}
      <div className="ov-panel-bottom">
        <span>
          {view === "followup"
            ? "Oldest first · New status"
            : "Latest inquiries · all time"}
        </span>
        <Link
          href={
            view === "followup"
              ? "/dashboard/leads?status=new"
              : "/dashboard/leads"
          }
        >
          Open inbox
          <ArrowRight size={13} />
        </Link>
      </div>
    </>
  );
}

export function ActivityPanel({
  data,
  compact = false,
}: {
  data: OverviewData;
  compact?: boolean;
}) {
  const [view, setView] = useState<"activity" | "releases">("activity");
  const releases = data.releases.filter(
    (row) => row.environment === "production",
  );
  return (
    <>
      <div
        className="ov-segments ov-activity-switch"
        role="group"
        aria-label="Recent work view"
      >
        <button
          type="button"
          aria-pressed={view === "activity"}
          onClick={() => setView("activity")}
        >
          Activity
        </button>
        <button
          type="button"
          aria-pressed={view === "releases"}
          onClick={() => setView("releases")}
        >
          Releases
        </button>
      </div>
      {view === "activity" ? (
        data.activity.length ? (
          <ol className={`ov-timeline ${compact ? "" : "ov-timeline-wide"}`}>
            {data.activity.slice(0, compact ? 3 : 8).map((event) => (
              <li key={event.id}>
                <i data-tone={event.tone} />
                <div>
                  <strong>{event.title}</strong>
                  <time dateTime={event.at}>
                    {compact
                      ? formatRelative(event.at)
                      : `${formatDate(event.at)} · ${formatRelative(event.at)}`}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="ov-quiet-empty">
            <Activity size={23} />
            <p>Updates from Vigil will appear here.</p>
          </div>
        )
      ) : releases.length ? (
        <ol className={`ov-release-list ${compact ? "" : "ov-releases-wide"}`}>
          {releases.slice(0, compact ? 3 : 8).map((row) => {
            const duration = row.finished_at
              ? Math.max(
                  0,
                  (Date.parse(row.finished_at) - Date.parse(row.created_at)) /
                    1000,
                )
              : null;
            return (
              <li key={row.id}>
                <span className="ov-release-icon" data-state={row.status}>
                  <ArrowUpRight size={15} />
                </span>
                <div>
                  <strong>
                    {row.status === "ready"
                      ? "Website published"
                      : row.status === "error"
                        ? "Release failed"
                        : row.status === "canceled"
                          ? "Release canceled"
                          : "Release in progress"}
                  </strong>
                  <time dateTime={row.created_at}>
                    {formatRelative(row.created_at)}
                  </time>
                </div>
                <small>
                  {duration === null
                    ? "—"
                    : duration < 60
                      ? `${Math.round(duration)}s`
                      : `${Math.round(duration / 60)}m`}
                </small>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="ov-quiet-empty">
          <Activity size={23} />
          <p>No production releases recorded.</p>
        </div>
      )}
      <p className="ov-footnote">
        {view === "activity"
          ? "Recent activity across your business."
          : "Recent production releases · duration from recorded timestamps."}
      </p>
    </>
  );
}

export function ServicePanel({ data }: { data: OverviewData }) {
  const plan = data.subscription;
  return (
    <div className="ov-service">
      <div className="ov-service-copy">
        <span className="ov-service-icon">
          <ShieldCheck size={23} />
        </span>
        <div>
          <h3>{plan?.name ?? "Your Vigil service"}</h3>
          <p>
            {plan ? (
              <>
                {plan.status.replace(/_/g, " ")}
                {plan.renewsAt
                  ? ` · ${plan.cancels ? "Ends" : "Renews"} ${formatDate(plan.renewsAt)}`
                  : ""}
              </>
            ) : (
              "Subscription details are not available."
            )}
          </p>
        </div>
      </div>
      <div className="ov-service-requests">
        <Clock3 size={16} />
        <span>
          <strong>{data.openRequests}</strong> open change{" "}
          {data.openRequests === 1 ? "request" : "requests"}
        </span>
      </div>
      <div className="ov-service-actions">
        <Link href="/dashboard/requests" className="ov-button">
          {data.canRequest ? "Request a change" : "View change options"}
          <ArrowUpRight size={14} />
        </Link>
        <Link href="/dashboard/billing" className="ov-text-link">
          Manage plan
          <ChevronRight size={13} />
        </Link>
        {data.canExport &&
          data.site.export_eligible &&
          data.site.code_ownership === "customer_owned" && (
            <DownloadSiteButton websiteId={data.site.id} />
          )}
      </div>
    </div>
  );
}

export function SnapshotStrip({
  data,
  range,
}: {
  data: OverviewData;
  range: ReportRange;
}) {
  const report = data.reports[range];
  return (
    <div className="ov-snapshot">
      <div>
        <span className="ov-snapshot-icon">
          <Users size={17} />
        </span>
        <div>
          <span>New inquiries</span>
          <strong>{report.total.toLocaleString()}</strong>
        </div>
        <small>Last {range} days</small>
      </div>
      <div>
        <span className="ov-snapshot-icon ov-cyan">
          <Inbox size={17} />
        </span>
        <div>
          <span>Awaiting first reply</span>
          <strong>{data.awaiting.toLocaleString()}</strong>
        </div>
        <Link href="/dashboard/leads?status=new">
          View queue
          <ArrowUpRight size={12} />
        </Link>
      </div>
      <div>
        <span className="ov-snapshot-icon ov-purple">
          <Check size={17} />
        </span>
        <div>
          <span>Marked won</span>
          <strong>{report.won.toLocaleString()}</strong>
        </div>
        <small>From this period’s inquiries</small>
      </div>
    </div>
  );
}
