import type { Metadata } from "next";
import Link from "next/link";
import { TransitionSelect } from "@/components/vigil/ActionControls";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { setChangeRequestStatus } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDate, titleCase } from "@/lib/vigil/format";
import { changeRequestTransitions } from "@/lib/vigil/lifecycle";
import { listChangeRequests } from "@/lib/vigil/queries/admin";
import { signAttachments } from "@/lib/vigil/queries/dashboard";
import { AttachmentList } from "@/components/vigil/AttachmentList";

export const metadata: Metadata = { title: "Requests" };

const tone = (s: string) => (s === "delivered" ? "good" : s === "declined" ? "warn" : s === "closed" ? "neutral" : "info");

export default async function RequestsAdminPage() {
  await requireStaff("/admin/requests");
  const requests = await listChangeRequests();
  const signed = await Promise.all(requests.map((r) => signAttachments(r.attachments)));
  return (
    <div>
      <PageHeader title="Change requests" description="Website update requests from Care and higher customers. Allowance accounting is a later phase." />
      <Table>
        <thead>
          <tr>
            <th className={thClass}>Request</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Priority</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Submitted</th>
            <th className={thClass}>Transition</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r, i) => (
            <tr key={r.id}>
              <td className={tdClass}>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{r.requester?.full_name ?? r.requester?.email ?? "Unknown requester"}{r.website ? ` · ${r.website.name}` : ""}</div>
                {r.description ? <p className="mt-1 max-w-md whitespace-pre-wrap text-xs text-[color:var(--text-secondary)]">{r.description}</p> : null}
                {signed[i].length > 0 ? (
                  <div className="mt-2">
                    <AttachmentList items={signed[i]} compact />
                  </div>
                ) : null}
              </td>
              <td className={tdClass}><Link href={`/admin/organizations/${r.organization?.id}`} className="underline">{r.organization?.name}</Link></td>
              <td className={tdClass}>{titleCase(r.priority)}</td>
              <td className={tdClass}><StatusPill tone={tone(r.status)}>{titleCase(r.status)}</StatusPill></td>
              <td className={tdClass}>{formatDate(r.submitted_at ?? r.created_at)}</td>
              <td className={tdClass}><TransitionSelect current={r.status} options={changeRequestTransitions[r.status]} action={setChangeRequestStatus.bind(null, r.id)} /></td>
            </tr>
          ))}
          {requests.length === 0 ? <tr><td className={tdClass} colSpan={6}>No requests yet.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
