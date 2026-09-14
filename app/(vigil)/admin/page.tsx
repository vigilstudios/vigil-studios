import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { adminCounts, listJobs } from "@/lib/vigil/queries/admin";
import { formatRelative } from "@/lib/vigil/format";
import { readProviderConfig } from "@/lib/vigil/providers/registry";
import { hasAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requireStaff("/admin");
  const [counts, failedJobs] = await Promise.all([adminCounts(), listJobs("failed")]);
  const providers = readProviderConfig();

  return (
    <div>
      <PageHeader eyebrow="Vigil Admin" title="Overview" description="What needs a human today, and how the platform is wired." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Customers" value={counts.organizations} />
        <Stat label="Websites live" value={`${counts.live} / ${counts.websites}`} />
        <Stat label="Domains needing attention" value={counts.domainsPending} />
        <Stat label="Subscriptions past due" value={counts.subsPastDue} />
        <Stat label="Open requests" value={counts.requestsOpen} />
        <Stat label="Jobs queued" value={counts.jobsQueued} />
        <Stat label="Jobs failed" value={counts.jobsFailed} />
        <Stat label="Service role" value={hasAdminClient() ? "Configured" : "Missing"} hint="Needed by the job runner and webhooks" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Failed jobs</h2>
          {failedJobs.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">None. Good.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--border)] text-sm">
              {failedJobs.slice(0, 8).map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{j.kind}</div>
                    <div className="truncate text-xs text-[color:var(--text-secondary)]">
                      {j.organization?.name ?? "—"} · {(j.error as { message?: string } | null)?.message ?? "no message"}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[color:var(--text-secondary)]">{formatRelative(j.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/jobs" className="mt-3 inline-block text-xs underline">
            All jobs
          </Link>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Providers</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Selected by environment. `null` is the in-memory provider for development.</p>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[color:var(--text-secondary)]">Billing</dt>
            <dd className="font-mono">{providers.billing}</dd>
            <dt className="text-[color:var(--text-secondary)]">Deployment</dt>
            <dd className="font-mono">{providers.deployment}</dd>
            <dt className="text-[color:var(--text-secondary)]">Domains</dt>
            <dd className="font-mono">{providers.domain}</dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
