import type { Metadata } from "next";
import Link from "next/link";
import { TransitionSelect } from "@/components/vigil/ActionControls";
import { PageHeader, StatusPill, Table, tdClass, thClass } from "@/components/vigil/ui";
import { setSubscriptionStatus } from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { formatDate, formatMoney, titleCase } from "@/lib/vigil/format";
import { describePrice } from "@/lib/vigil/billing-periods";
import { subscriptionTransitions } from "@/lib/vigil/lifecycle";
import { listSubscriptions } from "@/lib/vigil/queries/admin";

export const metadata: Metadata = { title: "Subscriptions" };

const tone = (s: string) => (s === "active" || s === "trialing" ? "good" : s === "canceled" ? "neutral" : "warn");

export default async function SubscriptionsPage() {
  await requireStaff("/admin/subscriptions");
  const subs = await listSubscriptions();
  return (
    <div>
      <PageHeader title="Subscriptions" description="Vigil plans by customer. Provider mappings live in provider_links and are never shown to customers." />
      <Table>
        <thead>
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Plan</th>
            <th className={thClass}>Price</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Period end</th>
            <th className={thClass}>Transition</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id}>
              <td className={tdClass}><Link href={`/admin/organizations/${s.organization?.id}`} className="underline">{s.organization?.name}</Link></td>
              <td className={tdClass}>{s.plan?.name}</td>
              <td className={tdClass}>{s.price ? describePrice(s.price, formatMoney) : "—"}</td>
              <td className={tdClass}>
                <StatusPill tone={tone(s.status)}>{titleCase(s.status)}</StatusPill>
                {s.cancel_at_period_end ? <div className="text-xs text-[color:var(--text-secondary)]">cancels at period end</div> : null}
              </td>
              <td className={tdClass}>{formatDate(s.current_period_end)}</td>
              <td className={tdClass}><TransitionSelect current={s.status} options={subscriptionTransitions[s.status]} action={setSubscriptionStatus.bind(null, s.id)} /></td>
            </tr>
          ))}
          {subs.length === 0 ? <tr><td className={tdClass} colSpan={6}>No subscriptions yet.</td></tr> : null}
        </tbody>
      </Table>
    </div>
  );
}
