import { AccountBlock } from "@/components/vigil/AccountBlock";
import { AppShell } from "@/components/vigil/AppShell";
import { LiveDashboardSync } from "@/components/vigil/LiveDashboardSync";
import type { NavGroup } from "@/components/vigil/nav";
import { requireStaff } from "@/lib/vigil/auth/session";
import { adminNavAttention, attentionItems, expressReviewAttentionItems } from "@/lib/vigil/queries/admin";
import { listStaffReviewQueue } from "@/lib/vigil/queries/reviews";
import { FloatingAttentionCenter, type AttentionItem } from "@/components/vigil/FloatingAttentionCenter";
import { getUnreadNotifications } from "@/lib/vigil/queries/dashboard";

/** Vigil Admin chrome. Staff only; admin-only screens check again themselves. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  const [attention, reviewQueue, expressReviews, details, notifications] = await Promise.all([adminNavAttention(), listStaffReviewQueue(), expressReviewAttentionItems(), attentionItems(), getUnreadNotifications(staff.user.id)]);
  const reviewsNeedAttention = reviewQueue.some((item) => item.status === "changes_requested");
  const anythingNeedsAttention = Object.values(attention).some(Boolean) || reviewsNeedAttention || expressReviews.length > 0;
  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Overview", icon: "overview", exact: true, attention: anythingNeedsAttention },
        { href: "/admin/orders", label: "Orders", icon: "billing", attention: attention.orders },
        { href: "/admin/organizations", label: "Customers", icon: "customers", attention: attention.customers },
        { href: "/admin/websites", label: "Websites", icon: "websites", attention: attention.websites || expressReviews.length > 0 },
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
  // Notifications are events (a customer answered a review, a request came
  // in) and lead; the derived reminders below describe standing state.
  const floatingItems: AttentionItem[] = [
    ...notifications.map((notification) => ({ key: `notification:${notification.id}`, notificationId: notification.id, title: notification.title, body: notification.body || "Open this update for details.", href: notification.href || "/admin" })),
    ...expressReviews.map((item) => ({ key: `express-review:${item.roundId}`, title: `${item.organizationName} requested changes`, body: `${item.projectName} is waiting for its included Express revision.`, href: item.websiteId ? `/admin/websites/${item.websiteId}` : "/admin/websites" })),
    ...reviewQueue.filter((item) => item.status === "changes_requested").map((item) => ({ key: `review:${item.roundId}`, title: `${item.organizationName} requested changes`, body: `${item.projectName} is waiting for the team to begin the revision.`, href: `/admin/reviews/${item.projectId}` })),
    ...details.projects.map((project) => ({ key: `project:${project.id}`, title: `${project.organization?.name ?? "Customer"} finished onboarding`, body: `${project.name} is ready for the team to review.`, href: `/admin/organizations/${project.organization?.id}` })),
    ...details.requests.map((request) => ({ key: `request:${request.id}`, title: `${request.organization?.name ?? "Customer"} submitted a request`, body: request.title, href: "/admin/requests" })),
    ...details.jobs.map((job) => ({ key: `job:${job.id}`, title: "A background job failed", body: `${job.organization?.name ?? "Customer"}: ${job.kind}`, href: "/admin/jobs" })),
    ...details.domains.map((domain) => ({ key: `domain:${domain.id}`, title: `${domain.hostname} needs attention`, body: `${domain.organization?.name ?? "Customer"} domain status is ${domain.status}.`, href: "/admin/domains" })),
    ...details.websites.map((website) => ({ key: `website:${website.id}`, title: `${website.name} needs attention`, body: website.status_reason || `Website status is ${website.status}.`, href: `/admin/websites/${website.id}` })),
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
      <LiveDashboardSync scope={{ kind: "admin" }} />
      {children}
      <FloatingAttentionCenter portal="admin" items={floatingItems} />
    </AppShell>
  );
}
