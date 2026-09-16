import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDate, titleCase } from "@/lib/vigil/format";
import { listOrganizations } from "@/lib/vigil/queries/admin";
import { NewOrganizationForm } from "./NewOrganizationForm";

export const metadata: Metadata = { title: "Customers" };

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff("/admin/organizations");
  const { q } = await searchParams;
  const orgs = await listOrganizations(q);

  return (
    <div>
      <PageHeader title="Customers" description="Every organization Vigil works for." />

      <Card className="mb-4">
        <h2 className="text-base font-semibold">New customer</h2>
        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Creates the organization and, if an owner email is given, an invitation that accepts itself on their first sign-in.</p>
        <NewOrganizationForm />
      </Card>

      <form className="mb-3 flex gap-2" action="/admin/organizations">
        <input name="q" defaultValue={q ?? ""} placeholder="Search by name" className="w-full max-w-xs rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm" />
        <button className="btn-secondary !px-3 text-sm">Search</button>
      </form>

      <Table>
        <thead>
          <tr>
            <th className={thClass}>Organization</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Websites</th>
            <th className={thClass}>Plan</th>
            <th className={thClass}>Created</th>
          </tr>
        </thead>
        <tbody>
          {orgs.length === 0 ? (
            <tr>
              <td className={tdClass} colSpan={5}>
                No organizations yet.
              </td>
            </tr>
          ) : (
            orgs.map((o) => {
              const sub = o.subscriptions.find((s) => ["active", "trialing", "past_due"].includes(s.status));
              return (
                <tr key={o.id}>
                  <td className={tdClass}>
                    <Link href={`/admin/organizations/${o.id}`} className="font-medium underline">
                      {o.name}
                    </Link>
                    <div className="text-xs text-[color:var(--text-secondary)]">{o.slug}</div>
                  </td>
                  <td className={tdClass}>
                    <StatusPill tone={o.status === "active" ? "good" : o.status === "suspended" ? "bad" : "warn"}>{titleCase(o.status)}</StatusPill>
                  </td>
                  <td className={tdClass}>
                    {o.websites.length} ({o.websites.filter((w) => w.status === "live").length} live)
                  </td>
                  <td className={tdClass}>{sub?.plan?.name ?? "No plan"}</td>
                  <td className={tdClass}>{formatDate(o.created_at)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
