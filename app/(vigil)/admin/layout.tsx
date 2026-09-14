import { AccountBlock } from "@/components/vigil/AccountBlock";
import { AppShell } from "@/components/vigil/AppShell";
import type { NavGroup } from "@/components/vigil/nav";
import { requireStaff } from "@/lib/vigil/auth/session";

/** Vigil Admin chrome. Staff only; admin-only screens check again themselves. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Overview", icon: "overview", exact: true },
        { href: "/admin/organizations", label: "Customers", icon: "customers" },
        { href: "/admin/websites", label: "Websites", icon: "websites" },
        { href: "/admin/domains", label: "Domains", icon: "domains" },
        { href: "/admin/subscriptions", label: "Subscriptions", icon: "subscriptions" },
        { href: "/admin/requests", label: "Requests", icon: "requests" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/jobs", label: "Jobs", icon: "jobs" },
        { href: "/admin/audit", label: "Audit log", icon: "audit" },
        { href: "/admin/plans", label: "Plans & staff", icon: "plans", locked: staff.staffRole !== "admin" },
      ],
    },
  ];
  return (
    <AppShell
      groups={groups}
      homeHref="/admin"
      workspace={
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">Vigil Admin</div>
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--text-secondary)]">{staff.staffRole}</div>
        </div>
      }
      account={<AccountBlock name={staff.profile.full_name} email={staff.profile.email} crossLink={{ href: "/dashboard", label: "Client view" }} />}
    >
      {children}
    </AppShell>
  );
}
