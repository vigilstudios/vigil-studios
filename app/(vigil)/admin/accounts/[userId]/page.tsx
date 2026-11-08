import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/vigil/auth/session";
import {
  Card,
  PageHeader,
  StatusPill,
  Table,
  tdClass,
  thClass,
} from "@/components/vigil/ui";
import { formatDate, formatMoney } from "@/lib/vigil/format";
export default async function CustomerAccountPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireStaff("/admin/organizations");
  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) notFound();
  const client = await createClient();
  const [profile, members] = await Promise.all([
    client
      .from("profiles")
      .select("id,email,full_name,created_at")
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("organization_members")
      .select(
        "organization_id,role,status,organization:organizations(id,name,archived_at)",
      )
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);
  if (profile.error) throw profile.error;
  if (members.error) throw members.error;
  if (!profile.data) notFound();
  const businesses = members.data ?? [],
    orgIds = businesses
      .filter((m) => m.role === "owner")
      .map((m) => m.organization_id);
  let query = client
    .from("orders")
    .select(
      "id,status,business_name,project_kind,build_amount_cents,plan_amount_cents,currency,created_at,organization_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  query = orgIds.length
    ? query.or(
        `buyer_user_id.eq.${userId},and(buyer_user_id.is.null,organization_id.in.(${orgIds.join(",")}))`,
      )
    : query.eq("buyer_user_id", userId);
  const orders = await query;
  if (orders.error) throw orders.error;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/admin/organizations" className="text-xs underline">
        ← Customer accounts
      </Link>
      <PageHeader
        title={profile.data.full_name || "Customer account"}
        description={profile.data.email}
        actions={
          <a
            href={`mailto:${profile.data.email}`}
            className="btn-secondary min-h-11 text-xs"
          >
            Contact by email
          </a>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="!rounded-2xl">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
            Joined {formatDate(profile.data.created_at)}
          </p>
          <p className="mt-2 break-all text-sm">{profile.data.email}</p>
        </Card>
        <Card className="!rounded-2xl lg:col-span-2">
          <h2 className="text-sm font-semibold">Businesses</h2>
          <div className="mt-4 space-y-3">
            {businesses.length ? (
              businesses.map((m) => (
                <div
                  key={m.organization_id}
                  className="flex justify-between text-sm"
                >
                  <Link
                    href={`/admin/organizations/${m.organization_id}`}
                    className="underline"
                  >
                    {m.organization?.name ?? "Business"}
                    {m.organization?.archived_at ? " · archived" : ""}
                  </Link>
                  <span className="text-xs text-[color:var(--text-secondary)]">
                    {m.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[color:var(--text-secondary)]">
                No business yet. This person can explore packages from their
                dashboard.
              </p>
            )}
          </div>
        </Card>
      </div>
      <Card className="!rounded-2xl">
        <h2 className="mb-4 font-semibold">Purchase history</h2>
        <Table>
          <thead>
            <tr>
              {["Website", "Status", "Build", "Plan payment", "Created"].map(
                (h) => (
                  <th key={h} className={thClass}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {orders.data?.length ? (
              orders.data.map((o) => (
                <tr key={o.id}>
                  <td className={tdClass}>
                    <Link
                      href={`/admin/orders?order=${o.id}`}
                      className="font-medium underline"
                    >
                      {o.business_name}
                    </Link>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      {o.project_kind}
                    </p>
                  </td>
                  <td className={tdClass}>
                    <StatusPill
                      tone={
                        o.status === "paid" || o.status === "provisioned"
                          ? "good"
                          : "neutral"
                      }
                    >
                      {o.status}
                    </StatusPill>
                  </td>
                  <td className={tdClass}>
                    {formatMoney(o.build_amount_cents, o.currency)}
                  </td>
                  <td className={tdClass}>
                    {formatMoney(o.plan_amount_cents, o.currency)}
                  </td>
                  <td className={tdClass}>{formatDate(o.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className={`${tdClass} !py-10 text-center text-[color:var(--text-secondary)]`}
                >
                  No purchases recorded.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
