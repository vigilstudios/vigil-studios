"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ExternalLink, LoaderCircle } from "lucide-react";
import { clsx } from "clsx";
import { REGISTRAR_GUIDES, REGISTRAR_OPTIONS, RECORD_TYPE_HELP } from "@/lib/vigil/domain-guides";
import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import type { DomainStatus } from "@/lib/vigil/types";
import { inputClass } from "./ui";
import { StatusLine } from "./widgets";
import { VirtueOrb } from "./VirtueOrb";

export type GuideDomain = {
  domainId: string;
  hostname: string;
  status: string;
  records: { type: string; name: string; value: string }[];
  dnsOk: boolean | null;
  sslOk: boolean | null;
  reachable: boolean | null;
  statusReason: string | null;
  cutoverReady: boolean;
};

/**
 * The registrar-specific walkthrough for a customer-owned domain. Shared by
 * the onboarding wizard and the dashboard's Domain page so a customer who
 * chose "later" finds exactly the same steps. Pure presentation: the caller
 * owns the actions ("I've added the records", registrar changes, polling).
 */
export function DomainGuide({
  domain,
  registrar,
  onRegistrarChange,
  onConfirm,
  confirming,
  checking,
  compact,
}: {
  domain: GuideDomain;
  registrar: RegistrarKey;
  onRegistrarChange?: (r: RegistrarKey) => void;
  onConfirm?: () => void;
  confirming?: boolean;
  /** True while a verify is in flight or the domain is in `verifying`. */
  checking?: boolean;
  compact?: boolean;
}) {
  const guide = REGISTRAR_GUIDES[registrar];
  const status = describeDomainStatus(domain.status as DomainStatus, { dnsOk: domain.dnsOk, sslOk: domain.sslOk, reachable: domain.reachable });
  const connected = domain.status === "connected";
  const verifying = domain.status === "verifying";
  const apex = domain.records.some((record) => record.name === "@" || record.name === domain.hostname);
  const records = domain.records.map((r) => ({ ...r, displayName: r.name === "@" || r.name === domain.hostname ? guide.apexName : r.name }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold">{domain.hostname}</p>
        <StatusLine tone={status.tone} label={status.label} size="sm" />
      </div>

      {connected ? (
        <p className="text-[13px] text-[color:var(--text-secondary)]">Your domain points at Vigil. Nothing more to do here.</p>
      ) : (
        <>
          {onRegistrarChange ? (
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-[color:var(--text-secondary)]">Where is the domain managed?</span>
              <select value={registrar} onChange={(e) => onRegistrarChange(e.target.value as RegistrarKey)} className={clsx(inputClass, "min-h-11")}>
                {REGISTRAR_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.name}</option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-[color:var(--text-secondary)]">Usually the company you pay each year for the domain.</span>
            </label>
          ) : null}

          {!domain.cutoverReady ? (
            <div className="flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-2.5 text-[13px]">
              <VirtueOrb size="sm" state="working" label="" className="mt-0.5" />
              <p>
                Your domain is saved. <b>You do not need to change anything yet.</b> As soon as your preview is deployed, the exact DNS record will appear here and we will guide you through the connection.
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-2.5 text-[13px]">
              <VirtueOrb size="sm" state="working" label="" className="mt-0.5" />
              <p>I&apos;m preparing the exact records for {domain.hostname}. Nothing to change yet.</p>
            </div>
          ) : (
            <ol className="space-y-3 text-[13px]">
              <Step n={1} title={`Sign in at ${guide.name}`}>
                {guide.loginUrl ? (
                  <a href={guide.loginUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 text-[color:var(--accent)] underline-offset-2 hover:underline">
                    Open {guide.name} in a new tab <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[color:var(--text-secondary)]">Sign in with the company you bought the domain from. Not sure who that is? Search your email for &ldquo;domain renewal&rdquo; or &ldquo;{domain.hostname}&rdquo;.</span>
                )}
              </Step>
              <Step n={2} title="Open the DNS settings">
                <p className="text-[color:var(--text-secondary)]">
                  Go to <Breadcrumb parts={guide.dnsPath} />.
                </p>
                {guide.before?.map((b, i) => (
                  <p key={i} className="mt-1 text-[color:var(--text-secondary)]">{b}</p>
                ))}
              </Step>
              <Step n={3} title={`Add ${records.length === 1 ? "this record" : `these ${records.length} records`}`}>
                <p className="mb-2 text-[color:var(--text-secondary)]">
                  Look for &ldquo;Add record&rdquo;. Copy each value exactly; {guide.fields.ttl ? `leave ${guide.fields.ttl} at its default.` : "leave everything else at its default."}
                </p>
                <ul className="space-y-2">
                  {records.map((r, i) => (
                    <li key={i} className="min-w-0 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide">{r.type} record</span>
                        {domain.dnsOk === true ? <span className="text-[11px] text-[color:var(--status-good)]">Found</span> : null}
                      </div>
                      <dl className="mt-2 grid gap-2">
                        <RecordField label={`Type`} value={r.type} />
                        <RecordField label={guide.fields.name} value={r.displayName} copy={r.displayName} />
                        <RecordField label={guide.fields.valueByType?.[r.type.toUpperCase()] ?? guide.fields.value} value={r.value} copy={r.value} />
                      </dl>
                      {!compact && RECORD_TYPE_HELP[r.type.toUpperCase()] ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">{RECORD_TYPE_HELP[r.type.toUpperCase()]}</p> : null}
                    </li>
                  ))}
                </ul>
                {guide.apexNote && apex ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">{guide.apexNote}</p> : null}
                {!apex ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Because {domain.hostname} is a subdomain, only the part before the first dot goes in the name field.</p> : null}
              </Step>
              <Step n={4} title="Remove anything that clashes">
                <p className="text-[color:var(--text-secondary)]">{guide.conflicts}</p>
                <p className="mt-1 font-medium text-[color:var(--status-warn)]">
                  Only replace conflicting A, AAAA, or CNAME records for the website host shown above. Keep all MX, TXT, CAA, and email records, and do not change nameservers or transfer the domain.
                </p>
              </Step>
              <Step n={5} title="Save, then tell me">
                <p className="text-[color:var(--text-secondary)]">{guide.after ?? "Changes can take up to 48 hours to spread across the internet."} I keep checking and email you when it connects.</p>
                {guide.helpUrl ? (
                  <a href={guide.helpUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-[11px] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
                    {guide.name}&apos;s own help article <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </Step>
            </ol>
          )}

          {domain.cutoverReady && records.length > 0 ? <ConnectionProgress domain={domain} /> : null}

          {domain.cutoverReady && records.length > 0 && onConfirm ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={onConfirm} disabled={confirming || checking || verifying} className="btn-primary min-h-11 !px-5 !py-2.5 text-sm disabled:opacity-60">
                {confirming ? "Checking…" : verifying ? "Checking…" : "I've added the records"}
              </button>
              {verifying || checking ? (
                <span className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  <VirtueOrb size="sm" state="working" label="" />
                  {domain.dnsOk
                    ? domain.sslOk
                      ? "The secure connection is ready. Waiting for the site to answer before we open it."
                      : "Your DNS record is correct. We are creating the secure connection."
                    : "Checking public DNS. This can take up to 48 hours, and we will email you when it connects."}
                </span>
              ) : null}
            </div>
          ) : null}
          {domain.statusReason && !verifying ? <p className="text-[11px] text-[color:var(--text-secondary)]">{domain.statusReason}</p> : null}
        </>
      )}
    </div>
  );
}

function ConnectionProgress({ domain }: { domain: GuideDomain }) {
  const steps = [
    { label: "DNS record", done: domain.dnsOk === true, active: domain.status === "verifying" && domain.dnsOk !== true },
    { label: "Secure connection", done: domain.sslOk === true, active: domain.dnsOk === true && domain.sslOk !== true },
    { label: "Site reachable", done: domain.status === "connected" && domain.reachable === true, active: domain.sslOk === true && domain.status !== "connected" },
  ];
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-3" aria-label="Domain connection progress">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Connection progress</p>
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-xs">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--status-good)]" aria-hidden />
            ) : step.active ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[color:var(--status-info)]" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-[color:var(--status-neutral)]" aria-hidden />
            )}
            <span className={step.done ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]"}>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[11px] font-semibold text-[color:var(--accent)]">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}

function Breadcrumb({ parts }: { parts: string[] }) {
  return (
    <span>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? <span className="mx-1 opacity-60">→</span> : null}
          <b className="font-medium text-[color:var(--text-primary)]">{p}</b>
        </span>
      ))}
    </span>
  );
}

function RecordField({ label, value, copy }: { label: string; value: string; copy?: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2">
      <dt className="text-[11px] leading-4 text-[color:var(--text-secondary)]">{label}</dt>
      <dd className="min-w-0 break-all font-mono text-xs">{value}</dd>
      {copy ? <InlineCopy value={copy} label={label} /> : <span />}
    </div>
  );
}

function InlineCopy({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          window.prompt(`Copy this ${label}:`, value);
        }
      }}
      className={clsx("min-h-8 shrink-0 rounded-md border px-2 text-[11px] font-medium", copied ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-[color:var(--border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
