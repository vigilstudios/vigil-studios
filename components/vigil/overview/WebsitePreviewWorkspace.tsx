import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Box, Check, FileCode2, Globe2, HeartPulse, Info, Layers3, MessageSquareText, Monitor, Paintbrush, PenLine, Rocket, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { DashboardSiteFrame } from "@/components/vigil/DashboardSiteFrame";
import { DownloadSiteButton } from "@/components/vigil/DownloadSiteButton";
import { ExpressPreviewDecision } from "@/components/vigil/ExpressPreviewDecision";
import type { Domain, Project, Website } from "@/lib/vigil/types";
import type { getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import type { ExpressPreviewReview } from "@/lib/vigil/express-preview-review";
import type { ProjectReviews } from "@/lib/vigil/queries/reviews";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeProjectStatus, describeWebsiteStatus, type CustomerStatus } from "@/lib/vigil/lifecycle";
import type { PreviewSource } from "@/lib/vigil/presenters";
import { previewProgress } from "@/lib/vigil/overview/preview-model";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import { PreviewCard, PreviewStatus } from "./preview-ui";
import "./overview.css";
import "./preview-overview.css";
import "./website-preview.css";

export type WebsitePreviewWorkspaceProps = {
  website: Website | null;
  project: Project | null;
  domain: Domain | null;
  preview: PreviewSource;
  accent: string | null;
  deployments: Awaited<ReturnType<typeof getRecentDeployments>>;
  professionalReview: ProjectReviews | null;
  expressReview: ExpressPreviewReview | null;
  canExport: boolean;
  canRequest: boolean;
  planActive: boolean;
};

