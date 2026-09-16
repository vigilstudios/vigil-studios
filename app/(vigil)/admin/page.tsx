import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminClient } from "@/lib/supabase/admin";
import { ButtonLink } from "@/components/vigil/ui";
import { DistributionBar, KpiTile, Meter, Panel, StatusLine, Timeline } from "@/components/vigil/widgets";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatRelative, humanizeAction, titleCase } from "@/lib/vigil/format";
import { auditTone } from "@/lib/vigil/presenters";
import { getBillingProvider, readProviderConfig } from "@/lib/vigil/providers/registry";
import { adminCounts, attentionItems, jobStatusCounts, listAudit } from "@/lib/vigil/queries/admin";
import { PasswordForm } from "@/components/vigil/PasswordForm";
import { hasPassword } from "@/lib/vigil/auth/password";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const staff = await requireStaff("/admin");
  const [counts, jobs, attention, audit] = await Promise.all([adminCounts(), jobStatusCounts(), attentionItems(), listAudit()]);
  const providers = readProviderConfig();
  const billingMode = getBillingProvider().mode ?? null;
  const serviceRole = hasAdminClient();

  const attentionCount =
    attention.jobs.length + attention.domains.length + attention.websites.length + attention.subscriptions.length + attention.requests.length + attention.projects.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Vigil Admin</p>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Overview</h1>
        <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">What needs a human today, and how the platform is wired.</p>
      </div>

      {!hasPassword(staff.user) ? (
        <Panel title="Set a password for next time">
          <p className="mb-3 text-xs text-[color:var(--text-secondary)]">You signed in with an email link. With a password you can sign in straight away; the link stays available as a backup. Change it later under Plans &amp; staff.</p>
          <PasswordForm hasPassword={false} compact />
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Customers" value={counts.organizations} hint={<Link href="/admin/organizations" className="underline">All customers</Link>} />
        <KpiTile label="Websites live" value={`${counts.live} / ${counts.websites}`} tone={counts.websites > 0 && counts.live === counts.websites ? "good" : undefined}>
          <Meter value={counts.live} max={Math.max(counts.websites, 1)} tone="good" srLabel="Share of websites live" />
        </KpiTile>
        <KpiTile label="Domains to check" value={counts.domainsPending} tone={counts.domainsPending > 0 ? "warn" : "good"} hint="pending, verifying, error or expired" />
        <KpiTile label="Past due" value={counts.subsPastDue} tone={counts.subsPastDue > 0 ? "bad" : "good"} hint="subscriptions" />
        <KpiTile label="Open requests" value={counts.requestsOpen} tone={counts.requestsOpen > 0 ? "info" : undefined} hint={<Link href="/admin/requests" className="underline">Requests</Link>} />
        <KpiTile label="Jobs failed" value={counts.jobsFailed} tone={counts.jobsFailed > 0 ? "bad" : "good"} hint={`${counts.jobsQueued} queued`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title={`Needs attention${attentionCount ? ` · ${attentionCount}` : ""}`}>
          {attentionCount === 0 ? (
            <StatusLine tone="good" label="Nothing waiting on a human" hint="Failed jobs, broken domains, suspended sites, unpaid subscriptions and new requests land here." />
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {attention.projects.map((project) => (
                <AttentionRow key={`p${project.id}`} tone="info" href={`/admin/organizations/${project.organization?.id}`} title={`Onboarding ready · ${project.name}`} meta={`${project.organization?.name ?? "Unknown customer"} · ${titleCase(project.kind)} site`} when={project.updated_at} />
              ))}
              {attention.jobs.map((j) => (
                <AttentionRow key={`j${j.id}`} tone="bad" href="/admin/jobs?status=failed" title={`Job failed · ${j.kind}`} meta={`${j.organization?.name ?? "Unknown customer"} · ${(j.error as { message?: string } | null)?.message ?? "no message"}`} when={j.updated_at} />
              ))}
              {attention.websites.map((w) => (
                <AttentionRow key={`w${w.id}`} tone="bad" href={`/admin/websites/${w.id}`} title={`Website ${titleCase(w.status)} · ${w.name}`} meta={`${w.organization?.name ?? "Unknown customer"}${w.status_reason ? ` · ${w.status_reason}` : ""}`} when={w.updated_at} />
              ))}
              {attention.domains.map((d) => (
                <AttentionRow key={`d${d.id}`} tone="warn" href="/admin/domains" title={`Domain ${titleCase(d.status)} · ${d.hostname}`} meta={`${d.organization?.name ?? "Unknown customer"}${d.status_reason ? ` · ${d.status_reason}` : ""}`} when={d.updated_at} />
              ))}
              {attention.subscriptions.map((s) => (
                <AttentionRow key={`s${s.id}`} tone="warn" href="/admin/subscriptions" title={`Subscription ${titleCase(s.status)} · ${s.plan?.name ?? ""}`} meta={s.organization?.name ?? "Unknown customer"} when={s.updated_at} />
              ))}
              {attention.requests.map((r) => (
                <AttentionRow key={`r${r.id}`} tone="info" href="/admin/requests" title={`New request · ${r.title}`} meta={r.organization?.name ?? "Unknown customer"} when={r.submitted_at} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Panel title="Provisioning jobs" action={<Link href="/admin/jobs" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">All jobs</Link>}>
            <DistributionBar
              segments={[
                { label: "Queued", value: jobs.queued, tone: "info" },
                { label: "Running", value: jobs.running, tone: "info" },
                { label: "Succeeded", value: jobs.succeeded, tone: "good" },
                { label: "Failed", value: jobs.failed, tone: "bad" },
                { label: "Canceled", value: jobs.canceled, tone: "neutral" },
              ]}
            />
          </Panel>

          <Panel title="Platform wiring">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt className="text-[color:var(--text-secondary)]">Billing</dt>
              <dd><Wiring value={billingMode ? `${providers.billing} (${billingMode} mode)` : providers.billing} /></dd>
              <dt className="text-[color:var(--text-secondary)]">Deployment</dt>
              <dd><Wiring value={providers.deployment} /></dd>
              <dt className="text-[color:var(--text-secondary)]">Domains</dt>
              <dd><Wiring value={providers.domain} /></dd>
              <dt className="text-[color:var(--text-secondary)]">Service role</dt>
              <dd>
                <StatusLine tone={serviceRole ? "good" : "warn"} label={serviceRole ? "Configured" : "Missing"} size="sm" />
              </dd>
            </dl>
            <p className="mt-3 text-[11px] text-[color:var(--text-secondary)]">
              `null` providers are in-memory stand-ins for development. The service role is needed by the job runner route and webhooks.
            </p>
          </Panel>
        </div>

        <Panel className="lg:col-span-12" title="Latest activity" action={<ButtonLink href="/admin/audit" variant="secondary" className="!px-2.5 !py-1 text-xs">Audit log</ButtonLink>}>
          <Timeline
            empty="No events yet."
            items={audit.slice(0, 8).map((e) => ({
              key: String(e.id),
              tone: auditTone(e.action, e.after),
              title: humanizeAction(e.action),
              meta: [e.organization?.name, e.actor?.full_name ?? e.actor?.email ?? e.actor_kind].filter(Boolean).join(" · "),
              when: formatRelative(e.created_at),
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function Wiring({ value }: { value: string }) {
  const configured = value !== "null";
  return <StatusLine tone={configured ? "good" : "neutral"} label={configured ? titleCase(value) : "null (in-memory)"} size="sm" />;
}

function AttentionRow({ tone, href, title, meta, when }: { tone: "bad" | "warn" | "info"; href: string; title: string; meta: string; when: string | null }) {
  return (
    <li>
      <Link href={href} className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2 hover:bg-[color:var(--bg-surface-soft)]">
        <div className="min-w-0 flex-1">
          <StatusLine tone={tone} label={title} size="sm" />
          <p className="mt-0.5 truncate text-[11px] text-[color:var(--text-secondary)]">{meta}</p>
        </div>
        <span className="shrink-0 text-[11px] text-[color:var(--text-secondary)]">{formatRelative(when)}</span>
      </Link>
    </li>
  );
}
