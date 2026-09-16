import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDateTime, titleCase } from "@/lib/vigil/format";
import { listStaffReviewQueue } from "@/lib/vigil/queries/reviews";

export const metadata: Metadata = { title: "Reviews" };

const phaseLabel = { design_direction: "Design direction", full_site: "Full-site review" } as const;

export default async function AdminReviewsPage() {
  await requireStaff();
  const queue = await listStaffReviewQueue();

  return (
    <div>
      <PageHeader
        eyebrow="Professional projects"
        title="Review queue"
        description="Active customer review rounds, including feedback that needs a staff response."
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <th className={thClass}>Project</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Round</th>
              <th className={thClass}>Version</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Latest activity</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.roundId}>
                <td className={tdClass}><Link href={`/admin/reviews/${item.projectId}`} className="underline">{item.projectName}</Link></td>
                <td className={tdClass}><Link href={`/admin/organizations/${item.organizationId}`} className="underline">{item.organizationName}</Link></td>
                <td className={tdClass}>Round {item.roundNumber} · {phaseLabel[item.phase]}</td>
                <td className={tdClass}>{item.currentVersion ? `v${item.currentVersion}` : "Not published"}</td>
                <td className={tdClass}><StatusPill tone={item.status === "changes_requested" ? "warn" : "info"}>{titleCase(item.status)}</StatusPill></td>
                <td className={tdClass}>{formatDateTime(item.respondedAt ?? item.publishedAt)}</td>
              </tr>
            ))}
            {queue.length === 0 ? <tr><td className={tdClass} colSpan={6}>No active review rounds. New Professional submissions will appear here.</td></tr> : null}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
