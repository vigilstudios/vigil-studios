import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm, TransitionSelect } from "@/components/vigil/ActionControls";
import { Card, DefinitionList, PageHeader, StatusPill, Table, inputClass, labelClass, tdClass, thClass } from "@/components/vigil/ui";
import { enqueueDomainJob, enqueueWebsiteJob, setWebsiteStatus, updateWebsiteFields } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDateTime, titleCase } from "@/lib/vigil/format";
import { websiteTransitions } from "@/lib/vigil/lifecycle";
import { getWebsiteDetail } from "@/lib/vigil/queries/admin";
import { AVAILABLE_EXPRESS_TEMPLATES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getExpressPreviewReview } from "@/lib/vigil/express-preview-review";
import { getReviewDeployReadiness } from "@/lib/vigil/project-reviews";

export const metadata: Metadata = { title: "Website" };

export default async function WebsiteDetailPage({ params }: { params: Promise<{ websiteId: string }> }) {
  await requireStaff();
  const { websiteId } = await params;
  const detail = await getWebsiteDetail(websiteId);
  if (!detail) notFound();
  const { website: w, deployments, domains, links, jobs } = detail;
  const repository = links.find((link) => link.resource_kind === "repository");
  const repositoryUrl = (repository?.metadata as { html_url?: string } | undefined)?.html_url;
  const supabase = await createClient();
  const [launchReadiness, expressReview] = await Promise.all([
    getReviewDeployReadiness(supabase, w.id),
    w.project?.kind === "express" ? getExpressPreviewReview(supabase, w.id) : Promise.resolve(null),
  ]);
  const previewDisabledReason = repositoryUrl ? undefined : "Create the repository first.";
  const liveDisabledReason = !repositoryUrl ? "Create the repository first." : !launchReadiness.allowed ? launchReadiness.reason ?? "Customer approval is required." : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Website"
        title={w.name}
        description={
          <>
            <Link href={`/admin/organizations/${w.organization?.id}`} className="underline">{w.organization?.name}</Link>
            {w.project ? <> · project {w.project.name} ({titleCase(w.project.status)})</> : null}
          </>
        }
        actions={<StatusPill tone={w.status === "live" ? "good" : w.status === "error" ? "bad" : "info"}>{titleCase(w.status)}</StatusPill>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Lifecycle</h2>
          {w.status_reason ? <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Customer sees: “{w.status_reason}”</p> : null}
          <div className="mt-3">
            <TransitionSelect current={w.status} options={websiteTransitions[w.status]} action={setWebsiteStatus.bind(null, w.id)} withReason />
          </div>
          <h3 className="mt-5 text-sm font-semibold">Repository &amp; publishing</h3>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">The private customer repository is created once. Deploy live publishes the latest main branch to Vercel and connects any attached domain.</p>
          <div className="mt-2 flex flex-wrap items-start gap-2">
            {repositoryUrl ? <a className="btn-secondary text-sm !px-3 !py-1.5" href={repositoryUrl} target="_blank" rel="noreferrer">Open repository</a> : <ActionButton action={enqueueWebsiteJob.bind(null, w.id, "website.repository")}>Create repository</ActionButton>}
            {w.project?.kind === "professional" ? <Link className="btn-secondary text-sm !px-3 !py-1.5" href={`/admin/reviews/${w.project.id}`}>Open review workspace</Link> : null}
            <ActionButton className="w-36 justify-center" disabled={!repositoryUrl} disabledReason={previewDisabledReason} action={enqueueWebsiteJob.bind(null, w.id, "website.deploy", "preview")}>Deploy preview</ActionButton>
            <ActionButton className="w-36 justify-center" disabled={Boolean(liveDisabledReason)} disabledReason={liveDisabledReason} variant="primary" action={enqueueWebsiteJob.bind(null, w.id, "website.deploy")} confirmText="Deploy the latest main branch to the live site?">Deploy live</ActionButton>
          </div>
          {expressReview ? (
            <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-sm">
              <p className="font-semibold">Express customer review</p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                {expressReview.status === "awaiting_feedback" ? "Waiting for the customer to approve the preview or use their included revision." : expressReview.status === "approved" ? "The customer approved the latest preview. Live deployment is unlocked." : expressReview.status === "changes_requested" ? "The customer requested their included revision. Update the repository, then deploy a new preview." : expressReview.status === "revision_in_progress" ? "Revision work is in progress." : "Deploy a preview to start customer review."}
              </p>
              {expressReview.feedback ? <p className="mt-2 whitespace-pre-wrap rounded-md bg-[color:var(--bg-primary)] p-2 text-xs"><span className="font-semibold">Customer request:</span> {expressReview.feedback}</p> : null}
              <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Revision used: {expressReview.changesUsed} of 1</p>
            </div>
          ) : null}
          <h3 className="mt-5 text-sm font-semibold">Provider links</h3>
          <ul className="mt-1 text-xs">
            {links.map((l) => (
              <li key={`${l.provider}:${l.resource_kind}:${l.external_id}`} className="font-mono">
                {l.provider}/{l.resource_kind}: {(l.metadata as { full_name?: string } | null)?.full_name ?? l.external_id}
              </li>
            ))}
            {links.length === 0 ? <li className="text-[color:var(--text-secondary)]">None yet.</li> : null}
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Details</h2>
          <ActionForm action={updateWebsiteFields.bind(null, w.id)} submitLabel="Save" className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={w.name} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass} htmlFor="live_url">Live URL</label>
              <input id="live_url" name="live_url" defaultValue={w.live_url ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="preview_url">Preview URL</label>
              <input id="preview_url" name="preview_url" defaultValue={w.preview_url ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="template_slug">Template slug</label>
              <select id="template_slug" name="template_slug" defaultValue={w.template_slug ?? ""} className={inputClass}>
                <option value="">No template</option>
                {AVAILABLE_EXPRESS_TEMPLATES.map((template) => (
                  <option key={template.slug} value={template.slug}>
                    {template.slug} · {template.industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="hosting_mode">Hosting mode</label>
              <input id="hosting_mode" name="hosting_mode" defaultValue={w.hosting_mode ?? ""} placeholder="undecided" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="repository_ref">Repository ref</label>
              <input id="repository_ref" name="repository_ref" defaultValue={w.repository_ref ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="code_ownership">Code ownership</label>
              <select id="code_ownership" name="code_ownership" defaultValue={w.code_ownership} className={inputClass}>
                <option value="customer_owned">Customer owned</option>
                <option value="vigil_owned">Vigil owned</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="export_eligible" defaultChecked={w.export_eligible} /> Export eligible
            </label>
          </ActionForm>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Domains</h2>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Hostname</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>DNS / SSL</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.id}>
                <td className={tdClass}>{d.hostname}</td>
                <td className={tdClass}>{titleCase(d.status)}</td>
                <td className={tdClass}>{d.dns_ok == null ? "Not checked" : d.dns_ok ? "ok" : "bad"} / {d.ssl_ok ? "ok" : "Not checked"}</td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <ActionButton action={enqueueDomainJob.bind(null, d.id, "domain.connect")}>Queue connect</ActionButton>
                    <ActionButton action={enqueueDomainJob.bind(null, d.id, "domain.verify")}>Queue verify</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {domains.length === 0 ? <tr><td className={tdClass} colSpan={4}>No domains attached.</td></tr> : null}
          </tbody>
        </Table>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Deployments</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {deployments.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">{d.environment} · {d.url ?? "no url"}</span>
                <span className="shrink-0 text-xs">{d.status} · {formatDateTime(d.created_at)}</span>
              </li>
            ))}
            {deployments.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">None.</li> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Jobs</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {jobs.map((j) => (
              <li key={j.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span>{j.kind} · {j.attempts}/{j.max_attempts}</span>
                  <StatusPill tone={j.status === "succeeded" ? "good" : j.status === "failed" ? "bad" : "info"}>{j.status}</StatusPill>
                </div>
                {j.error ? <div className="mt-1 text-xs text-[#ef4444]">{(j.error as { message?: string }).message}</div> : null}
              </li>
            ))}
            {jobs.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">None.</li> : null}
          </ul>
          <DefinitionList items={[{ label: "Last deployed", value: formatDateTime(w.last_deployed_at) }, { label: "Health", value: w.health_ok == null ? "Unknown" : w.health_ok ? "OK" : "Failing" }]} />
        </Card>
      </div>
    </div>
  );
}
