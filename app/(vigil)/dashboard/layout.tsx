import { AccountBlock } from "@/components/vigil/AccountBlock";
import { AppShell } from "@/components/vigil/AppShell";
import { LiveDashboardSync } from "@/components/vigil/LiveDashboardSync";
import { OrgSwitcher } from "@/components/vigil/OrgSwitcher";
import type { NavGroup } from "@/components/vigil/nav";
import { getOrgContext, requireViewer } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { getOnboardingProject, needsOnboarding } from "@/lib/vigil/queries/onboarding";
import { getOrgDomains, getOrgProjects, getOrgSubscription, getOrgWebsites, listMyInvitations } from "@/lib/vigil/queries/dashboard";
import { PendingInvitations } from "@/components/vigil/PendingInvitations";
import { getCustomerProjectReviews } from "@/lib/vigil/queries/reviews";
import { FloatingAttentionCenter, type AttentionItem } from "@/components/vigil/FloatingAttentionCenter";
import { getCustomerExpressPreviewReview } from "@/lib/vigil/queries/dashboard";
import { getUnreadNotifications } from "@/lib/vigil/queries/dashboard";
import { customerDomainNeedsAttention } from "@/lib/vigil/attention";

/**
 * Client dashboard chrome. Requires a signed-in user; pages decide whether
 * they also need an organization (most do, via requireOrgContext).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/dashboard");
  const [ctx, invitations] = await Promise.all([getOrgContext(), listMyInvitations()]);

  let groups: NavGroup[] = [];
  let floatingItems: AttentionItem[] = [];
  if (ctx) {
    const [ent, onboarding, projects, websites, domains, subscription] = await Promise.all([
      resolveEntitlements(ctx.organization.id),
      getOnboardingProject(ctx.organization.id),
      getOrgProjects(ctx.organization.id),
      getOrgWebsites(ctx.organization.id),
      getOrgDomains(ctx.organization.id),
      getOrgSubscription(ctx.organization.id),
    ]);
    // Build reviews belong to the Professional project, independently of the
    // ongoing Requests entitlement. Keep the nav quiet until the project is
    // in a state where a customer can reasonably expect a review surface.
    const professionalProject = projects.find((project) => project.kind === "professional" && !["closed", "cancelled"].includes(project.status));
    const projectReviews = professionalProject ? await getCustomerProjectReviews(professionalProject.id) : null;
    const expressWebsite = websites.find((site) => projects.find((project) => project.id === site.project_id)?.kind === "express");
    const [expressReview, notifications] = await Promise.all([
      expressWebsite ? getCustomerExpressPreviewReview(expressWebsite.id) : Promise.resolve(null),
      getUnreadNotifications(viewer.user.id, ctx.organization.id),
    ]);
    const reviewRelevant = Boolean(
      projectReviews?.rounds.some((round) => round.status !== "pending") ||
      projects.some((project) => project.kind === "professional" && project.status === "review")
    );
    const onboardingNeedsAttention = needsOnboarding(onboarding?.project);
    const expressReviewNeedsAttention = expressReview?.status === "awaiting_feedback";
    const websiteNeedsAttention = websites.some((site) => ["error", "suspended"].includes(site.status)) || expressReviewNeedsAttention;
    const reviewNeedsAttention = Boolean(projectReviews?.rounds.some((round) => round.status === "awaiting_feedback"));
    const domainNeedsAttention = customerDomainNeedsAttention(domains, websites);
    const subscriptionNeedsAttention = Boolean(subscription && ["past_due", "unpaid", "incomplete"].includes(subscription.status));
    const anythingNeedsAttention = onboardingNeedsAttention || websiteNeedsAttention || reviewNeedsAttention || domainNeedsAttention || subscriptionNeedsAttention;
    const derived: AttentionItem[] = [
      ...(onboardingNeedsAttention ? [{ key: "onboarding", title: "Finish setting up", body: "Complete and send your project details so the team can begin.", href: "/dashboard/onboarding" }] : []),
      ...(expressReviewNeedsAttention ? [{ key: "express-review", title: "Your website preview is ready", body: "Approve the preview or send your included request for changes.", href: "/dashboard/website" }] : []),
      ...(reviewNeedsAttention ? [{ key: "professional-review", title: "A design review is waiting", body: "Review the current version and send one clear decision.", href: "/dashboard/review" }] : []),
      ...(domainNeedsAttention ? [{ key: "domain", title: "Your domain needs attention", body: "Check the DNS instructions and current connection status.", href: "/dashboard/domain" }] : []),
      ...(subscriptionNeedsAttention ? [{ key: "billing", title: "Your subscription needs attention", body: "Open billing to review the current payment status.", href: "/dashboard/billing" }] : []),
    ];
    floatingItems = [
      ...derived,
      ...notifications
        .filter((notification) => !derived.some((item) => item.href === (notification.href || "/dashboard")))
        .map((notification) => ({ key: `notification:${notification.id}`, notificationId: notification.id, title: notification.title, body: notification.body || "Open this update for details.", href: notification.href || "/dashboard" })),
    ];
    groups = [
      {
        items: [
          ...(onboardingNeedsAttention ? [{ href: "/dashboard/onboarding", label: "Getting set up", icon: "virtue" as const, attention: true }] : []),
          { href: "/dashboard", label: "Overview", icon: "overview", exact: true, attention: anythingNeedsAttention },
          { href: "/dashboard/website", label: "Website", icon: "website", attention: websiteNeedsAttention },
          ...(reviewRelevant ? [{ href: "/dashboard/review", label: "Design review", icon: "review" as const, attention: reviewNeedsAttention }] : []),
          { href: "/dashboard/domain", label: "Domain", icon: "domain", attention: domainNeedsAttention },
          { href: "/dashboard/billing", label: "Subscription", icon: "billing", attention: subscriptionNeedsAttention },
          { href: "/dashboard/requests", label: "Requests", icon: "requests", locked: !ent.enabled(FEATURES.requests) },
        ],
      },
      {
        label: "Grow",
        items: [
          { href: "/dashboard/leads", label: "Leads", icon: "leads", locked: !ent.enabled(FEATURES.leads), badge: "Soon" },
          { href: "/dashboard/insights", label: "Insights", icon: "insights", locked: !ent.enabled(FEATURES.insights), badge: "Soon" },
          { href: "/dashboard/virtue", label: "Virtue", icon: "virtue", locked: !ent.enabled(FEATURES.virtue), badge: "Soon" },
        ],
      },
      {
        items: [{ href: "/dashboard/settings", label: "Settings", icon: "settings" }],
      },
    ];
  }

  const organizations = viewer.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }));
  if (ctx?.isImpersonating) organizations.unshift({ id: ctx.organization.id, name: ctx.organization.name });

  return (
    <AppShell
      groups={groups}
      homeHref="/dashboard"
      workspace={ctx ? <OrgSwitcher organizations={organizations} activeId={ctx.organization.id} staffView={ctx.isImpersonating} /> : <span className="text-[13px] font-semibold">Vigil</span>}
      account={
        <AccountBlock
          name={viewer.profile.full_name}
          email={viewer.profile.email}
          crossLink={viewer.staffRole ? { href: "/admin", label: "Admin" } : null}
        />
      }
    >
      <LiveDashboardSync scope={ctx ? { kind: "organization", organizationId: ctx.organization.id, userId: viewer.user.id } : { kind: "viewer", userId: viewer.user.id }} />
      <PendingInvitations invitations={invitations} />
      {children}
      {ctx ? <FloatingAttentionCenter portal="customer" items={floatingItems} /> : null}
    </AppShell>
  );
}
