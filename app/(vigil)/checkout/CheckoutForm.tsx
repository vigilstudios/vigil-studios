"use client";

import { track } from "@vercel/analytics";
import { captureCampaignAttribution } from "@/lib/campaign-attribution";
import { useActionState, useState } from "react";
import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { beginCheckout, type CheckoutState } from "@/lib/vigil/actions/checkout";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";
import type { CheckoutPlan } from "@/lib/vigil/queries/checkout";
import { BILLING_PERIODS, billingPeriodByKey, savingsPercent, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import { formatMoney } from "@/lib/vigil/format";
import { CREATOR_CAMPAIGN, creatorCodeOffer, matchesCreatorPromoCode } from "@/lib/creator-campaign";

export type CheckoutFormProps = {
  plans: CheckoutPlan[];
  build: { name: string; amountCents: number | null; currency: string } | null;
  projectKind: "express" | "professional" | "custom";
  templateSlug: string | null;
  templateName: string | null;
  initial: { email?: string; businessName?: string; contactName?: string; planCode?: string; billingPeriod?: string; promotionCode?: string };
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
  const canRedeem = !p.locked && CREATOR_CAMPAIGN.promotion.enabled && p.projectKind !== "custom" && (p.build?.amountCents ?? 0) > 0;
  const initialCode = canRedeem && matchesCreatorPromoCode(p.initial.promotionCode) ? CREATOR_CAMPAIGN.promotion.code : "";
  const [promoDraft, setPromoDraft] = useState(initialCode);
  const [appliedCode, setAppliedCode] = useState(initialCode);
  const [promoError, setPromoError] = useState<string | null>(null);
  const offer = creatorCodeOffer(p.projectKind, p.build?.amountCents ?? null, canRedeem ? appliedCode : null);
  function applyPromo() {
    if (!canRedeem || !matchesCreatorPromoCode(promoDraft)) {
      setAppliedCode("");
      setPromoError("This promo code is not available. Check your code and try again.");
      return;
    }
    setAppliedCode(promoDraft.trim().toUpperCase());
    setPromoDraft(promoDraft.trim().toUpperCase());
    setPromoError(null);
  }
  const setField = (k: keyof typeof fields, v: string | boolean) => setFields((f) => ({ ...f, [k]: v }));
  // Periods offered = those at least one plan can be bought for.
  const periods = BILLING_PERIODS.filter((per) => purchasable.some((x) => x.prices.some((pr) => pr.period === per.key && pr.purchasable)));
  const [periodKey, setPeriodKey] = useState<BillingPeriodKey>(() => (periods.find((x) => x.key === p.initial.billingPeriod) ?? periods[0])?.key ?? "month");
  const period = billingPeriodByKey(periodKey) ?? BILLING_PERIODS[0];
  const plan = p.plans.find((x) => x.code === planCode) ?? null;
  const priceOf = (x: CheckoutPlan) => x.prices.find((pr) => pr.period === periodKey) ?? null;
  const price = plan ? priceOf(plan) : null;
  const buildCents = offer.amountCents ?? 0;
  const dueToday = buildCents + (price?.amountCents ?? 0);
  const perMonth = price ? Math.round(price.amountCents / period.months) : null;

  const tier = WEBSITE_TIERS[p.projectKind];
  const scope = (
    <details className="text-xs text-[color:var(--text-secondary)]">
      <summary className="cursor-pointer py-2 font-medium text-[color:var(--text-primary)]">Website details</summary>
      <p className="mt-1 leading-5">{tier.summary}</p>
      <p className="mt-2 leading-5">{p.projectKind === "custom"
        ? "Your agreed written scope controls pages, bespoke work, revisions and timeline."
        : `${tier.primaryPages === 1 ? "One page" : "Up to 8 primary pages"} · ${tier.revisions} revision ${tier.revisions === 1 ? "round" : "rounds"}.`}</p>
      <ul className="mt-2 space-y-1.5 leading-5">
        {tier.included.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {tier.excluded.length > 0 ? <p className="mt-3 leading-5"><span className="font-medium">Outside this build:</span> {tier.excluded.join("; ")}.</p> : null}
    </details>
  );

  if (purchasable.length === 0) {
    return (
      <div className="space-y-4">
        {scope}
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 text-sm">
          <p className="font-semibold">Online checkout is not switched on yet.</p>
          <p className="mt-2 text-[color:var(--text-secondary)]">Email <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a> and we will set you up by hand.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={() => {
      const attribution = captureCampaignAttribution();
      if (attribution) {
        try { track("creator_checkout_submitted", { ...attribution, package: p.projectKind, plan: planCode, period: periodKey }); } catch { /* Payment must not depend on analytics. */ }
      }
    }} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" noValidate>
      <input type="hidden" name="project_kind" value={p.projectKind} />
      <input type="hidden" name="promotion_code" value={canRedeem ? appliedCode : ""} />
      <input type="hidden" name="template_slug" value={p.templateSlug ?? ""} />
      {p.locked ? (
        <>
          <input type="hidden" name="order_id" value={p.locked.orderId} />
          <input type="hidden" name="checkout_token" value={p.locked.checkoutToken} />
        </>
      ) : null}

      <div className="space-y-6">
        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
          <h2 className="text-base font-semibold">Hosting plan</h2>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Required for hosting. Choose how often you pay.</p>
          {periods.length > 1 ? (
            <div className="mt-3 inline-flex max-w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-0.5" role="radiogroup" aria-label="Billing period">
              {periods.map((per) => {
                const active = per.key === periodKey;
                const save = Math.max(0, ...purchasable.map((x) => savingsPercent(x.prices.find((pr) => pr.period === per.key)?.amountCents ?? 0, per.months, x.monthlyCents) ?? 0));
                return (
                  <button key={per.key} type="button" role="radio" aria-checked={active} onClick={() => setPeriodKey(per.key)} disabled={pending} className={clsx("min-h-11 rounded-md px-2 py-1 text-xs sm:px-3 font-medium transition-colors", active ? "bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}>
                    <span className="flex flex-col items-center gap-1 sm:flex-row">{per.label}
                    {save > 0 ? <span className={clsx("sm:ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-black/15" : "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)]")}>save {save}%</span> : null}</span>
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
                    "relative flex cursor-pointer flex-col rounded-lg border p-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--accent)]",
                    selected ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:border-[color:var(--text-secondary)]",
                    !canBuy && "opacity-60"
                  )}
                >
                  <input type="radio" name="plan_code" value={x.code} checked={selected} disabled={!canBuy || pending} onChange={() => setPlanCode(x.code)} className="sr-only" />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{x.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{xp ? formatMoney(xp.amountCents, x.currency) : "Unavailable"}<span className="text-xs font-normal text-[color:var(--text-secondary)]">{xp ? (period.key === "month" ? "/mo" : ` ${period.every}`) : ""}</span></p>
                      {xp && period.months > 1 ? <p className="text-[11px] text-[color:var(--text-secondary)]">{formatMoney(Math.round(xp.amountCents / period.months), x.currency)}/mo{xSave ? ` · save ${xSave}%` : ""}</p> : null}
                    </div>
                  </div>
                  {!canBuy ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Not available online for this period yet</p> : null}
                </label>
              );
            })}
          </div>
          {plan ? <details className="mt-3 text-xs text-[color:var(--text-secondary)]">
            <summary className="cursor-pointer py-2 font-medium text-[color:var(--text-primary)]">What’s included in {plan.name}</summary>
            {plan.tagline ? <p className="mt-1 leading-5">{plan.tagline}</p> : null}
            <ul className="mt-2 space-y-2">
              {plan.includes.map((item) => <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--accent)]" />{item}</li>)}
            </ul>
            <p className="mt-3 leading-5">Updates and tools follow this plan’s configured allowances. Features marked “in development” are not yet available.</p>
          </details> : null}
          {issues.plan_code ? <p className="mt-1 text-xs text-[#ef4444]">{issues.plan_code[0]}</p> : null}
        </section>

        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
          <h2 className="text-base font-semibold">Your details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="business_name" className={labelClass}>Business name</label>
              <input id="business_name" name="business_name" value={fields.businessName} onChange={(e) => setField("businessName", e.target.value)} className={inputClass} autoComplete="organization" placeholder="Business name" required disabled={pending} />
              {issues.business_name ? <p className="mt-1 text-xs text-[#ef4444]">{issues.business_name[0]}</p> : null}
            </div>
            <div>
              <label htmlFor="contact_name" className={labelClass}>Your name</label>
              <input id="contact_name" name="contact_name" value={fields.contactName} onChange={(e) => setField("contactName", e.target.value)} className={inputClass} autoComplete="name" placeholder="Full name" disabled={pending} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" name="email" type="email" value={fields.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} autoComplete="email" placeholder="you@yourbusiness.com" required disabled={pending} />
              <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Used to sign in to your dashboard.</p>
              {issues.email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.email[0]}</p> : null}
            </div>
          </div>
        </section>

      </div>

      <aside className="h-fit rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 lg:sticky lg:top-6">
        <h2 className="text-base font-semibold">Order summary</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {p.build ? (
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--text-secondary)]">{p.build.name}<span className="mt-0.5 block text-[11px]">One-time build{p.templateName ? ` · ${p.templateName}` : ""}</span></dt>
              <dd className="shrink-0 text-right font-medium">{offer.percentOff && offer.originalAmountCents != null ? <del className="block text-xs text-[color:var(--text-secondary)]">{formatMoney(offer.originalAmountCents, p.build.currency)}</del> : null}{offer.amountCents !== null ? formatMoney(offer.amountCents, p.build.currency) : "Quoted"}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--text-secondary)]">{plan ? `${plan.name} · ${period.label.toLowerCase()}` : "Vigil plan"}</dt>
            <dd className="font-medium">{price && plan ? formatMoney(price.amountCents, plan.currency) : "Unavailable"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[color:var(--border)] pt-3 text-lg">
            <dt className="font-semibold">Due today</dt>
            <dd className="font-semibold">{formatMoney(dueToday, plan?.currency ?? "usd")}</dd>
          </div>
        </dl>
        <div className="mt-3 border-t border-[color:var(--border)] pt-1">{scope}</div>
        {canRedeem ? <div className="mt-4 border-t border-[color:var(--border)] pt-4">
          <label htmlFor="promotion_code" className={labelClass}>Promo code</label>
          <div className="mt-1 flex gap-2">
            <input id="promotion_code" value={promoDraft} maxLength={32} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Enter your code" disabled={pending} aria-describedby="promotion_code_status" aria-invalid={Boolean(promoError || issues.promotion_code)} className={clsx(inputClass, "min-w-0 flex-1")} onChange={(e) => { setPromoDraft(e.target.value); setAppliedCode(""); setPromoError(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }} />
            <button type="button" disabled={pending} onClick={applyPromo} className="btn-secondary shrink-0 !px-3 !py-2 text-xs">Apply</button>
          </div>
          <p id="promotion_code_status" role="status" className={clsx("mt-2 text-xs", promoError || issues.promotion_code ? "text-[#ef4444]" : "text-[color:var(--text-secondary)]")}>
            {promoError ?? issues.promotion_code?.[0] ?? (offer.percentOff ? `${appliedCode} applied · ${offer.percentOff}% off the build` : "Discounts apply to the one-time build only.")}
          </p>
        </div> : null}
        <p className="mt-4 leading-5 text-[11px] text-[color:var(--text-secondary)]">
          {price && plan ? `Then ${formatMoney(price.amountCents, plan.currency)} ${period.every}${perMonth && period.months > 1 ? ` (${formatMoney(perMonth, plan.currency)}/mo)` : ""}, cancel any time.` : "Your plan renews automatically; cancel any time."} Sales tax is added at payment where it applies.
        </p>
        <div className="mt-4 border-t border-[color:var(--border)] pt-4">
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
        <button type="submit" className="btn-primary mt-4 w-full text-sm" disabled={pending || !price?.purchasable}>
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          {pending ? "Opening payment…" : "Continue to payment"}
        </button>
        <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)]">Secure payment with Stripe</p>
      </aside>
    </form>
  );
}
