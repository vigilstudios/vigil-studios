import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/vigil/ActionControls";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { cancelJob, retryJob, runJobsNow } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDateTime, formatRelative } from "@/lib/vigil/format";
import { listJobs } from "@/lib/vigil/queries/admin";
import { Constants } from "@/types/database.types";

export const metadata: Metadata = { title: "Jobs" };

const tone = (s: string) => (s === "succeeded" ? "good" : s === "failed" ? "bad" : s === "canceled" ? "neutral" : "info");

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("/admin/jobs");
  const { status } = await searchParams;
  const jobs = await listJobs(status);
  return (
    <div>
      <PageHeader
        title="Provisioning jobs"
        description="Durable, idempotent work against providers. Retries back off automatically; failed jobs wait for a human."
        actions={<ActionButton variant="primary" action={runJobsNow}>Run due jobs now</ActionButton>}
      />
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/jobs" className={!status ? "font-semibold underline" : "underline"}>All</Link>
        {Constants.public.Enums.job_status.map((s) => (
          <Link key={s} href={`/admin/jobs?status=${s}`} className={status === s ? "font-semibold underline" : "underline"}>{s}</Link>
        ))}
      </div>
      <Table>
        <thead>
          <tr>
            <th className={thClass}>Job</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Attempts</th>
            <th className={thClass}>Scheduled</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className={tdClass}>
                <div className="font-mono text-xs">{j.kind}</div>
                {j.error ? <div className="mt-1 max-w-xs text-xs text-[#ef4444]">{(j.error as { message?: string }).message}</div> : null}
                {j.locked_by ? <div className="text-xs text-[color:var(--text-secondary)]">lock: {j.locked_by}</div> : null}
              </td>
              <td className={tdClass}>{j.organization ? <Link href={`/admin/organizations/${j.organization.id}`} className="underline">{j.organization.name}</Link> : "—"}</td>
              <td className={tdClass}><StatusPill tone={tone(j.status)}>{j.status}</StatusPill></td>
              <td className={tdClass}>{j.attempts}/{j.max_attempts}</td>
              <td className={tdClass}>
                <div>{formatDateTime(j.scheduled_for)}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">updated {formatRelative(j.updated_at)}</div>
              </td>
              <td className={tdClass}>
                <div className="flex gap-3">
                  {j.status === "failed" || j.status === "canceled" ? <ActionButton variant="link" action={retryJob.bind(null, j.id)}>Retry</ActionButton> : null}
                  {j.status === "queued" || j.status === "failed" ? <ActionButton variant="danger" action={cancelJob.bind(null, j.id)}>Cancel</ActionButton> : null}
                </div>
              </td>
            </tr>
          ))}
          {jobs.length === 0 ? <tr><td className={tdClass} colSpan={6}>No jobs.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
