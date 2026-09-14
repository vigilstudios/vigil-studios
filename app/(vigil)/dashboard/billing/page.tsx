import type { Metadata } from "next";
import { Card, DefinitionList, EmptyState, PageHeader, StatusPill } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { resolveEntitlements } from "@/lib/vigil/entitlements";
import { describePrice } from "@/lib/vigil/billing-periods";
import { formatDate, formatMoney, titleCase } from "@/lib/vigil/format";
import { describeSubscriptionStatus } from "@/lib/vigil/lifecycle";
import { getOrgSubscription } from "@/lib/vigil/queries/dashboard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import { findExternalId, providerEnum } from "@/lib/vigil/services/provider-links";
import { ManageBillingButton } from "./ManageBillingButton";

export const metadata: Metadata = { title: "Subscription" };

export default async function BillingPage() {
  const ctx = await requireOrgContext("/dashboard/billing");
  const [subscription, ent] = await Promise.all([getOrgSubscription(ctx.organization.id), resolveEntitlements(ctx.organization.id)]);

  const supabase = await createClient();
  const { data: features } = await supabase.from("features").select("code, name, value_kind").order("code");
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;

  // Online billing exists for this organization when the provider knows the customer.
  let portalAvailable = false;
  if (hasAdminClient() && subscription) {
    const provider = getBillingProvider();
    const customerId = await findExternalId(createAdminClient(), { provider: providerEnum(provider.name), resourceKind: "customer", entityType: "organization", entityId: ctx.organization.id }).catch(() => null);
    portalAvailable = Boolean(customerId) && provider.name !== "null";
  }

  return (
    <div>
      <PageHeader title="Subscription and billing" description="Your Vigil plan funds hosting, security, platform access and the service level you chose." />

      {!subscription ? (
        <EmptyState
          title="No active subscription"
          description="Every website hosted by Vigil needs an active Vigil plan. Vigil Studios sets this up with you during onboarding."
        />
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Current plan</p>
              <h2 className="mt-1 text-xl font-semibold">{subscription.plan?.name ?? "Vigil"}</h2>
              {subscription.plan?.tagline ? <p className="text-sm text-[color:var(--text-secondary)]">{subscription.plan.tagline}</p> : null}
            </div>
            <StatusPill tone={describeSubscriptionStatus(subscription.status).tone}>{describeSubscriptionStatus(subscription.status).label}</StatusPill>
          </div>
          {describeSubscriptionStatus(subscription.status).hint ? (
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{describeSubscriptionStatus(subscription.status).hint}</p>
          ) : null}
          <DefinitionList
            items={[
              {
                label: "Price",
                value: subscription.price ? describePrice(subscription.price, formatMoney) : "Set by agreement",
              },
              { label: "Current period", value: subscription.current_period_end ? `Renews ${formatDate(subscription.current_period_end)}` : "—" },
              { label: "Cancels at period end", value: subscription.cancel_at_period_end ? "Yes" : "No" },
              { label: "Trial ends", value: subscription.trial_end ? formatDate(subscription.trial_end) : "—" },
            ]}
          />
          {portalAvailable && canManage ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ManageBillingButton />
              <p className="text-xs text-[color:var(--text-secondary)]">Invoices, receipts, payment method and cancellation, on a secure page from our payment provider.</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[color:var(--text-secondary)]">
              {portalAvailable ? "Only the account owner or a manager can change billing." : "Invoices and payment methods are managed with Vigil Studios for this account. Write to hello@vigilstudios.co for any billing change."}
            </p>
          )}
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="text-base font-semibold">What is included</h2>
        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          Resolved from your plan{ent.byCode.size && [...ent.byCode.values()].some((e) => e.source === "override") ? " and adjustments made by Vigil Studios" : ""}.
        </p>
        <DefinitionList
          items={(features ?? []).map((f) => {
            const e = ent.byCode.get(f.code);
            let value: string;
            if (f.value_kind === "boolean") value = e?.value === true ? "Included" : "—";
            else if (f.value_kind === "limit") value = typeof e?.value === "number" ? String(e.value) : "To be confirmed";
            else value = typeof e?.value === "string" ? titleCase(e.value) : "To be confirmed";
            return { label: f.name, value };
          })}
        />
      </Card>
    </div>
  );
}
