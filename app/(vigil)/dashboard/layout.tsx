import { Shell } from "@/components/vigil/Shell";
import { OrgSwitcher } from "@/components/vigil/OrgSwitcher";
import { SignOutButton } from "@/components/vigil/SignOutButton";
import type { NavItem } from "@/components/vigil/ShellNav";
import { getOrgContext, requireViewer } from "@/lib/vigil/auth/session";
import { FEATURES, resolveEntitlements } from "@/lib/vigil/entitlements";
import Link from "next/link";

/**
 * Client dashboard chrome. Requires a signed-in user; pages decide whether
 * they also need an organization (most do, via requireOrgContext).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/dashboard");
  const ctx = await getOrgContext();

  let items: NavItem[] = [];
  if (ctx) {
    const ent = await resolveEntitlements(ctx.organization.id);
    items = [
      { href: "/dashboard", label: "Overview", exact: true },
      { href: "/dashboard/website", label: "Website" },
      { href: "/dashboard/domain", label: "Domain" },
      { href: "/dashboard/billing", label: "Subscription" },
      { href: "/dashboard/requests", label: "Requests", locked: !ent.enabled(FEATURES.requests) },
      { href: "/dashboard/leads", label: "Leads", locked: !ent.enabled(FEATURES.leads), badge: "Soon" },
      { href: "/dashboard/insights", label: "Insights", locked: !ent.enabled(FEATURES.insights), badge: "Soon" },
      { href: "/dashboard/virtue", label: "Virtue", locked: !ent.enabled(FEATURES.virtue), badge: "Soon" },
      { href: "/dashboard/settings", label: "Settings" },
    ];
  }

  const organizations = viewer.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }));
  if (ctx?.isImpersonating) organizations.unshift({ id: ctx.organization.id, name: `${ctx.organization.name} (staff view)` });

  return (
    <Shell
      items={items}
      homeHref="/dashboard"
      title={ctx ? <OrgSwitcher organizations={organizations} activeId={ctx.organization.id} /> : "Vigil"}
      headerRight={
        <div className="flex items-center gap-3 text-sm">
          {viewer.staffRole ? (
            <Link href="/admin" className="hidden text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] sm:inline">
              Admin
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      }
    >
      {children}
    </Shell>
  );
}
