"use client";

import { useState, type SVGProps } from "react";
import {
  Activity,
  BrickWall,
  Bug,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { formatRelative } from "@/lib/vigil/format";
import {
  SECURITY_CHECKS,
  auditScore,
  securityChecksCurrent,
  securityState,
  speedSeconds,
} from "@/lib/vigil/overview/monitoring";
import type { OverviewData } from "@/lib/vigil/overview/model";

/** The watchful, angular eye used for Vigil's monitoring identity. */
export function VigilEyeIcon({
  size = 16,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 8 5 1 5-2 5 2 5-1-3 8-7 3-7-3Z" />
      <path d="m5 12 4 1m10-1-4 1" />
      <path d="M10 11.5a2.5 2.5 0 1 0 4 0" />
    </svg>
  );
}

const monitorIcons = {
  vulnerabilities: Bug,
  exploits: ScanLine,
  activity: Activity,
  firewall: BrickWall,
};
export function SecurityPanel({ data }: { data: OverviewData }) {
  const [tab, setTab] = useState<"overview" | "alerts">("overview");
  const report = data.security,
    state = securityState(report, data.asOf);
  const current = report ? securityChecksCurrent(report, data.asOf) : false;
  const Shield =
    state === "secured"
      ? ShieldCheck
      : state === "alert"
        ? ShieldAlert
        : ShieldQuestion;
  const title = {
    secured: "Secured",
    alert: "Attention required",
    pending: "Awaiting fresh checks",
    unconnected: "Monitoring not connected",
  }[state];
  const detail = {
    secured: "All monitoring checks are clear",
    alert: "Review the flagged security checks",
    pending: "A current, complete check is needed",
    unconnected: "Threat monitoring data is not available yet",
  }[state];
  return (
    <div className="ov-security">
      <div className="ov-security-summary">
        <div className="ov-security-shield">
          <Shield size={30} strokeWidth={1.4} aria-hidden="true" />
        </div>
        <div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </div>
      </div>
      <div
        className="ov-underline-tabs ov-security-tabs"
        role="group"
        aria-label="Vigil Security report"
      >
        <button
          type="button"
          aria-pressed={tab === "overview"}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          aria-pressed={tab === "alerts"}
          onClick={() => setTab("alerts")}
        >
          Alerts
          {report
            ? ` · ${report.alerts.length || (state === "alert" ? "Flagged" : state === "pending" ? "Pending" : "0")}`
            : ""}
        </button>
      </div>
      {tab === "overview" ? (
        <ul className="ov-security-checks">
          {SECURITY_CHECKS.map(({ key, label }) => {
            const Icon = monitorIcons[key];
            const status = report?.checks[key];
            const flagged =
              status === "alert" ||
              report?.alerts.some((alert) => alert.category === key);
            const text = flagged
              ? "Attention"
              : state === "unconnected"
                ? "Not connected"
                : status === "clear" && current
                  ? key === "firewall"
                    ? "Protected"
                    : "Clear"
                  : "Pending";
            return (
              <li
                key={key}
                data-state={
                  flagged ? "alert" : state === "alert" ? "neutral" : state
                }
              >
                <Icon size={14} aria-hidden="true" />
                <span>{label}</span>
                <strong>{text}</strong>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          className="ov-security-alerts"
          role="region"
          aria-label="Active security alerts"
          tabIndex={0}
        >
          {report?.alerts.length ? (
            <ul>
              {report.alerts.map((alert) => (
                <li key={alert.id}>
                  <ShieldAlert size={15} aria-hidden="true" />
                  <div>
                    <strong>{alert.title}</strong>
                    <small>
                      {alert.severity === "critical" ? "Critical" : "Warning"} ·{" "}
                      {formatRelative(alert.detectedAt)}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {state === "unconnected"
                ? "Connect monitoring to receive security alerts."
                : state === "alert"
                  ? "A security check is flagged. Alert details are not available yet."
                  : state === "pending"
                    ? "Current alert status is awaiting a fresh check."
                    : "No active alerts in the latest check."}
            </p>
          )}
        </div>
      )}
      <div className="ov-security-footer">
        <span className="ov-security-dot" />
        {report ? (
          <span
            title={`Observed ${report.observedAt} · valid until ${report.expiresAt}`}
          >
            Latest check {formatRelative(report.observedAt)}
          </span>
        ) : (
          <span>Vulnerabilities · activity · firewall</span>
        )}
      </div>
    </div>
  );
}

export function SiteQualityPanel({ data }: { data: OverviewData }) {
  const report = data.quality;
  const speed = speedSeconds(report?.lcpMs);
  return (
    <div className="ov-quality">
      {[
        { label: "SEO", score: auditScore(report?.seo) },
        { label: "Performance", score: auditScore(report?.performance) },
      ].map(({ label, score }) => (
        <div className="ov-quality-metric" key={label}>
          <div>
            <span>{label}</span>
            <strong>
              {score === null ? "—" : Math.round(score)}
              {score !== null && <small>/100</small>}
            </strong>
          </div>
          <div
            className="ov-quality-track"
            role={score === null ? "img" : "meter"}
            aria-label={
              score === null ? `${label} score: Not measured` : `${label} score`
            }
            aria-valuemin={score === null ? undefined : 0}
            aria-valuemax={score === null ? undefined : 100}
            aria-valuenow={score ?? undefined}
            aria-valuetext={score === null ? undefined : `${score} out of 100`}
          >
            <i style={{ width: `${score ?? 0}%` }} />
          </div>
        </div>
      ))}
      <div className="ov-quality-speed">
        <span>
          Speed <small title="Largest Contentful Paint">LCP</small>
        </span>
        <strong>
          {speed === null ? "—" : `${speed.toFixed(1)}`}{" "}
          {speed !== null && <small>s</small>}
        </strong>
      </div>
      <p className="ov-quality-note">
        {report ? (
          <>
            <span>
              {report.device === "mobile" ? "Mobile" : "Desktop"} audit
            </span>
            <span title={report.measuredAt}>
              {formatRelative(report.measuredAt)}
            </span>
          </>
        ) : (
          <>
            <span>Audit not connected</span>
            <span>No scores recorded yet</span>
          </>
        )}
      </p>
    </div>
  );
}
