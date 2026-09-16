import { AccountBlock } from "@/components/vigil/AccountBlock";
import { AppShell } from "@/components/vigil/AppShell";
import type { NavGroup } from "@/components/vigil/nav";
import { requireStaff } from "@/lib/vigil/auth/session";
import { adminNavAttention } from "@/lib/vigil/queries/admin";
import { listStaffReviewQueue } from "@/lib/vigil/queries/reviews";

/** Vigil Admin chrome. Staff only; admin-only screens check again themselves. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  const [attention, reviewQueue] = await Promise.all([adminNavAttention(), listStaffReviewQueue()]);
  const reviewsNeedAttention = reviewQueue.some((item) => item.status === "changes_requested");
  const anythingNeedsAttention = Object.values(attention).some(Boolean) || reviewsNeedAttention;
  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Overview", icon: "overview", exact: true, attention: anythingNeedsAttention },
        { href: "/admin/orders", label: "Orders", icon: "billing", attention: attention.orders },
        { href: "/admin/organizations", label: "Customers", icon: "customers", attention: attention.customers },
        { href: "/admin/websites", label: "Websites", icon: "websites", attention: attention.websites },
        { href: "/admin/reviews", label: "Reviews", icon: "requests", attention: reviewsNeedAttention },
        { href: "/admin/domains", label: "Domains", icon: "domains", attention: attention.domains },
        { href: "/admin/subscriptions", label: "Subscriptions", icon: "subscriptions", attention: attention.subscriptions },
        { href: "/admin/requests", label: "Requests", icon: "requests", attention: attention.requests },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/jobs", label: "Jobs", icon: "jobs", attention: attention.jobs },
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
