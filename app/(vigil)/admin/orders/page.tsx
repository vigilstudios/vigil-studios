import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/vigil/ActionControls";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { Panel } from "@/components/vigil/widgets";
import { cancelOrder, markOrderPaidAndProvision } from "@/lib/vigil/actions/admin-orders";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/vigil/format";
import { describePrice } from "@/lib/vigil/billing-periods";
import { AVAILABLE_EXPRESS_TEMPLATES } from "@/lib/constants";
import { NewOrderForm } from "./NewOrderForm";

export const metadata: Metadata = { title: "Orders" };

const tone = (s: string) => (s === "provisioned" ? "good" : s === "paid" ? "info" : s === "pending" ? "warn" : s === "failed" ? "bad" : "neutral");

export default async function OrdersPage() {
  await requireStaff("/admin/orders");
  const supabase = await createClient();
  const [{ data: orders }, { data: plans }] = await Promise.all([
    supabase.from("orders").select("*, plan:plans(code, name), price:plan_prices(interval, interval_count), organization:organizations(id, name)").order("created_at", { ascending: false }).limit(200),
    supabase.from("plans").select("code, name").eq("is_active", true).order("tier_rank"),
  ]);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" description="Every purchase intent: self-serve from the catalogue or a link you sent. Paid orders provision themselves; anything stuck can be pushed through here." />

      <Panel title="Send a checkout link">
        <p className="text-xs text-[color:var(--text-secondary)]">Create a private checkout for a custom quote, a Professional customer who prefers a prepared order, or an Express site scoped on a call. They pay on the link; the account provisions itself.</p>
        <NewOrderForm plans={plans ?? []} templates={AVAILABLE_EXPRESS_TEMPLATES.map((t) => ({ slug: t.slug, name: t.industry }))} />
      </Panel>

      <Table>
        <thead>
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Order</th>
            <th className={thClass}>Amounts</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Created</th>
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(orders ?? []).map((o) => (
            <tr key={o.id}>
              <td className={tdClass}>
                <div className="font-medium">{o.business_name}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{o.contact_name ? `${o.contact_name} · ` : ""}{o.email}</div>
                {o.organization ? <Link href={`/admin/organizations/${o.organization.id}`} className="text-xs underline">Open customer</Link> : null}
              </td>
              <td className={tdClass}>
                <div>{titleCase(o.project_kind)}{o.template_slug ? ` · ${o.template_slug}` : ""}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{o.plan?.name ?? "No plan"}</div>
                {o.status === "pending" && appUrl ? (
                  <code className="mt-1 block max-w-[18rem] truncate text-[10px] text-[color:var(--text-secondary)]" title={`${appUrl}/checkout/${o.checkout_token}`}>{`${appUrl}/checkout/${o.checkout_token}`}</code>
                ) : null}
              </td>
              <td className={tdClass}>
                <div>Build {o.build_amount_cents !== null ? formatMoney(o.build_amount_cents, o.currency) : "quoted"}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">Plan {o.plan_amount_cents !== null ? describePrice({ amount_cents: o.plan_amount_cents, currency: o.currency, interval: o.price?.interval ?? "month", interval_count: o.price?.interval_count ?? 1 }, formatMoney) : "at checkout"}</div>
              </td>
              <td className={tdClass}>
                <StatusPill tone={tone(o.status)}>{titleCase(o.status)}</StatusPill>
                {o.error ? <div className="mt-1 text-xs text-[#ef4444]">{(o.error as { message?: string }).message}</div> : null}
              </td>
              <td className={tdClass}>
                <div>{formatDate(o.created_at)}</div>
                {o.paid_at ? <div className="text-xs text-[color:var(--text-secondary)]">paid {formatDate(o.paid_at)}</div> : null}
              </td>
              <td className={tdClass}>
                <div className="flex flex-col gap-1">
                  {o.status === "pending" || o.status === "paid" ? (
                    <ActionButton variant="link" action={markOrderPaidAndProvision.bind(null, o.id)} confirmText={o.status === "pending" ? "Mark as paid off-platform and provision the account?" : "Provision this paid order now?"}>
                      {o.status === "pending" ? "Mark paid & provision" : "Provision now"}
                    </ActionButton>
                  ) : null}
                  {o.status === "pending" ? <ActionButton variant="danger" action={cancelOrder.bind(null, o.id)} confirmText="Expire this checkout link?">Expire link</ActionButton> : null}
                </div>
              </td>
            </tr>
          ))}
          {(orders ?? []).length === 0 ? <tr><td className={tdClass} colSpan={6}>No orders yet.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
