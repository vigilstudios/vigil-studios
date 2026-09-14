import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calendar, FileCode2, Globe, HeartPulse, PenLine, ShieldCheck } from "lucide-react";
import { ResizableWidget } from "@/components/vigil/ResizableWidget";
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

  if (websites.length === 0) {
    const project = projects[0] ?? null;
    const step = project ? projectStepIndex(project.status) : null;
    const preview = previewSource(null, project?.template_slug ?? null);
    return (
      <div className="space-y-4">
        <Header canRequest={canRequest} />
        {project && step ? (
          <Panel title={project.name} action={<StatusPill tone={describeProjectStatus(project.status).tone}>{describeProjectStatus(project.status).label}</StatusPill>}>
            <p className="text-xs text-[color:var(--text-secondary)]">Your website appears here once it is published. Until then, this page tracks the build.</p>
            <div className="mt-4">
              <Stepper steps={projectSteps} current={step.current} done={step.done} />
            </div>
            {preview.kind !== "none" ? (
              <div className="mt-4">
                <ResizableWidget storageKey="website-preview" defaultWidth={560}>
                  <SiteFrame src={preview.src} address={preview.address} title={`${project.name} preview`} />
                </ResizableWidget>
                <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">The template your site is built from; your content replaces this as the build progresses.</p>
              </div>
            ) : null}
          </Panel>
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

          return (
            <Panel
              key={site.id}
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
                <div className="mb-4">
                  <StatusLine tone={status.tone} label={status.label} hint={site.status_reason ?? status.hint} size="sm" />
                </div>
              ) : null}

              <div className="flex flex-wrap items-start gap-4">
                {preview.kind !== "none" ? (
                  <div className="min-w-0 max-w-full">
                    <ResizableWidget storageKey={`website-preview:${site.id}`} defaultWidth={520}>
                      <SiteFrame src={preview.src} address={preview.address} title={`${site.name} preview`} />
                    </ResizableWidget>
                    <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">
                      {preview.kind === "template" ? "The template your site is built from; your content replaces this as the build progresses." : "Live view. Drag the edge to resize."}
                    </p>
                  </div>
                ) : null}

                <div className="grid min-w-0 flex-1 basis-72 grid-cols-2 gap-3">
                  <Tile icon={<Globe className="h-4 w-4" />} label="Live address" value={site.live_url ? site.live_url.replace(/^https?:\/\//, "") : "Not published yet"} tone={site.live_url ? "good" : "neutral"} href={site.live_url ?? undefined} />
                  <Tile icon={<ShieldCheck className="h-4 w-4" />} label="SSL and security" value={isLive ? "Active" : "Pending"} tone={isLive ? "good" : "neutral"} hint={isLive ? "Certificate managed by Vigil" : "Activates when the site goes live"} />
                  <Tile icon={<Calendar className="h-4 w-4" />} label="Last published" value={lastPublish ? formatRelative(lastPublish.finished_at ?? lastPublish.created_at) : site.last_deployed_at ? formatRelative(site.last_deployed_at) : "—"} hint={lastPublish ? formatDate(lastPublish.finished_at ?? lastPublish.created_at) : undefined} />
                  <Tile icon={<HeartPulse className="h-4 w-4" />} label="Health" value={site.health_ok === null ? "Not checked yet" : site.health_ok ? "Healthy" : "Needs attention"} tone={site.health_ok === null ? "neutral" : site.health_ok ? "good" : "bad"} hint={site.last_health_at ? `Checked ${formatRelative(site.last_health_at)}` : "Automatic checks start once live"} />
                  <Tile icon={<FileCode2 className="h-4 w-4" />} label="Site code" value={site.code_ownership === "customer_owned" ? "Yours" : "Vigil"} hint={site.export_eligible ? "Export eligible" : "Not export eligible"} />
                  <Tile icon={<PenLine className="h-4 w-4" />} label="Changes" value={canRequest ? "Included in your plan" : "Care plan and up"} tone={canRequest ? "good" : "neutral"} href="/dashboard/requests" hint={canRequest ? "Submit a request any time" : "See what your plan includes"} />
                </div>
              </div>
            </Panel>
          );
        })
      )}
    </div>
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

function Tile({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
  href?: string;
}) {
  const color = tone === "neutral" ? "var(--text-secondary)" : `var(--status-${tone})`;
  const body = (
    <>
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-secondary)]">
        <span style={{ color }}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold" title={value}>{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-[color:var(--text-secondary)]">{hint}</p> : null}
    </>
  );
  const cls = "flex min-w-0 flex-col rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3";
  if (href) {
    const external = href.startsWith("http");
    return external ? (
      <a href={href} target="_blank" rel="noreferrer" className={`${cls} transition-colors hover:border-[color:var(--accent)]`}>{body}</a>
    ) : (
      <Link href={href} className={`${cls} transition-colors hover:border-[color:var(--accent)]`}>{body}</Link>
    );
  }
  return <div className={cls}>{body}</div>;
}
