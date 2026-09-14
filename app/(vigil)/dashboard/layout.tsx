import { AccountBlock } from "@/components/vigil/AccountBlock";
import { AppShell } from "@/components/vigil/AppShell";
import { OrgSwitcher } from "@/components/vigil/OrgSwitcher";
import type { NavGroup } from "@/components/vigil/nav";
import { getOrgContext, requireViewer } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import { getOnboardingProject, needsOnboarding } from "@/lib/vigil/queries/onboarding";

/**
 * Client dashboard chrome. Requires a signed-in user; pages decide whether
 * they also need an organization (most do, via requireOrgContext).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/dashboard");
  const ctx = await getOrgContext();

  let groups: NavGroup[] = [];
  if (ctx) {
    const [ent, onboarding] = await Promise.all([resolveEntitlements(ctx.organization.id), getOnboardingProject(ctx.organization.id)]);
    groups = [
      {
        items: [
          ...(needsOnboarding(onboarding?.project) ? [{ href: "/dashboard/onboarding", label: "Getting set up", icon: "virtue" as const }] : []),
          { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
          { href: "/dashboard/website", label: "Website", icon: "website" },
          { href: "/dashboard/domain", label: "Domain", icon: "domain" },
          { href: "/dashboard/billing", label: "Subscription", icon: "billing" },
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
      {children}
    </AppShell>
  );
}