/** Presentation only: authorization, website selection and reads stay in the route. */
export function WebsitePreviewWorkspace({ website, project, domain, preview, accent, deployments, professionalReview, expressReview, canExport, canRequest, planActive }: WebsitePreviewWorkspaceProps) {
  const id = website?.id ?? project?.id ?? "new";
  const name = website?.name ?? project?.name ?? "Your website";
  const tier = project ? WEBSITE_TIERS[project.kind] : null;
  const domainHref = website ? `/dashboard/domain?website=${website.id}` : "/dashboard/domain";
  const domainReady = Boolean(domain?.status === "connected" && domain.dns_ok && domain.ssl_ok);
  const progress = previewProgress({ project, hasPreview: preview.kind === "live", reviews: professionalReview?.rounds ?? (expressReview ? [expressReview] : []), domainReady, domainHref, planActive });
  const projectStatus = describeProjectStatus(progress.stage);
  const issue = website && ["error", "paused", "suspended"].includes(website.status) ? describeWebsiteStatus(website.status) : null;
  const status: CustomerStatus = issue ?? (preview.kind === "live" ? { label: "Build preview ready", tone: "good" } : preview.kind === "template" ? { label: "Selected design", tone: "neutral" } : { label: "Design in progress", tone: "info" });
  const showExpressDecision = Boolean(website && preview.kind === "live" && expressReview && expressReview.status !== "pending");
  const professionalReviewAvailable = Boolean(project?.kind === "professional" && (project.status === "review" || professionalReview?.rounds.some(round => round.status !== "pending")));
  const latestPublish = deployments.find(deployment => deployment.environment === "production" && deployment.status === "ready");
  const exportable = Boolean(website?.export_eligible && website.code_ownership === "customer_owned");
  const healthChecked = Boolean(website?.last_health_at && website.health_ok !== null);
  const samePageAction = progress.next.href === "/dashboard/website";

  return (
    <article className="wp-workspace" id={`website-${id}`} aria-label={`${name} preview workspace`}>
      <div className="wp-site-layout">
        <PreviewCard id={`${id}-canvas`} title={name} icon={<Monitor />} className="ov-card-website wp-canvas-card" style={{ "--website-accent": accent ?? "var(--ov-neutral-tint)" } as CSSProperties} action={<PreviewStatus status={status} />}>
          <div className="wp-preview-heading"><span className="pv-label">{preview.kind === "template" ? "Your selected Express design" : preview.kind === "live" ? "Current build" : "Your first look"}</span>{tier ? <span className="wp-tier">{tier.name}</span> : null}</div>
          <div className="wp-stage">
            {preview.kind === "none" ? <div className="wp-empty-preview"><div className="wp-empty-layout" aria-hidden="true"><span /><div /><section><i /><i /><i /></section></div><Paintbrush size={23} aria-hidden="true" /><h3>A first look, made for your business</h3><p>{progress.intakeNeeded ? "Send your brief to give the team everything they need to start your design." : "Vigil is shaping your website. The first build will appear here when it is ready."}</p></div> : <div className="wp-frame"><DashboardSiteFrame key={`${id}:${preview.src}`} src={preview.src} address={preview.address} title={`${name} website preview`} /></div>}
          </div>
          <div className="wp-canvas-footer"><p><Info size={13} aria-hidden="true" />{preview.kind === "template" ? "Example design. Your brand, photos and content replace this sample during the build." : preview.kind === "live" ? "Your current build, separate from your public website. Use the desktop and phone controls to check both views." : "Your preview will support desktop and phone views as soon as a build is available."}</p>{preview.kind === "live" ? <a className="ov-button" href={preview.src} target="_blank" rel="noreferrer">Open full preview<ArrowUpRight size={13} /></a> : null}</div>
          {issue ? <div className="wp-site-warning" role="status"><TriangleAlert size={14} /><p>{website?.status_reason ?? issue.hint ?? issue.label}</p></div> : null}
        </PreviewCard>

        <div className="wp-side">
          <PreviewCard id={`${id}-decision`} title={showExpressDecision || professionalReviewAvailable ? "Design review" : "What happens next"} icon={showExpressDecision || professionalReviewAvailable ? <MessageSquareText /> : <Sparkles />} className="ov-card-insights wp-next-card">
            {showExpressDecision && website && expressReview ? <ExpressPreviewDecision websiteId={website.id} review={expressReview} appearance="embedded" /> : <>
              <span className="pv-label pv-accent">{progress.next.owner}</span>
              <h3 className="wp-next-title">{progress.next.title}</h3>
              <p className="pv-copy">{progress.next.description}</p>
              {progress.next.href === "/dashboard/review" ? <Link href="/dashboard/review" className="btn-primary wp-primary-action">Open design review<ArrowRight size={14} /></Link> : samePageAction && preview.kind === "live" ? <a href={preview.src} target="_blank" rel="noreferrer" className="btn-primary wp-primary-action">Open full preview<ArrowUpRight size={14} /></a> : <Link href={samePageAction ? "/dashboard/onboarding" : progress.next.href} className="btn-primary wp-primary-action">{samePageAction ? "View your brief" : progress.next.label}<ArrowRight size={14} /></Link>}
            </>}
            {showExpressDecision && expressReview?.status === "approved" && !samePageAction ? <Link href={progress.next.href} className="ov-button wp-card-link">{progress.next.label}<ArrowRight size={13} /></Link> : null}
            {project?.kind === "professional" ? <div className="wp-review-rounds">{[1, 2].map(number => { const round = professionalReview?.rounds.find(item => item.number === number); return <div key={number}><span className={`wp-round-mark${round?.status === "approved" ? " is-approved" : ""}`}>{round?.status === "approved" ? <Check size={12} /> : number}</span><span>{number === 1 ? "Design direction" : "Full-site review"}</span><small>{round?.status === "approved" ? "Approved" : round?.status === "awaiting_feedback" ? "Your review" : round?.status === "changes_requested" || round?.status === "revision_in_progress" ? "Revisions" : "Upcoming"}</small></div>; })}</div> : null}
            {project?.kind === "custom" ? <p className="wp-scope-note">Design reviews and revisions follow your agreed project scope.</p> : null}
          </PreviewCard>

          <PreviewCard id={`${id}-tools`} title="Website tools" icon={<FileCode2 />}>
            <div className="wp-tool"><div><PenLine size={15} /><span>Ongoing website updates</span></div><p className="pv-small">{canRequest ? "Your plan includes ongoing change requests." : "Ongoing care is available with Care or higher. Included project revisions stay in your design review."}</p><Link className="ov-text-link" href={canRequest ? "/dashboard/requests" : "/dashboard/billing"}>{canRequest ? "Request a change" : "View plans"}<ArrowUpRight size={12} /></Link></div>
            {website ? <div className="wp-tool"><div><FileCode2 size={15} /><span>Website code</span><small>{website.code_ownership === "customer_owned" ? "Yours" : "Vigil"}</small></div>{exportable ? canExport ? <DownloadSiteButton websiteId={website.id} /> : <p className="pv-small">Owners and managers can download this website.</p> : <p className="pv-small">Export is not enabled for this website.</p>}</div> : null}
          </PreviewCard>
        </div>
      </div>

      <div className="wp-detail-row">
        <PreviewCard id={`${id}-project`} title="Build details" icon={<Layers3 />} action={<PreviewStatus status={projectStatus} />}>
          <dl className="wp-detail-list"><div><dt>Website build</dt><dd>{tier?.name ?? "In progress"}</dd></div><div><dt>Started</dt><dd>{project ? formatDate(project.created_at) : "Being arranged"}</dd></div><div><dt>Target launch</dt><dd>{project?.launch_target ? formatDate(project.launch_target) : "To be scheduled"}</dd></div><div><dt>Last published</dt><dd>{latestPublish ? formatRelative(latestPublish.finished_at ?? latestPublish.created_at) : "Not published yet"}</dd></div></dl>
          <Link href="/dashboard/onboarding" className="ov-text-link wp-card-link">{progress.intakeNeeded ? "Continue your brief" : "View project brief"}<ArrowUpRight size={12} /></Link>
        </PreviewCard>

        <PreviewCard id={`${id}-connection`} title="Connection checks" icon={<ShieldCheck />} action={<Link href={domainHref} className="ov-text-link">Domain<ArrowUpRight size={12} /></Link>}>
          <p className="wp-domain-name">{domain?.hostname ?? "Domain not connected"}</p>
          <ul className="wp-checks"><li><Globe2 size={13} /><span>Domain / DNS</span><small className={domain?.dns_ok ? "pv-accent" : "pv-muted"}>{domain?.dns_ok ? "Passed" : "Pending"}</small></li><li><ShieldCheck size={13} /><span>HTTPS / SSL</span><small className={domain?.ssl_ok ? "pv-accent" : "pv-muted"}>{domain?.ssl_ok ? "Passed" : "Pending"}</small></li><li><HeartPulse size={13} /><span>Availability</span><small className={healthChecked && website?.health_ok ? "pv-accent" : "pv-muted"}>{healthChecked ? website?.health_ok ? "Healthy" : "Needs attention" : "Not checked yet"}</small></li></ul>
          {!domainReady ? <Link href={domainHref} className="pv-domain-attention wp-card-link"><TriangleAlert size={13} />Complete domain setup<ArrowRight size={12} /></Link> : <p className="pv-small">Domain checks are recorded separately from vulnerability monitoring.</p>}
        </PreviewCard>

        <PreviewCard id={`${id}-releases`} title="Build history" icon={<Box />} action={<span className="pv-small">Latest updates</span>}>
          {deployments.length ? <ol className="wp-releases">{deployments.slice(0, 4).map(deployment => <li key={deployment.id}><span className="wp-release-icon"><Box size={14} /></span><div><p>{deployment.environment === "production" ? "Production build" : "Preview build"}</p><time dateTime={deployment.finished_at ?? deployment.created_at}>{formatRelative(deployment.finished_at ?? deployment.created_at)}</time></div><PreviewStatus status={releaseStatus(deployment.status)} /></li>)}</ol> : <div className="wp-history-empty"><Rocket size={22} aria-hidden="true" /><p>Your first build is ahead</p><span>New previews and published versions will be recorded here.</span></div>}
        </PreviewCard>
      </div>
    </article>
  );
}

function releaseStatus(status: string): CustomerStatus {
  switch (status) {
    case "ready": return { label: "Ready", tone: "good" };
    case "building": return { label: "Building", tone: "info" };
    case "queued": return { label: "Queued", tone: "neutral" };
    case "error": return { label: "Failed", tone: "bad" };
    default: return { label: "Cancelled", tone: "neutral" };
  }
}
