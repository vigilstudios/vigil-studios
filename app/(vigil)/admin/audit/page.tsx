import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDateTime } from "@/lib/vigil/format";
import { listAudit } from "@/lib/vigil/queries/admin";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  await requireStaff("/admin/audit");
  const { org } = await searchParams;
  const events = await listAudit(org);
  return (
    <div>
      <PageHeader title="Audit log" description="Every recorded state change and staff action, newest first." />
      {org ? (
        <p className="mb-3 text-xs">
          Filtered to one organization. <Link href="/admin/audit" className="underline">Show all</Link>
        </p>
      ) : null}
      <Table>
        <thead>
          <tr>
            <th className={thClass}>When</th>
            <th className={thClass}>Action</th>
            <th className={thClass}>Actor</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Change</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className={tdClass}>{formatDateTime(e.created_at)}</td>
              <td className={tdClass}>
                <div className="font-mono text-xs">{e.action}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{e.entity_type}{e.entity_id ? ` ${e.entity_id.slice(0, 8)}` : ""}</div>
              </td>
              <td className={tdClass}>
                <div>{e.actor?.full_name ?? e.actor?.email ?? "System"}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{e.actor_kind}</div>
              </td>
              <td className={tdClass}>{e.organization ? <Link href={`/admin/organizations/${e.organization.id}`} className="underline">{e.organization.name}</Link> : "System"}</td>
              <td className={tdClass}>
                <pre className="max-w-md overflow-x-auto whitespace-pre-wrap text-xs text-[color:var(--text-secondary)]">
                  {e.before ? `− ${JSON.stringify(e.before)}\n` : ""}
                  {e.after ? `+ ${JSON.stringify(e.after)}` : ""}
                </pre>
              </td>
            </tr>
          ))}
          {events.length === 0 ? <tr><td className={tdClass} colSpan={5}>No events yet.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
