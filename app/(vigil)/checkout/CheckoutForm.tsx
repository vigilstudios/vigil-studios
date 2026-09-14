"use client";

import { useActionState, useState } from "react";
import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { beginCheckout, type CheckoutState } from "@/lib/vigil/actions/checkout";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";
import type { CheckoutPlan } from "@/lib/vigil/queries/checkout";
import { BILLING_PERIODS, billingPeriodByKey, savingsPercent, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { formatMoney } from "@/lib/vigil/format";

export type CheckoutFormProps = {
  plans: CheckoutPlan[];
  build: { name: string; amountCents: number | null; currency: string } | null;
  projectKind: "express" | "professional" | "custom";
  templateSlug: string | null;
  templateName: string | null;
  initial: { email?: string; businessName?: string; contactName?: string; planCode?: string; billingPeriod?: string };
  locked: { orderId: string; checkoutToken: string } | null;
  termsUrl: string | null;
  refundNote: string | null;
};

export function CheckoutForm(p: CheckoutFormProps) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(beginCheckout, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};
  const purchasable = p.plans.filter((x) => x.purchasable);
  const defaultPlan = purchasable.find((x) => x.code === p.initial.planCode) ?? purchasable[0] ?? null;
  const [planCode, setPlanCode] = useState<string>(defaultPlan?.code ?? "");
  // Controlled so a server-side error does not wipe what the buyer typed.
  const [fields, setFields] = useState({ businessName: p.initial.businessName ?? "", contactName: p.initial.contactName ?? "", email: p.initial.email ?? "", agree: false });
  const setField = (k: keyof typeof fields, v: string | boolean) => setFields((f) => ({ ...f, [k]: v }));
  // Periods offered = those at least one plan can be bought for.
  const periods = BILLING_PERIODS.filter((per) => purchasable.some((x) => x.prices.some((pr) => pr.period === per.key && pr.purchasable)));
  const [periodKey, setPeriodKey] = useState<BillingPeriodKey>(() => (periods.find((x) => x.key === p.initial.billingPeriod) ?? periods[0])?.key ?? "month");
  const period = billingPeriodByKey(periodKey) ?? BILLING_PERIODS[0];
  const plan = p.plans.find((x) => x.code === planCode) ?? null;
  const priceOf = (x: CheckoutPlan) => x.prices.find((pr) => pr.period === periodKey) ?? null;
  const price = plan ? priceOf(plan) : null;
  const buildCents = p.build?.amountCents ?? 0;
  const dueToday = buildCents + (price?.amountCents ?? 0);
  const perMonth = price ? Math.round(price.amountCents / period.months) : null;

  if (purchasable.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 text-sm">
        <p className="font-semibold">Online checkout is not switched on yet.</p>
        <p className="mt-2 text-[color:var(--text-secondary)]">Email <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a> and we will set you up by hand.</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]" noValidate>
      <input type="hidden" name="project_kind" value={p.projectKind} />
      <input type="hidden" name="template_slug" value={p.templateSlug ?? ""} />
      {p.locked ? (
        <>
          <input type="hidden" name="order_id" value={p.locked.orderId} />
          <input type="hidden" name="checkout_token" value={p.locked.checkoutToken} />
        </>
      ) : null}

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold">1. Choose your Vigil plan</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Every Vigil-hosted website includes the Vigil platform. Pick how much you want us to take off your plate; you can change it later.</p>
          {periods.length > 1 ? (
            <div className="mt-3 inline-flex rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-0.5" role="radiogroup" aria-label="Billing period">
              {periods.map((per) => {
                const active = per.key === periodKey;
                const save = Math.max(0, ...purchasable.map((x) => savingsPercent(x.prices.find((pr) => pr.period === per.key)?.amountCents ?? 0, per.months, x.monthlyCents) ?? 0));
                return (
                  <button key={per.key} type="button" role="radio" aria-checked={active} onClick={() => setPeriodKey(per.key)} disabled={pending} className={clsx("min-h-10 rounded-md px-3 text-xs font-medium transition-colors", active ? "bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}>
                    {per.label}
                    {save > 0 ? <span className={clsx("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-black/15" : "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)]")}>save {save}%</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          <input type="hidden" name="billing_period" value={periodKey} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {p.plans.map((x) => {
              const selected = x.code === planCode;
              const xp = priceOf(x);
              const xSave = xp ? savingsPercent(xp.amountCents, period.months, x.monthlyCents) : null;
              const canBuy = Boolean(xp?.purchasable);
              return (
                <label
                  key={x.id}
                  className={clsx(
                    "relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                    selected ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:border-[color:var(--text-secondary)]",
                    !canBuy && "opacity-60"
                  )}
                >
                  <input type="radio" name="plan_code" value={x.code} checked={selected} disabled={!canBuy || pending} onChange={() => setPlanCode(x.code)} className="sr-only" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{x.name}</p>
                      {x.tagline ? <p className="text-xs text-[color:var(--text-secondary)]">{x.tagline}</p> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{xp ? formatMoney(xp.amountCents, x.currency) : "—"}<span className="text-xs font-normal text-[color:var(--text-secondary)]">{xp ? (period.key === "month" ? "/mo" : ` ${period.every}`) : ""}</span></p>
                      {xp && period.months > 1 ? <p className="text-[11px] text-[color:var(--text-secondary)]">{formatMoney(Math.round(xp.amountCents / period.months), x.currency)}/mo{xSave ? ` · save ${xSave}%` : ""}</p> : null}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-[color:var(--text-secondary)]">
                    {x.includes.map((i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--accent)]" /> {i}
                      </li>
                    ))}
                  </ul>
                  {!canBuy ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Not available online for this period yet</p> : null}
                </label>
              );
            })}
          </div>
          {issues.plan_code ? <p className="mt-1 text-xs text-[#ef4444]">{issues.plan_code[0]}</p> : null}
        </section>

        <section>
          <h2 className="text-sm font-semibold">2. About your business</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="business_name" className={labelClass}>Business name</label>
              <input id="business_name" name="business_name" value={fields.businessName} onChange={(e) => setField("businessName", e.target.value)} className={inputClass} placeholder="Marlow & Fen" required disabled={pending} />
              {issues.business_name ? <p className="mt-1 text-xs text-[#ef4444]">{issues.business_name[0]}</p> : null}
            </div>
            <div>
              <label htmlFor="contact_name" className={labelClass}>Your name</label>
              <input id="contact_name" name="contact_name" value={fields.contactName} onChange={(e) => setField("contactName", e.target.value)} className={inputClass} placeholder="Alex Rivera" disabled={pending} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email (this becomes your sign-in)</label>
              <input id="email" name="email" type="email" value={fields.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} placeholder="you@yourbusiness.com" required disabled={pending} />
              {issues.email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.email[0]}</p> : null}
            </div>
          </div>
        </section>

        <section>
          <label className="flex items-start gap-2 text-xs text-[color:var(--text-secondary)]">
            <input type="checkbox" name="agree" checked={fields.agree} onChange={(e) => setField("agree", e.target.checked)} className="mt-0.5" disabled={pending} />
            <span>
              I agree to the Vigil Studios {p.termsUrl ? <a className="underline" href={p.termsUrl} target="_blank" rel="noreferrer">service agreement</a> : "service agreement"}.
              {p.refundNote ? ` ${p.refundNote}` : ""}
            </span>
          </label>
          {issues.agree ? <p className="mt-1 text-xs text-[#ef4444]">{issues.agree[0]}</p> : null}
        </section>

        <FormError message={state && !state.ok ? state.error : null} />
      </div>

      <aside className="h-fit rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 lg:sticky lg:top-6">
        <h2 className="text-sm font-semibold">Your order</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {p.build ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--text-secondary)]">{p.build.name}{p.templateName ? ` · ${p.templateName}` : ""}</dt>
              <dd className="font-medium">{p.build.amountCents !== null ? formatMoney(p.build.amountCents, p.build.currency) : "Quoted"}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--text-secondary)]">{plan ? `${plan.name} · ${period.label.toLowerCase()}` : "Vigil plan"}</dt>
            <dd className="font-medium">{price && plan ? formatMoney(price.amountCents, plan.currency) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[color:var(--border)] pt-2 text-base">
            <dt className="font-semibold">Due today</dt>
            <dd className="font-semibold">{formatMoney(dueToday, plan?.currency ?? "usd")}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">
          {price && plan ? `Then ${formatMoney(price.amountCents, plan.currency)} ${period.every}${perMonth && period.months > 1 ? ` (${formatMoney(perMonth, plan.currency)}/mo)` : ""}, cancel any time.` : "Your plan renews automatically; cancel any time."} Sales tax is added at payment where it applies.
        </p>
        <button type="submit" className="btn-primary mt-4 w-full text-sm" disabled={pending || !price?.purchasable}>
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          {pending ? "Opening secure payment…" : "Continue to secure payment"}
        </button>
        <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)]">Payment is handled by Stripe. We never see your card.</p>
      </aside>
    </form>
  );
}
