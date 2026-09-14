import type { Metadata } from "next";
import Link from "next/link";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatRelative, humanizeAction } from "@/lib/vigil/format";
import {
  describeDomainStatus,
  describeProjectStatus,
  describeSubscriptionStatus,
  describeWebsiteStatus,
} from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgProjects, getOrgSubscription, getOrgWebsites, getRecentActivity } from "@/lib/vigil/queries/dashboard";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const ctx = await requireOrgContext("/dashboard");
  const orgId = ctx.organization.id;
  const [websites, domains, subscription, projects, activity, ent] = await Promise.all([
    getOrgWebsites(orgId),
    getOrgDomains(orgId),
    getOrgSubscription(orgId),
    getOrgProjects(orgId),
    getRecentActivity(orgId),
    resolveEntitlements(orgId),
  ]);

  const website = websites[0] ?? null;
  const domain = domains.find((d) => d.id === website?.primary_domain_id) ?? domains[0] ?? null;
  const project = projects.find((p) => !["closed", "cancelled", "launched"].includes(p.status)) ?? null;

  const websiteStatus = website ? describeWebsiteStatus(website.status) : null;
  const domainStatus = domain ? describeDomainStatus(domain.status) : null;
  const subStatus = subscription ? describeSubscriptionStatus(subscription.status) : null;
  const projectStatus = project ? describeProjectStatus(project.status) : null;

  const firstName = ctx.profile.full_name?.split(" ")[0];

  return (
    <div>
      <PageHeader
        eyebrow={ctx.organization.name}
        title={firstName ? `Hello, ${firstName}` : "Overview"}
        description="Everything Vigil is running for your business, at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatusCard
          title="Website"
          href="/dashboard/website"
          status={websiteStatus}
          detail={website?.live_url ? website.live_url.replace(/^https?:\/\//, "") : website?.name ?? "Not set up yet"}
        />
        <StatusCard
          title="Domain"
          href="/dashboard/domain"
          status={domainStatus}
          detail={domain?.hostname ?? "No domain connected"}
        />
        <StatusCard
          title="Subscription"
          href="/dashboard/billing"
          status={subStatus}
          detail={subscription?.plan?.name ?? "No active plan"}
        />
      </div>

      {project ? (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Your project</p>
              <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
            </div>
            {projectStatus ? <StatusPill tone={projectStatus.tone}>{projectStatus.label}</StatusPill> : null}
          </div>
          {project.status === "review" ? (
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Your website is ready for review. Reply to your project email with any changes or your approval.
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Nothing yet. Activity appears here as Vigil works on your account.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--border)]">
              {activity.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <span>{humanizeAction(event.action)}</span>
                  <span className="shrink-0 text-xs text-[color:var(--text-secondary)]">{formatRelative(event.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Your plan includes</h2>
          <DefinitionList
            items={[
              { label: "Managed hosting", value: yesNo(ent.enabled(FEATURES.hostingManaged)) },
              { label: "Managed domain", value: yesNo(ent.enabled(FEATURES.domainManaged)) },
              { label: "Website updates", value: yesNo(ent.enabled(FEATURES.requests)) },
              { label: "Virtue", value: yesNo(ent.enabled(FEATURES.virtue)) },
            ]}
          />
          {!ent.planCode ? (
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">No active subscription. Contact Vigil Studios to set one up.</p>
          ) : null}
        </Card>
      </div>

      {!website && !project ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to show yet"
            description="Once Vigil Studios starts your project, your website, domain and subscription will appear here."
          />
        </div>
      ) : null}
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? <span className="text-[color:var(--accent)]">Included</span> : <span className="text-[color:var(--text-secondary)]">—</span>;
}

function StatusCard({
  title,
  href,
  status,
  detail,
}: {
  title: string;
  href: string;
  status: { label: string; tone: "neutral" | "good" | "warn" | "bad" | "info"; hint?: string } | null;
  detail: string;
}) {
  return (
    <Link href={href} className="block rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 transition-colors hover:border-[color:var(--accent)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">{title}</h2>
        {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : <StatusPill tone="neutral">Not set up</StatusPill>}
      </div>
      <p className="mt-3 truncate text-base font-medium">{detail}</p>
      {status?.hint ? <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{status.hint}</p> : null}
    </Link>
  );
}
