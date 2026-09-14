import Link from "next/link";
import { Shell } from "@/components/vigil/Shell";
import { SignOutButton } from "@/components/vigil/SignOutButton";
import type { NavItem } from "@/components/vigil/ShellNav";
import { requireStaff } from "@/lib/vigil/auth/session";

/** Vigil Admin chrome. Staff only; admin-only screens check again themselves. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff("/admin");
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/organizations", label: "Customers" },
    { href: "/admin/websites", label: "Websites" },
    { href: "/admin/domains", label: "Domains" },
    { href: "/admin/subscriptions", label: "Subscriptions" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/audit", label: "Audit log" },
    { href: "/admin/plans", label: "Plans & staff", locked: staff.staffRole !== "admin" },
  ];
  return (
    <Shell
      items={items}
      homeHref="/admin"
      title={<span>Vigil Admin · {staff.profile.full_name ?? staff.profile.email}</span>}
      headerRight={
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="hidden text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] sm:inline">
            Client view
          </Link>
          <SignOutButton />
        </div>
      }
    >
      {children}
    </Shell>
  );
}
