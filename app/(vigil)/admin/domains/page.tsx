import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton, TransitionSelect } from "@/components/vigil/ActionControls";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { enqueueDomainJob, setDomainStatus } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDate, formatRelative, titleCase } from "@/lib/vigil/format";
import { domainTransitions } from "@/lib/vigil/lifecycle";
import { listDomains } from "@/lib/vigil/queries/admin";

export const metadata: Metadata = { title: "Domains" };

const tone = (s: string) => (s === "connected" ? "good" : s === "error" || s === "expired" ? "bad" : s === "released" ? "neutral" : "warn");

export default async function DomainsPage() {
  await requireStaff("/admin/domains");
  const domains = await listDomains();
  return (
    <div>
      <PageHeader title="Domains" description="Connection, verification, and renewal state for every customer domain." />
      <Table>
        <thead>
          <tr>
            <th className={thClass}>Hostname</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Expires</th>
            <th className={thClass}>Checked</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d.id}>
              <td className={tdClass}>
                <div className="font-medium">{d.hostname}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">
                  {titleCase(d.source)}{d.registrar ? ` · ${titleCase(d.registrar)}` : ""}{d.website ? ` · ${d.website.name}` : ""}
                </div>
                {(d.metadata as { onboarding_delegate?: boolean } | null)?.onboarding_delegate ? (
                  <div className="mt-1 text-xs font-medium text-[color:var(--status-warn)]">Assisted cutover requested</div>
                ) : null}
              </td>
              <td className={tdClass}><Link href={`/admin/organizations/${d.organization?.id}`} className="underline">{d.organization?.name}</Link></td>
              <td className={tdClass}>
                <StatusPill tone={tone(d.status)}>{titleCase(d.status)}</StatusPill>
                {d.status_reason ? <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{d.status_reason}</div> : null}
              </td>
              <td className={tdClass}>{d.expires_at ? formatDate(d.expires_at) : "Not available"}</td>
              <td className={tdClass}>{formatRelative(d.last_checked_at)}</td>
              <td className={tdClass}>
                <div className="flex flex-col gap-2">
                  <TransitionSelect current={d.status} options={domainTransitions[d.status]} action={setDomainStatus.bind(null, d.id)} withReason />
                  <div className="flex gap-2">
                    <ActionButton variant="link" action={enqueueDomainJob.bind(null, d.id, "domain.connect")}>Queue connect</ActionButton>
                    <ActionButton variant="link" action={enqueueDomainJob.bind(null, d.id, "domain.verify")}>Queue verify</ActionButton>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {domains.length === 0 ? <tr><td className={tdClass} colSpan={6}>No domains yet.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
