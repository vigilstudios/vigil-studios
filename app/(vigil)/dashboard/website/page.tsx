import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calendar, FileCode2, Globe, HeartPulse, PenLine, ShieldCheck } from "lucide-react";
import { AttributeWidget, WidgetLink } from "@/components/vigil/AttributeWidget";
import { DownloadSiteButton } from "@/components/vigil/DownloadSiteButton";
import { SiteFrame } from "@/components/vigil/SiteFrame";
import { EmptyState, StatusPill } from "@/components/vigil/ui";
import { Panel, StatusLine, Stepper } from "@/components/vigil/widgets";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeProjectStatus, describeWebsiteStatus } from "@/lib/vigil/lifecycle";
import { previewSource, projectStepIndex, projectSteps } from "@/lib/vigil/presenters";
import { getOrgProjects, getOrgWebsites, getRecentDeployments } from "@/lib/vigil/queries/dashboard";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const ctx = await requireOrgContext("/dashboard/website");
  const [websites, projects, ent] = await Promise.all([
    getOrgWebsites(ctx.organization.id),
    getOrgProjects(ctx.organization.id),
    resolveEntitlements(ctx.organization.id),
  ]);
  const canRequest = ent.enabled(FEATURES.requests);
  const canExport = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;

  if (websites.length === 0) {
    const project = projects[0] ?? null;
    const step = project ? projectStepIndex(project.status) : null;
    const preview = previewSource(null, project?.template_slug ?? null);
    return (
      <div className="space-y-4">
        <Header canRequest={canRequest} />
        {project && step ? (
          <>
            <Panel title={project.name} action={<StatusPill tone={describeProjectStatus(project.status).tone}>{describeProjectStatus(project.status).label}</StatusPill>}>
              <p className="text-xs text-[color:var(--text-secondary)]">Your website appears here once it is published. Until then, this page tracks the build.</p>
              <div className="mt-4">
                <Stepper steps={projectSteps} current={step.current} done={step.done} />
              </div>
            </Panel>
            {preview.kind !== "none" ? <PreviewWidget src={preview.src} address={preview.address} title={`${project.name} preview`} note="The template your site is built from; your content replaces this as the build progresses." /> : null}
          </>
        ) : (
          <EmptyState title="No website yet" description="When Vigil Studios starts building your site, its status will show here." />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header canRequest={canRequest} />
      {await Promise.all(
        websites.map(async (site) => {
          const status = describeWebsiteStatus(site.status);
          const deployments = await getRecentDeployments(site.id);
          const lastPublish = deployments.find((d) => d.environment === "production" && d.status === "ready") ?? null;
          const project = projects.find((p) => p.id === site.project_id) ?? null;
          const preview = previewSource(site, project?.template_slug ?? null);
          const isLive = site.status === "live";
          const exportable = site.export_eligible && site.code_ownership === "customer_owned";

          return (
            <div key={site.id} className="space-y-4">
              {/* Website widget */}
              <Panel
                title={site.name}
                action={
                  <div className="flex items-center gap-2">
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    {site.live_url ? (
                      <a href={site.live_url} target="_blank" rel="noreferrer" className="btn-secondary !px-2.5 !py-1 text-xs">
                        Open site <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                }
              >
                {site.status_reason || status.hint ? (
                  <div className="mb-3">
                    <StatusLine tone={status.tone} label={status.label} hint={site.status_reason ?? status.hint} size="sm" />
                  </div>
                ) : null}
                {preview.kind !== "none" ? (
                  <>
                    <div className="mx-auto w-full max-w-[760px]">
                      <SiteFrame src={preview.src} address={preview.address} title={`${site.name} preview`} />
                    </div>
                    <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)]">
                      {preview.kind === "template" ? "The template your site is built from; your content replaces this as the build progresses." : "Live view of your published site."}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[color:var(--text-secondary)]">A preview appears once your site is being built.</p>
                )}
              </Panel>

              {/* Attribute widgets — each its own card */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AttributeWidget
                  icon={<Globe className="h-4 w-4" />}
                  label="Live address"
                  value={site.live_url ? site.live_url.replace(/^https?:\/\//, "") : "Not published yet"}
                  tone={site.live_url ? "good" : "neutral"}
                  hint={site.live_url ? "Where visitors find your site" : "Assigned when the site is published"}
                  action={site.live_url ? <WidgetLink href={site.live_url} external>Open site</WidgetLink> : undefined}
                />
                <AttributeWidget
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="SSL and security"
                  value={isLive ? "Active" : "Pending"}
                  tone={isLive ? "good" : "neutral"}
                  hint={isLive ? "Certificate issued and renewed by Vigil" : "Activates when the site goes live"}
                />
                <AttributeWidget
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last published"
                  value={lastPublish ? formatRelative(lastPublish.finished_at ?? lastPublish.created_at) : site.last_deployed_at ? formatRelative(site.last_deployed_at) : "Not yet"}
                  hint={lastPublish ? formatDate(lastPublish.finished_at ?? lastPublish.created_at) : "The date of the first publish will appear here"}
                />
                <AttributeWidget
                  icon={<HeartPulse className="h-4 w-4" />}
                  label="Health"
                  value={site.health_ok === null ? "Not checked yet" : site.health_ok ? "Healthy" : "Needs attention"}
                  tone={site.health_ok === null ? "neutral" : site.health_ok ? "good" : "bad"}
                  hint={site.last_health_at ? `Checked ${formatRelative(site.last_health_at)}` : "Automatic checks start once the site is live"}
                />
                <AttributeWidget
                  icon={<FileCode2 className="h-4 w-4" />}
                  label="Site code"
                  value={site.code_ownership === "customer_owned" ? "Yours" : "Vigil"}
                  tone={exportable ? "good" : "neutral"}
                  hint={exportable ? "Download a copy of your site any time" : "This site is not eligible for export"}
                  action={exportable ? (canExport ? <DownloadSiteButton websiteId={site.id} /> : <span className="text-[11px] text-[color:var(--text-secondary)]">Owners and managers can download</span>) : undefined}
                />
                <AttributeWidget
                  icon={<PenLine className="h-4 w-4" />}
                  label="Changes"
                  value={canRequest ? "Included" : "Care plan and up"}
                  tone={canRequest ? "good" : "neutral"}
                  hint={canRequest ? "Tell Vigil what to change; it gets done" : "See what your plan includes"}
                  action={<WidgetLink href="/dashboard/requests" primary={canRequest}>{canRequest ? "Request a change" : "View plans"}</WidgetLink>}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function PreviewWidget({ src, address, title, note }: { src: string; address: string; title: string; note: string }) {
  return (
    <Panel title="Preview">
      <div className="mx-auto w-full max-w-[760px]">
        <SiteFrame src={src} address={address} title={title} />
      </div>
      <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)]">{note}</p>
    </Panel>
  );
}

function Header({ canRequest }: { canRequest: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Website</h1>
        <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Status of the website Vigil hosts and operates for you.</p>
      </div>
      <Link href="/dashboard/requests" className="btn-primary !px-3 !py-2 text-xs">
        <PenLine className="mr-1.5 h-3.5 w-3.5" />
        {canRequest ? "Request a change" : "Website changes"}
      </Link>
    </div>
  );
}
