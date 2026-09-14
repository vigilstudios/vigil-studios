import type { Metadata } from "next";
import { Card, EmptyState, PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatDate, titleCase } from "@/lib/vigil/format";
import { getOrgChangeRequests, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { NewRequestForm } from "./NewRequestForm";
import { GatedFeature } from "@/components/vigil/GatedFeature";

export const metadata: Metadata = { title: "Requests" };

const tone: Record<string, "neutral" | "good" | "warn" | "bad" | "info"> = {
  draft: "neutral",
  submitted: "info",
  triaged: "info",
  in_progress: "info",
  delivered: "good",
  closed: "neutral",
  declined: "warn",
};

export default async function RequestsPage() {
  const ctx = await requireOrgContext("/dashboard/requests");
  const ent = await resolveEntitlements(ctx.organization.id);

  if (!ent.enabled(FEATURES.requests)) {
    return (
      <GatedFeature
        title="Website updates"
        description="Care and higher plans include website updates and content changes: you tell Vigil what to change, and it gets done."
        planHint="Available on Vigil Care, Growth and Priority."
      />
    );
  }

  const [requests, websites] = await Promise.all([getOrgChangeRequests(ctx.organization.id), getOrgWebsites(ctx.organization.id)]);
  const allowance = ent.limit(FEATURES.requestsMonthlyAllowance);

  return (
    <div>
      <PageHeader
        title="Requests"
        description={
          allowance !== null
            ? `Your plan includes ${allowance} request${allowance === 1 ? "" : "s"} per month.`
            : "Tell Vigil what to change on your website."
        }
      />

      <Card>
        <h2 className="text-base font-semibold">New request</h2>
        <NewRequestForm websites={websites.map((w) => ({ id: w.id, name: w.name }))} />
      </Card>

      <div className="mt-4">
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Your submitted requests and their progress will appear here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={thClass}>Request</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Priority</th>
                <th className={thClass}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className={tdClass}>{r.title}</td>
                  <td className={tdClass}>
                    <StatusPill tone={tone[r.status] ?? "neutral"}>{titleCase(r.status)}</StatusPill>
                  </td>
                  <td className={tdClass}>{titleCase(r.priority)}</td>
                  <td className={tdClass}>{formatDate(r.submitted_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
