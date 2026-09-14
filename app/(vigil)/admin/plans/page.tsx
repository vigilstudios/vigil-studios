import type { Metadata } from "next";
import { ActionButton, ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader, Table, inputClass, labelClass, tdClass, thClass } from "@/components/vigil/ui";
import { grantStaff, revokeStaff, updatePlan } from "@/lib/vigil/actions/admin";
import { syncPrices, updateBuildPrice } from "@/lib/vigil/actions/admin-orders";
import { BILLING_PERIODS, type BillingPeriod } from "@/lib/vigil/billing-periods";
import { readProviderConfig } from "@/lib/vigil/providers/registry";
import { formatMoney } from "@/lib/vigil/format";
import { requireAdmin } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/vigil/queries/admin";
import { PlanFeatureCell } from "./PlanFeatureCell";

export const metadata: Metadata = { title: "Plans & staff" };

/**
 * Product policy lives here, not in code: plan names, visibility, monthly
 * price (NULL until approved), and every per-plan feature value. Admin only.
 */
export default async function PlansPage() {
  const admin = await requireAdmin("/admin/plans");
  const catalog = await getCatalog();
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff_members")
    .select("user_id, role, created_at, profile:profiles!staff_members_user_id_fkey(full_name, email)")
    .order("created_at");

  const priceFor = (planId: string, period: BillingPeriod) => catalog.prices.find((p) => p.plan_id === planId && p.currency === "usd" && p.interval === period.interval && p.interval_count === period.intervalCount);
  const linkFor = (entityType: string, entityId: string) => catalog.priceLinks.find((l) => l.entity_type === entityType && l.entity_id === entityId)?.external_id ?? null;
  const billing = readProviderConfig().billing;
  const valueFor = (planId: string, code: string) => catalog.planFeatures.find((pf) => pf.plan_id === planId && pf.feature_code === code)?.value;

  return (
    <div>
      <PageHeader
        title="Plans, entitlements and staff"
        description="Nothing here is hard-coded. Empty prices and limits mean “not approved yet” and render as such for customers."
        actions={<ActionButton variant="primary" action={syncPrices} confirmText={`Create or update prices in ${billing === "null" ? "the in-memory provider" : billing}?`}>Sync prices to {billing === "null" ? "provider" : billing}</ActionButton>}
      />

      <Card>
        <h2 className="text-base font-semibold">One-time build prices</h2>
        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Charged once at checkout alongside the first month of the plan. Leave empty for “quoted separately”.</p>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Build</th>
              <th className={thClass}>Amount (USD)</th>
              <th className={thClass}>Active</th>
              <th className={thClass}>Provider price</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody>
            {catalog.builds.map((b) => (
              <tr key={b.id}>
                <td className={tdClass}>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-[color:var(--text-secondary)]">{b.description}</div>
                </td>
                <td className={tdClass} colSpan={3}>
                  <ActionForm action={updateBuildPrice.bind(null, b.id)} submitLabel="Save" className="flex flex-wrap items-center gap-3">
                    <input name="amount" inputMode="decimal" defaultValue={b.amount_cents !== null ? (b.amount_cents / 100).toFixed(2) : ""} placeholder="quoted" className={`${inputClass} !w-32`} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={b.is_active} /> Active</label>
                    <code className="text-[11px] text-[color:var(--text-secondary)]">{linkFor("build_price", b.id) ?? "not synced"}</code>
                  </ActionForm>
                </td>
                <td className={tdClass}>{b.amount_cents !== null ? formatMoney(b.amount_cents, b.currency) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.plans.map((plan) => (
          <Card key={plan.id}>
            <ActionForm action={updatePlan.bind(null, plan.id)} submitLabel="Save plan" className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center justify-between">
                <h2 className="text-base font-semibold"><code className="text-xs">{plan.code}</code> · rank {plan.tier_rank}</h2>
              </div>
              <div>
                <label className={labelClass} htmlFor={`name-${plan.id}`}>Name</label>
                <input id={`name-${plan.id}`} name="name" defaultValue={plan.name} className={inputClass} required />
              </div>
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
                {BILLING_PERIODS.map((period) => {
                  const row = priceFor(plan.id, period);
                  return (
                    <div key={period.key}>
                      <label className={labelClass} htmlFor={`price-${plan.id}-${period.key}`}>{period.label} price (USD)</label>
                      <input id={`price-${plan.id}-${period.key}`} name={`amount_${period.key}`} inputMode="decimal" defaultValue={row?.amount_cents != null ? (row.amount_cents / 100).toFixed(2) : ""} placeholder="not approved" className={inputClass} />
                      <p className="mt-1 truncate font-mono text-[10px] text-[color:var(--text-secondary)]" title={row ? linkFor("plan_price", row.id) ?? "" : ""}>{row?.amount_cents != null ? linkFor("plan_price", row.id) ?? "not synced to provider" : ""}</p>
                    </div>
                  );
                })}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`tagline-${plan.id}`}>Tagline</label>
                <input id={`tagline-${plan.id}`} name="tagline" defaultValue={plan.tagline ?? ""} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`desc-${plan.id}`}>Description</label>
                <textarea id={`desc-${plan.id}`} name="description" defaultValue={plan.description ?? ""} rows={2} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={plan.is_active} /> Active</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" defaultChecked={plan.is_public} /> Shown publicly</label>
            </ActionForm>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Entitlements by plan</h2>
        <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Values are JSON. Leave a cell blank to fall back to the feature default. Booleans: true/false; limits: a number; text: &quot;quoted&quot;.</p>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Feature</th>
              <th className={thClass}>Default</th>
              {catalog.plans.map((p) => (
                <th key={p.id} className={thClass}>{p.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.features.map((f) => (
              <tr key={f.code}>
                <td className={tdClass}>
                  <div className="font-medium">{f.name}</div>
                  <div className="font-mono text-xs text-[color:var(--text-secondary)]">{f.code} · {f.value_kind}</div>
                </td>
                <td className={tdClass}><code className="text-xs">{JSON.stringify(f.default_value)}</code></td>
                {catalog.plans.map((p) => (
                  <td key={p.id} className={tdClass}>
                    <PlanFeatureCell planId={p.id} featureCode={f.code} value={valueFor(p.id, f.code)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Vigil staff</h2>
        <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
          {(staff ?? []).map((s) => (
            <li key={s.user_id} className="flex items-center justify-between gap-2 py-2">
              <span>{s.profile?.full_name ?? "—"} <span className="text-[color:var(--text-secondary)]">· {s.profile?.email} · {s.role}</span></span>
              {s.user_id !== admin.user.id ? <ActionButton variant="danger" action={revokeStaff.bind(null, s.user_id)} confirmText="Remove staff access?">Revoke</ActionButton> : <span className="text-xs text-[color:var(--text-secondary)]">you</span>}
            </li>
          ))}
        </ul>
        <ActionForm action={grantStaff} submitLabel="Grant access" className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem]">
          <input name="email" type="email" placeholder="colleague@vigilstudios.co (must have signed in once)" className={inputClass} required />
          <select name="role" className={inputClass} defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </ActionForm>
      </Card>
    </div>
  );
}
