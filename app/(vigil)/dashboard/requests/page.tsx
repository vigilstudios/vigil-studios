import type { Metadata } from "next";
import { AttachmentList } from "@/components/vigil/AttachmentList";
import { GatedFeature } from "@/components/vigil/GatedFeature";
import { EmptyState, StatusPill } from "@/components/vigil/ui";
import { Panel } from "@/components/vigil/widgets";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatDate, titleCase } from "@/lib/vigil/format";
import { getOrgChangeRequests, getOrgWebsites, signAttachments } from "@/lib/vigil/queries/dashboard";
import { NewRequestForm } from "./NewRequestForm";

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

const statusHint: Record<string, string> = {
  submitted: "Received. Vigil will pick this up shortly.",
  triaged: "Reviewed and scheduled.",
  in_progress: "Being worked on now.",
  delivered: "Done. Have a look and reply if anything is off.",
  declined: "Vigil could not take this on as described; check your email.",
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
  const signed = await Promise.all(requests.map((r) => signAttachments(r.attachments)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Requests</h1>
        <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
          {allowance !== null ? `Your plan includes ${allowance} request${allowance === 1 ? "" : "s"} per month. ` : ""}
          Tell Vigil what to change on your website; attach screenshots or files if that helps explain it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5" title="New request">
          <NewRequestForm websites={websites.map((w) => ({ id: w.id, name: w.name }))} />
        </Panel>

        <Panel className="lg:col-span-7" title={`Your requests${requests.length ? ` · ${requests.length}` : ""}`} padded={false}>
          {requests.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No requests yet" description="Your submitted requests and their progress will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {requests.map((r, i) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{r.title}</p>
                      <p className="mt-0.5 text-[11px] text-[color:var(--text-secondary)]">
                        {titleCase(r.priority)} priority · {formatDate(r.submitted_at ?? r.created_at)}
                        {r.website_id ? ` · ${websites.find((w) => w.id === r.website_id)?.name ?? ""}` : ""}
                      </p>
                    </div>
                    <StatusPill tone={tone[r.status] ?? "neutral"}>{titleCase(r.status)}</StatusPill>
                  </div>
                  {r.description ? <p className="mt-2 whitespace-pre-wrap text-xs text-[color:var(--text-secondary)]">{r.description}</p> : null}
                  {statusHint[r.status] ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">{statusHint[r.status]}</p> : null}
                  {signed[i].length > 0 ? (
                    <div className="mt-2">
                      <AttachmentList items={signed[i]} compact />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
