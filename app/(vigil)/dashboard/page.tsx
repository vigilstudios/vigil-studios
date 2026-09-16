import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/vigil/ui";
import { Checklist, Meter, Panel, StatusLine, Stepper, Timeline } from "@/components/vigil/widgets";
import { SiteFrame } from "@/components/vigil/SiteFrame";
import { OnboardingCard } from "@/components/vigil/OnboardingCard";
import { VirtueWelcome } from "@/components/vigil/VirtueWelcome";
import { DeploymentStatusRefresh } from "@/components/vigil/DeploymentStatusRefresh";
import { passwordSpeech, welcomeSpeech } from "@/lib/vigil/onboarding/virtue-copy";
import { PasswordForm } from "@/components/vigil/PasswordForm";
import { hasPassword } from "@/lib/vigil/auth/password";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { formatDate, formatRelative, humanizeAction, titleCase } from "@/lib/vigil/format";
import { describeDomainStatus, describeProjectStatus, describeSubscriptionStatus, describeWebsiteStatus, type CustomerStatus } from "@/lib/vigil/lifecycle";
import { auditTone, periodProgress, previewSource, projectStepIndex, projectSteps, requiredRecords, templateName } from "@/lib/vigil/presenters";
import { getOrgDomains, getOrgProjects, getOrgSubscription, getOrgWebsites, getRecentActivity, getRecentDeployments } from "@/lib/vigil/queries/dashboard";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/vigil/onboarding/constants";
import { getOnboardingProject, needsOnboarding } from "@/lib/vigil/queries/onboarding";
import { getCustomerProjectReviews, type ProjectReviews } from "@/lib/vigil/queries/reviews";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const ctx = await requireOrgContext("/dashboard");
  const orgId = ctx.organization.id;

  // First arrival after a purchase: Virtue welcomes them over the dimmed
  // dashboard until they begin or choose to look around first.
  const onboarding = await getOnboardingProject(orgId);
  let welcome = false;
  if (needsOnboarding(onboarding?.project) && onboarding?.brief.progress.lastStep === "welcome") {
    const skipped = (await cookies()).get(ONBOARDING_SKIP_COOKIE)?.value === "1";
    welcome = !skipped;
  }
  const [websites, domains, subscription, projects, activity, ent] = await Promise.all([
    getOrgWebsites(orgId),
    getOrgDomains(orgId),
    getOrgSubscription(orgId),
    getOrgProjects(orgId),
    getRecentActivity(orgId, 10),
    resolveEntitlements(orgId),
  ]);

  const website = websites[0] ?? null;
  const deployments = website ? await getRecentDeployments(website.id, 1) : [];
  const lastPublish = deployments[0] ?? null;
  const domain = domains.find((d) => d.id === website?.primary_domain_id) ?? domains.find((d) => d.website_id === website?.id) ?? domains[0] ?? null;
  const project = projects.find((p) => !["closed", "cancelled"].includes(p.status)) ?? projects[0] ?? null;
  const projectReview = project?.kind === "professional" ? await getCustomerProjectReviews(project.id) : null;
  const hasPostedReview = Boolean(projectReview?.rounds.some((round) => round.status !== "pending"));
  const reviewReady = Boolean(projectReview?.rounds.some((round) => round.status === "awaiting_feedback"));

  const websiteStatus = website ? describeWebsiteStatus(website.status) : null;
  const displayedWebsiteStatus = website?.preview_url && !website.live_url
    ? { label: "Preview ready", tone: "good" as const, hint: "Your private build preview is ready to view." }
    : websiteStatus;
  const domainStatus = domain ? describeDomainStatus(domain.status) : null;
  const subStatus = subscription ? describeSubscriptionStatus(subscription.status) : null;
  const projectStatus = project ? describeProjectStatus(project.status) : null;
  const reviewProjectStatus = professionalReviewStatus(projectReview);
  const displayedProjectStatus = reviewProjectStatus ?? projectStatus;
  const step = project ? projectStepIndex(project.status) : null;
  const period = periodProgress(subscription?.current_period_start ?? null, subscription?.current_period_end ?? null);
  const records = domain ? requiredRecords(domain.verification) : [];
  const preview = previewSource(website, project?.template_slug ?? null);

  const firstName = ctx.profile.full_name?.split(" ")[0];

  if (!website && !project) {
    return (
      <div>
        <h1 className="text-lg font-semibold">{firstName ? `Hello, ${firstName}` : "Overview"}</h1>
        <div className="mt-4">
          <EmptyState title="Nothing to show yet" description="Once Vigil Studios starts your project, your website, domain and subscription will appear here." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DeploymentStatusRefresh active={Boolean(website && ["provisioning", "building"].includes(website.status))} />
      {welcome && onboarding ? (
        <VirtueWelcome
          projectId={onboarding.project.id}
          needsPassword={!hasPassword(ctx.user) && !ctx.isImpersonating}
          passwordLines={passwordSpeech({ firstName })}
          lines={welcomeSpeech({ firstName, businessName: onboarding.brief.basics?.businessName || ctx.organization.name })}
          linesAfterPassword={welcomeSpeech({ firstName, businessName: onboarding.brief.basics?.businessName || ctx.organization.name, afterPassword: true })}
        />
      ) : null}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">{ctx.organization.name}</p>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{firstName ? `Hello, ${firstName}` : "Overview"}</h1>
        <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Everything Vigil is running for your business, at a glance.</p>
      </div>

      {!hasPassword(ctx.user) && !ctx.isImpersonating && !welcome ? (
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
          <p className="text-[13px] font-semibold">Set a password for next time</p>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">You signed in with an email link. With a password you can sign in straight away on any device; the link stays available as a backup.</p>
          <div className="mt-3">
            <PasswordForm hasPassword={false} compact />
          </div>
        </section>
      ) : null}

      {onboarding && (needsOnboarding(onboarding.project) || onboarding.project.intake_completed_at) ? (
        <OnboardingCard brief={onboarding.brief} completedAt={onboarding.project.intake_completed_at} businessName={onboarding.brief.basics?.businessName || ctx.organization.name} projectKind={onboarding.project.kind} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Website */}
        <Panel className="lg:col-span-5 lg:row-span-2" title="Website" action={<Link href="/dashboard/website" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Details</Link>}>
          {preview.kind === "none" ? (
            <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-[color:var(--border)] text-xs text-[color:var(--text-secondary)]">
              A preview appears once your site is being built
            </div>
          ) : (
            <SiteFrame src={preview.src} address={preview.address} title={`${website?.name ?? project?.name ?? "Website"} preview`} />
          )}
          {preview.kind === "template" ? (
            <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Showing the template your site is built from; your content replaces this as the build progresses.</p>
          ) : null}
          <div className="mt-3 flex items-start justify-between gap-3">
            {displayedWebsiteStatus ? (
              <StatusLine tone={displayedWebsiteStatus.tone} label={displayedWebsiteStatus.label} hint={website?.status_reason ?? displayedWebsiteStatus.hint} />
            ) : (
              <StatusLine tone="info" label="In production" hint="Your website appears here once it is published." />
            )}
            {website?.live_url || website?.preview_url ? (
              <a href={website.live_url ?? website.preview_url ?? "#"} target="_blank" rel="noreferrer" className="btn-secondary !px-2.5 !py-1 shrink-0 text-xs">
                {website.live_url ? "Open site" : "Open preview"} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-[color:var(--text-secondary)]">{website?.live_url ? "Address" : website?.preview_url ? "Preview address" : "Address"}</dt>
              <dd className="truncate font-medium">{website?.live_url ? website.live_url.replace(/^https?:\/\//, "") : website?.preview_url ? website.preview_url.replace(/^https?:\/\//, "") : "Not published yet"}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--text-secondary)]">Last published</dt>
              <dd className="font-medium">{lastPublish ? formatRelative(lastPublish.finished_at ?? lastPublish.created_at) : "Not yet"}</dd>
            </div>
          </dl>
        </Panel>

        {/* Domain */}
        <Panel className="lg:col-span-4" title="Domain" action={<Link href="/dashboard/domain" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Manage</Link>}>
          {domain && domainStatus ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{domain.hostname}</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">Owned by you{domain.source === "purchased_via_vigil" ? ", registered through Vigil" : ""}</p>
                </div>
                <StatusLine tone={domainStatus.tone} label={domainStatus.label} size="sm" />
              </div>
              <div className="mt-4">
                <Checklist
                  items={[
                    ...records.map((r) => ({
                      label: `${r.type} record at your registrar`,
                      detail: `${r.name} → ${r.value}`,
                      tone: (domain.dns_ok ? "good" : "warn") as "good" | "warn",
                    })),
                    { label: "DNS pointing at Vigil", tone: domain.dns_ok === null ? "neutral" : domain.dns_ok ? "good" : "warn" },
                    { label: "SSL certificate", tone: domain.ssl_ok ? "good" : domain.status === "connected" ? "warn" : "neutral" },
                  ]}
                />
              </div>
              <p className="mt-3 text-[11px] text-[color:var(--text-secondary)]">
                {domain.status_reason ?? domainStatus.hint ?? ""} {domain.last_checked_at ? `Last checked ${formatRelative(domain.last_checked_at)}.` : ""}
              </p>
            </>
          ) : (
            <div className="flex h-full flex-col justify-between gap-3">
              <StatusLine tone="neutral" label="No domain connected" hint="Own a domain? Connect it in a few minutes. Need one? Vigil can register it for you." />
              <ButtonLink href="/dashboard/domain" variant="secondary" className="!px-3 !py-1.5 self-start text-xs">Connect a domain</ButtonLink>
            </div>
          )}
        </Panel>

        {/* Subscription */}
        <Panel className="lg:col-span-3" title="Subscription" action={<Link href="/dashboard/billing" className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Billing</Link>}>
          {subscription && subStatus ? (
            <div className="flex h-full flex-col gap-4">
              <div>
                <p className="text-base font-semibold">{subscription.plan?.name ?? "Vigil"}</p>
                {subscription.plan?.tagline ? <p className="text-xs text-[color:var(--text-secondary)]">{subscription.plan.tagline}</p> : null}
              </div>
              <StatusLine tone={subStatus.tone} label={subStatus.label} hint={subStatus.hint} size="sm" />
              {period.total > 0 ? (
                <Meter
                  value={period.elapsed}
                  max={period.total}
                  tone={subscription.cancel_at_period_end ? "warn" : "good"}
                  srLabel="Billing period"
                  label={
                    <>
                      <span>{subscription.cancel_at_period_end ? "Ends" : "Renews"} {formatDate(subscription.current_period_end)}</span>
                      <span>{period.daysLeft} days</span>
                    </>
                  }
                />
              ) : (
                <p className="text-xs text-[color:var(--text-secondary)]">Billing period will show once online billing is set up.</p>
              )}
              <ul className="mt-auto grid grid-cols-2 gap-1 text-[11px]">
                {[
                  ["Hosting", ent.enabled(FEATURES.hostingManaged)],
                  ["Domain", ent.enabled(FEATURES.domainManaged)],
                  ["Updates", ent.enabled(FEATURES.requests)],
                  ["Virtue", ent.enabled(FEATURES.virtue)],
                ].map(([label, on]) => (
                  <li key={String(label)} className={on ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)] line-through decoration-[color:var(--border)]"}>
                    {on ? "✓" : "–"} {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <StatusLine tone="neutral" label="No active plan" hint="Every Vigil-hosted website needs an active Vigil plan. Vigil Studios sets this up with you." />
          )}
        </Panel>

        {/* Project */}
        {project && displayedProjectStatus && step ? (
          <Panel className="lg:col-span-7" title="Your project">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
              <div className="min-w-0 xl:w-72 xl:shrink-0">
                <p className="truncate text-base font-semibold">{project.name}</p>
                <div className="mt-1">
                  <StatusLine tone={step.cancelled ? "neutral" : displayedProjectStatus.tone} label={displayedProjectStatus.label} hint={displayedProjectStatus.hint} size="sm" />
                </div>
                {project.kind === "professional" && (hasPostedReview || project.status === "review") ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {reviewReady ? "Your Professional build is ready for review." : "Your Professional review history and latest version are here."}
                    </p>
                    <Link href="/dashboard/review" className="btn-primary !px-2.5 !py-1 text-xs">{reviewReady ? "Open design review" : "View design review"}</Link>
                  </div>
                ) : project.status === "review" ? (
                  <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Reply to your project email with changes or your approval.</p>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Stepper steps={projectSteps} current={step.current} done={step.done} tone={displayedProjectStatus.tone === "warn" ? "warn" : "info"} />
                <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)] sm:hidden">{projectSteps[step.current]?.label ?? displayedProjectStatus.label}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[color:var(--border)] pt-4 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-[color:var(--text-secondary)]">Type</dt>
                <dd className="font-medium">{titleCase(project.kind)} site</dd>
              </div>
              <div>
                <dt className="text-[color:var(--text-secondary)]">Template</dt>
                <dd className="font-medium">{templateName(project.template_slug ?? website?.template_slug ?? null)}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--text-secondary)]">Started</dt>
                <dd className="font-medium">{formatDate(project.created_at)}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--text-secondary)]">{project.launched_at ? "Launched" : "Target launch"}</dt>
                <dd className="font-medium">{project.launched_at ? formatDate(project.launched_at) : project.launch_target ? formatDate(project.launch_target) : "To be scheduled"}</dd>
              </div>
            </dl>
          </Panel>
        ) : null}

        {/* Activity */}
        <Panel className="lg:col-span-8" title="Recent activity">
          <Timeline
            empty="Nothing yet. Activity appears here as Vigil works on your account."
            items={activity.map((e) => ({
              key: String(e.id),
              tone: auditTone(e.action, e.after),
              title: humanizeAction(e.action),
              when: formatRelative(e.created_at),
            }))}
          />
        </Panel>

        {/* Plan inclusions */}
        <Panel className="lg:col-span-4" title="Your plan includes">
          <Checklist
            items={[
              { label: "Managed hosting and deployment", tone: ent.enabled(FEATURES.hostingManaged) ? "good" : "neutral" },
              { label: "Domain status and management", tone: ent.enabled(FEATURES.domainManaged) ? "good" : "neutral" },
              { label: "Website updates and changes", tone: ent.enabled(FEATURES.requests) ? "good" : "neutral" },
              { label: "Lead Hub", tone: ent.enabled(FEATURES.leads) ? "good" : "neutral" },
              { label: "Vigil Insights", tone: ent.enabled(FEATURES.insights) ? "good" : "neutral" },
              { label: "Virtue, your AI employee", tone: ent.enabled(FEATURES.virtue) ? "good" : "neutral" },
            ]}
          />
          {!ent.planCode ? <p className="mt-3 text-xs text-[color:var(--text-secondary)]">No active subscription yet.</p> : null}
        </Panel>
      </div>
    </div>
  );
}

function professionalReviewStatus(review: ProjectReviews | null): CustomerStatus | null {
  if (!review?.rounds.length || review.rounds.every((round) => round.status === "pending")) return null;
  if (review.rounds.length === 2 && review.rounds.every((round) => round.status === "approved")) {
    return { label: "Review complete: both rounds approved", tone: "good", hint: "Your site is cleared for its production launch." };
  }

  const round = review.rounds.find((candidate) => candidate.status !== "approved");
  if (!round) return null;
  const name = round.number === 1 ? "Design direction" : "Full-site review";
  const prefix = `Round ${round.number}: ${name}`;
  switch (round.status) {
    case "awaiting_feedback":
      return { label: `${prefix}: ready for your review`, tone: "warn" };
    case "changes_requested":
      return { label: `${prefix}: changes requested`, tone: "info", hint: "Your consolidated notes are with the Vigil team." };
    case "revision_in_progress":
      return { label: `${prefix}: revisions in progress`, tone: "info" };
    case "pending":
      return { label: `${prefix}: being prepared`, tone: "info" };
    case "approved":
      return { label: `${prefix}: approved`, tone: "good" };
  }
}
