import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { measurementRange } from "@/lib/vigil/measurements/navigation";
import { LiveOverview } from "@/components/vigil/overview/LiveOverview";
import { PreviewOverview } from "@/components/vigil/overview/PreviewOverview";
import { EmptyState } from "@/components/vigil/ui";
import { VirtueWelcome } from "@/components/vigil/VirtueWelcome";
import { DeploymentStatusRefresh } from "@/components/vigil/DeploymentStatusRefresh";
import { PasswordForm } from "@/components/vigil/PasswordForm";
import { hasPassword } from "@/lib/vigil/auth/password";
import { getOrgContext, requireViewer } from "@/lib/vigil/auth/session";
import { ProspectOverview } from "@/components/vigil/ProspectOverview";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { isWebsiteLive, previewSource } from "@/lib/vigil/presenters";
import { PLAN_FEATURE_LABELS } from "@/lib/vigil/plan-presentation";
import { previewProject } from "@/lib/vigil/overview/preview-model";
import {
  getOrgDomains,
  getOrgProjects,
  getOrgSubscription,
  getOrgWebsites,
  getRecentActivity,
  getRecentDeployments,
  getCustomerExpressPreviewReview,
} from "@/lib/vigil/queries/dashboard";
import { getCustomerProjectReviews } from "@/lib/vigil/queries/reviews";
import { getPreviewOverviewPalette } from "@/lib/vigil/queries/preview-overview-palette";
import { loadDomainIntent } from "@/lib/vigil/services/domain-handoff";
import {
  passwordSpeech,
  welcomeSpeech,
} from "@/lib/vigil/onboarding/virtue-copy";
import {
  ONBOARDING_SKIP_COOKIE,
  welcomeWasDeferred,
} from "@/lib/vigil/onboarding/constants";
import {
  getOnboardingProject,
  needsOnboarding,
} from "@/lib/vigil/queries/onboarding";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string; range?: string }>;
}) {
  const viewer = await requireViewer("/dashboard");
  const ctx = await getOrgContext();
  if (!ctx) return <ProspectOverview name={viewer.profile.full_name} />;
  const orgId = ctx.organization.id;
  const [websites, domains, subscription, projects, activity, ent] =
    await Promise.all([
      getOrgWebsites(orgId),
      getOrgDomains(orgId),
      getOrgSubscription(orgId),
      getOrgProjects(orgId),
      getRecentActivity(orgId, 10),
      resolveEntitlements(orgId),
    ]);
  const query = await searchParams;
  const selected = query.website;
  if (websites.some(isWebsiteLive)) {
    return (
      <LiveOverview
        ctx={ctx}
        websites={websites}
        domains={domains}
        projects={projects}
        subscription={subscription}
        activity={activity}
        canRequest={ent.enabled(FEATURES.requests)}
        selectedWebsite={typeof selected === "string" ? selected : undefined}
        initialRange={measurementRange(query.range)}
      />
    );
  }

  const onboarding = await getOnboardingProject(orgId);
  let welcome = false;
  if (
    needsOnboarding(onboarding?.project) &&
    onboarding?.brief.progress.lastStep === "welcome"
  ) {
    const deferredProject = (await cookies()).get(
      ONBOARDING_SKIP_COOKIE,
    )?.value;
    welcome = !welcomeWasDeferred(deferredProject, onboarding.project.id);
  }
  const website =
    websites.find((site) => site.id === selected) ?? websites[0] ?? null;
  const project = previewProject(projects, website);
  const domain =
    domains.find(
      (row) =>
        row.id === website?.primary_domain_id && row.website_id === website?.id,
    ) ??
    domains.find((row) => row.website_id === website?.id) ??
    null;
  const templateSlug = website?.template_slug ?? project?.template_slug ?? null;
  const preview = previewSource(website, templateSlug);
  const client = await createClient();
  const [
    deployments,
    professionalReview,
    expressReview,
    domainIntent,
    previewAccent,
  ] = await Promise.all([
    website ? getRecentDeployments(website.id, 12) : [],
    project?.kind === "professional"
      ? getCustomerProjectReviews(project.id)
      : null,
    website && project?.kind === "express"
      ? getCustomerExpressPreviewReview(website.id)
      : null,
    website ? loadDomainIntent(client, orgId, website.id) : null,
    getPreviewOverviewPalette(client, website, preview, templateSlug),
  ]);
  const firstName = ctx.profile.full_name?.split(" ")[0];
  if (!website && !project) {
    return (
      <div>
        <h1 className="text-lg font-semibold">
          {firstName ? `Hello, ${firstName}` : "Overview"}
        </h1>
        <div className="mt-4">
          <EmptyState
            title="Nothing to show yet"
            description="Once Vigil Studios starts your project, your website, domain and subscription will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DeploymentStatusRefresh
        active={Boolean(
          website && ["provisioning", "building"].includes(website.status),
        )}
      />
      {welcome && onboarding ? (
        <VirtueWelcome
          projectId={onboarding.project.id}
          needsPassword={!hasPassword(ctx.user) && !ctx.isImpersonating}
          passwordLines={passwordSpeech({ firstName })}
          lines={welcomeSpeech({
            firstName,
            businessName:
              onboarding.brief.basics?.businessName || ctx.organization.name,
          })}
          linesAfterPassword={welcomeSpeech({
            firstName,
            businessName:
              onboarding.brief.basics?.businessName || ctx.organization.name,
            afterPassword: true,
          })}
        />
      ) : null}
      {!hasPassword(ctx.user) && !ctx.isImpersonating && !welcome ? (
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
          <p className="text-[13px] font-semibold">
            Set a password for next time
          </p>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            You signed in with an email link. With a password you can sign in
            straight away on any device; the link stays available as a backup.
          </p>
          <div className="mt-3">
            <PasswordForm hasPassword={false} compact />
          </div>
        </section>
      ) : null}
      <PreviewOverview
        organizationName={ctx.organization.name}
        website={website}
        project={project}
        domain={domain}
        subscription={subscription}
        activity={activity}
        deployments={deployments}
        preview={preview}
        previewAccent={previewAccent}
        professionalReview={professionalReview}
        expressReview={expressReview}
        domainIntents={
          domainIntent && domainIntent.phase !== "cancelled"
            ? [domainIntent]
            : []
        }
        features={PLAN_FEATURE_LABELS.map(([code, label]) => ({
          label,
          enabled: ent.enabled(code),
        }))}
      />
    </div>
  );
}
