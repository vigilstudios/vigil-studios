import type { CSSProperties } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, Box, CalendarDays, Check, CheckCheck, ChevronDown, Circle, ClipboardList, CreditCard, FileText, Globe2, Layers3, Monitor, Paintbrush, Rocket, Route, Sparkles, TriangleAlert } from "lucide-react";
import { DashboardSiteFrame } from "@/components/vigil/DashboardSiteFrame";
import type { Domain, Project, Website } from "@/lib/vigil/types";
import type { getOrgSubscription, getRecentActivity, getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import type { ProjectReviews } from "@/lib/vigil/queries/reviews";
import type { ExpressPreviewReview } from "@/lib/vigil/express-preview-review";
import { PreviewCard as Card, PreviewStatus as Status } from "./preview-ui";
import { describeDomainStatus, describeProjectStatus, describeSubscriptionStatus, describeWebsiteStatus } from "@/lib/vigil/lifecycle";
import { formatDate, formatRelative, humanizeAction } from "@/lib/vigil/format";
import { auditTone, projectSteps, templateName, type PreviewSource } from "@/lib/vigil/presenters";
import { previewProgress } from "@/lib/vigil/overview/preview-model";
import { briefCompletion, parseBrief } from "@/lib/vigil/onboarding/brief";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import "./overview.css";
import "./preview-overview.css";

type Props = {
  organizationName: string;
  website: Website | null;
  project: Project | null;
  domain: Domain | null;
  subscription: Awaited<ReturnType<typeof getOrgSubscription>>;
  activity: Awaited<ReturnType<typeof getRecentActivity>>;
  deployments: Awaited<ReturnType<typeof getRecentDeployments>>;
  preview: PreviewSource;
  previewAccent: string | null;
  professionalReview: ProjectReviews | null;
  expressReview: ExpressPreviewReview | null;
  domainIntents: { id: string; websiteId: string; hostname: string }[];
  features: { label: string; enabled: boolean }[];
};

/** The same card system as the live overview, focused on the journey to launch. */
export function PreviewOverview({ organizationName, website, project, domain, subscription, activity, deployments, preview, previewAccent, professionalReview, expressReview, domainIntents, features }: Props) {
  const tier = project ? WEBSITE_TIERS[project.kind] : null;
  const domainHref = website ? `/dashboard/domain?website=${website.id}` : "/dashboard/domain";
  const reviewRounds = professionalReview?.rounds ?? (expressReview ? [expressReview] : []);
  const progress = previewProgress({
    project, hasPreview: preview.kind === "live", reviews: reviewRounds,
    domainReady: Boolean(domain?.status === "connected" && domain.dns_ok && domain.ssl_ok),
    planActive: Boolean(subscription && ["active", "trialing"].includes(subscription.status)), domainHref,
  });
  const projectStatus = project ? describeProjectStatus(progress.stage) : null;
  const websiteIssue = website && ["error", "paused", "suspended"].includes(website.status) ? describeWebsiteStatus(website.status) : null;
  const subscriptionStatus = subscription ? describeSubscriptionStatus(subscription.status) : null;
  const verification = domain?.verification && typeof domain.verification === "object" && !Array.isArray(domain.verification) ? domain.verification : {};
  const domainStatus = domain ? describeDomainStatus(domain.status, { dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable: verification.connection_reachable === true, launchReady: verification.launch_ready === true }) : null;
  const completion = project ? briefCompletion(parseBrief(project.brief), project.kind) : [];
  const completed = completion.filter(part => part.done).length;
  const ready = progress.checks.filter(check => check.done).length;
  const latestRelease = deployments.find(deployment => deployment.status === "ready");
  const hostname = domain?.hostname ?? domainIntents[0]?.hostname;
  const designName = project?.kind === "express" ? templateName(website?.template_slug ?? project.template_slug) : tier?.name ?? "Your website";

  return (
    <div className="ov-dashboard pv-dashboard">
      <header className="ov-page-header">
        <h1 className="ov-eyebrow">{organizationName}<span>/</span>Overview</h1>
        <span className="pv-phase"><Circle size={7} fill="currentColor" aria-hidden="true" /> Pre-launch</span>
      </header>

      <div className="pv-top-row">
        <Card id="website" title="Your website" icon={<Monitor />} className="ov-card-website" style={{ "--website-accent": previewAccent ?? "var(--ov-neutral-tint)" } as CSSProperties}
          action={<Link href="/dashboard/website" className="ov-text-link">Website preview <ArrowUpRight size={13} /></Link>}>
          <div className="pv-website-workspace">
            <div className="pv-preview">
              {preview.kind === "none" ? (
                <div className="pv-preview-empty">
                  <div className="pv-wireframe" aria-hidden="true"><div /><span /><span /><section><i /><i /><i /></section></div>
                  <div><Paintbrush size={19} aria-hidden="true" /><strong>Your first look is on its way</strong><p>Your website will appear here as the design comes together.</p></div>
                </div>
              ) : <DashboardSiteFrame key={`${website?.id}:${preview.src}`} src={preview.src} address={preview.address} title={`${website?.name ?? project?.name ?? organizationName} preview`} />}
            </div>
            <aside className="pv-website-meta">
              <div className="pv-identity">
                <span className="pv-label">{preview.kind === "template" ? "Your selected design" : preview.kind === "live" ? "Build preview" : "Your future website"}</span>
                {preview.kind === "live" ? <a href={preview.src} target="_blank" rel="noreferrer" className="ov-website-url">{preview.address}<ArrowUpRight size={15} /></a> : <p className="ov-website-url">{preview.kind === "template" ? designName : organizationName}</p>}
              </div>
              <div className="pv-site-context">
                <p>{preview.kind === "template" ? "This is an example of your chosen Express design. Your brand, photos and content will make it yours." : preview.kind === "live" ? "Explore the current build on desktop or mobile. This preview is separate from your public website." : "A dedicated space for your website, from your first design preview to the day you go live."}</p>
                <dl className="pv-facts">
                  <div><dt>Website build</dt><dd>{tier?.name ?? "In progress"}</dd></div>
                  <div><dt>Project stage</dt><dd><Status status={projectStatus ?? { label: "Being prepared", tone: "info" }} /></dd></div>
                  <div><dt>Public address</dt><dd>{hostname ?? "Not connected yet"}</dd></div>
                </dl>
              </div>
              {websiteIssue ? <div className="pv-website-issue" role="status"><Status status={websiteIssue} /><p className="pv-small">{website?.status_reason ?? websiteIssue.hint}</p></div> : null}
              {preview.kind === "live" ? <a href={preview.src} target="_blank" rel="noreferrer" className="ov-button pv-open-preview">Open preview <ArrowUpRight size={13} /></a> : <Link href={progress.intakeNeeded ? "/dashboard/onboarding" : "/dashboard/website"} className="ov-text-link">{progress.intakeNeeded ? "Continue your brief" : "View project preview"}<ArrowRight size={13} /></Link>}
            </aside>
          </div>
          <div className="pv-plan">
            <CreditCard size={18} aria-hidden="true" />
            <div className="pv-plan-copy"><span className="pv-label">Your Vigil plan</span><strong>{subscription?.plan?.name ?? "Plan setup pending"}</strong><p>{subscription?.current_period_end ? `${subscription.cancel_at_period_end ? "Ends" : "Renews"} ${formatDate(subscription.current_period_end)}` : "Hosting, care and support for your website"}</p></div>
            {subscriptionStatus ? <Status status={subscriptionStatus} /> : null}
            <Link href="/dashboard/billing" className="ov-button">Manage plan <ArrowUpRight size={12} /></Link>
          </div>
        </Card>

        <div className="pv-side-stack">
          <Card id="next" title="Next step" icon={<Sparkles />} className="ov-card-insights">
            <span className="pv-label pv-accent">{progress.next.owner}</span>
            <h3 className="pv-next-title">{progress.next.title}</h3>
            <p className="pv-copy">{progress.next.description}</p>
            {progress.intakeNeeded ? <div className="pv-brief-progress"><div className="pv-progress-track" role="progressbar" aria-label="Brief sections completed" aria-valuenow={completed} aria-valuemax={completion.length}><span style={{ width: `${completion.length ? completed / completion.length * 100 : 0}%` }} /></div><span>{completed} of {completion.length} sections complete</span></div> : null}
            <Link href={progress.next.href} className="btn-primary pv-next-action">{progress.next.label}<ArrowRight size={14} /></Link>
          </Card>
          <Card id="readiness" title="Launch essentials" icon={<Rocket />} action={<span className="pv-small">{ready}/{progress.checks.length} ready</span>}>
            <ul className="pv-checklist">{progress.checks.map(check => <li key={check.id}><span className={`pv-check-icon${check.done ? " is-done" : ""}`}>{check.done ? <Check size={12} /> : <Circle size={10} />}</span><span>{check.label}</span><small>{check.done ? check.id === "approval" ? "Approved" : "Ready" : check.pending}</small></li>)}</ul>
          </Card>
        </div>
      </div>

      <div className="pv-bottom-row">
        <Card id="journey" title="Your project" icon={<Route />} action={projectStatus ? <Status status={projectStatus} /> : undefined}>
          <div className="pv-project-title"><h3>{project?.name ?? "Website setup"}</h3><Link href="/dashboard/onboarding" className="ov-text-link">{progress.intakeNeeded ? "Edit brief" : "View brief"}<ArrowUpRight size={12} /></Link></div>
          <ol className="pv-journey" aria-label="Project progress">{projectSteps.map((step, index) => {
            const done = !progress.step.cancelled && (index < progress.step.current || progress.step.done);
            const current = !progress.step.cancelled && index === progress.step.current;
            const Icon = [ClipboardList, FileText, Layers3, Paintbrush, CheckCheck, Rocket][index];
            return <li key={step.key} className={done ? "is-done" : current ? "is-current" : ""} aria-current={current ? "step" : undefined}><span className="pv-milestone">{done ? <Check size={15} /> : <Icon size={15} />}</span><span>{step.label}</span></li>;
          })}</ol>
          <dl className="pv-project-dates"><div><dt><CalendarDays size={12} />Started</dt><dd>{project ? formatDate(project.created_at) : "Being arranged"}</dd></div><div><dt><Rocket size={12} />Target launch</dt><dd>{project?.launch_target ? formatDate(project.launch_target) : "To be scheduled"}</dd></div><div><dt><Layers3 size={12} />Design approach</dt><dd>{project?.kind === "express" ? designName : project?.kind === "custom" ? "Bespoke, as scoped" : "Tailored to your brand"}</dd></div></dl>
          {project?.kind === "professional" && professionalReview?.rounds.some(round => round.status !== "pending") ? <Link className="ov-text-link pv-review-link" href="/dashboard/review">{professionalReview.rounds.filter(round => round.status === "approved").length} of 2 review rounds approved <ArrowUpRight size={12} /></Link> : null}
        </Card>

        <Card id="domain" title="Your domain" icon={<Globe2 />} action={<Link className="ov-text-link" href={domainHref}>Manage<ArrowUpRight size={12} /></Link>}>
          <p className="pv-domain-name">{hostname ?? "A home for your website"}</p>
          {domainStatus ? <Status status={domainStatus} /> : <p className="pv-copy">{domainIntents.length ? "Your domain choice is saved. Open setup to check the next steps." : "Connect a domain you own or find a new address for your business."}</p>}
          {domain ? <ul className="pv-domain-checks">{[{ label: "DNS connection", done: domain.dns_ok === true }, { label: "SSL certificate", done: domain.ssl_ok === true }].map(check => <li key={check.label}><span>{check.label}</span><span className={check.done ? "pv-accent" : "pv-muted"}>{check.done ? "Passed" : "Pending"}</span></li>)}</ul> : null}
          {!progress.checks.find(check => check.id === "domain")?.done ? <div className="pv-domain-setup"><Link className="ov-button pv-domain-action" href={domainHref}>{domain || domainIntents.length ? "Open domain setup" : "Set up your domain"}<ArrowRight size={12} /></Link><span className="pv-domain-attention"><TriangleAlert size={13} aria-hidden="true" />Setup needed</span></div> : null}
          {domainStatus?.hint ? <p className="pv-small pv-domain-hint">{domain?.status_reason ?? domainStatus.hint}</p> : null}
          {domain?.last_checked_at ? <p className="pv-small pv-domain-hint">Checked {formatRelative(domain.last_checked_at)}</p> : null}
        </Card>

        <Card id="activity" title="Recent activity" icon={<Activity />}>
          {activity.length ? <ol className="pv-activity">{activity.slice(0, 4).map(event => <li key={event.id} data-tone={auditTone(event.action, event.after)}><i aria-hidden="true" /><div><p>{humanizeAction(event.action)}</p><time dateTime={event.created_at}>{formatRelative(event.created_at)}</time></div></li>)}</ol> : <div className="pv-activity-empty"><Activity size={22} aria-hidden="true" /><p>Your project starts here</p><span>Updates appear as work gets underway.</span></div>}
          {latestRelease ? <div className="pv-release"><Box size={13} aria-hidden="true" /><span>{latestRelease.environment === "production" ? "Production build" : "Preview build"} ready</span><time dateTime={latestRelease.finished_at ?? latestRelease.created_at}>{formatRelative(latestRelease.finished_at ?? latestRelease.created_at)}</time></div> : null}
        </Card>
      </div>

      <details className="pv-features"><summary><CreditCard size={13} />Your plan features<ChevronDown size={13} /></summary><ul>{features.map(feature => <li key={feature.label}><span className={feature.enabled ? "pv-accent" : "pv-muted"}>{feature.enabled ? <Check size={13} /> : <Circle size={11} />}</span>{feature.label}<small>{feature.enabled ? "Included" : "Not included"}</small></li>)}</ul></details>
    </div>
  );
}
