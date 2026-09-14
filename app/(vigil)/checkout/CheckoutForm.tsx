"use client";

import { useActionState, useState } from "react";
import { Check, Lock } from "lucide-react";
import { clsx } from "clsx";
import { beginCheckout, type CheckoutState } from "@/lib/vigil/actions/checkout";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";
import type { CheckoutPlan } from "@/lib/vigil/queries/checkout";
import { formatMoney } from "@/lib/vigil/format";

export type CheckoutFormProps = {
  plans: CheckoutPlan[];
  build: { name: string; amountCents: number | null; currency: string } | null;
  projectKind: "express" | "professional" | "custom";
  templateSlug: string | null;
  templateName: string | null;
  initial: { email?: string; businessName?: string; contactName?: string; planCode?: string };
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
  const plan = p.plans.find((x) => x.code === planCode) ?? null;
  const buildCents = p.build?.amountCents ?? 0;
  const dueToday = buildCents + (plan?.monthlyCents ?? 0);

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
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {p.plans.map((x) => {
              const selected = x.code === planCode;
              return (
                <label
                  key={x.id}
                  className={clsx(
                    "relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                    selected ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:border-[color:var(--text-secondary)]",
                    !x.purchasable && "opacity-60"
                  )}
                >
                  <input type="radio" name="plan_code" value={x.code} checked={selected} disabled={!x.purchasable || pending} onChange={() => setPlanCode(x.code)} className="sr-only" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{x.name}</p>
                      {x.tagline ? <p className="text-xs text-[color:var(--text-secondary)]">{x.tagline}</p> : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{x.monthlyCents !== null ? `${formatMoney(x.monthlyCents, x.currency)}/mo` : "—"}</p>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-[color:var(--text-secondary)]">
                    {x.includes.map((i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--accent)]" /> {i}
                      </li>
                    ))}
                  </ul>
                  {!x.purchasable ? <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">Not available online yet</p> : null}
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
              <input id="business_name" name="business_name" defaultValue={p.initial.businessName ?? ""} className={inputClass} placeholder="Marlow & Fen" required disabled={pending} />
              {issues.business_name ? <p className="mt-1 text-xs text-[#ef4444]">{issues.business_name[0]}</p> : null}
            </div>
            <div>
              <label htmlFor="contact_name" className={labelClass}>Your name</label>
              <input id="contact_name" name="contact_name" defaultValue={p.initial.contactName ?? ""} className={inputClass} placeholder="Alex Rivera" disabled={pending} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email (this becomes your sign-in)</label>
              <input id="email" name="email" type="email" defaultValue={p.initial.email ?? ""} className={inputClass} placeholder="you@yourbusiness.com" required disabled={pending} />
              {issues.email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.email[0]}</p> : null}
            </div>
          </div>
        </section>

        <section>
          <label className="flex items-start gap-2 text-xs text-[color:var(--text-secondary)]">
            <input type="checkbox" name="agree" className="mt-0.5" disabled={pending} />
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
            <dt className="text-[color:var(--text-secondary)]">{plan ? plan.name : "Vigil plan"}</dt>
            <dd className="font-medium">{plan?.monthlyCents !== null && plan ? `${formatMoney(plan.monthlyCents, plan.currency)}/mo` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[color:var(--border)] pt-2 text-base">
            <dt className="font-semibold">Due today</dt>
            <dd className="font-semibold">{formatMoney(dueToday, plan?.currency ?? "usd")}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-[color:var(--text-secondary)]">
          Then {plan?.monthlyCents !== null && plan ? `${formatMoney(plan.monthlyCents, plan.currency)} a month` : "your plan price monthly"}, cancel any time. Taxes are calculated at payment if they apply.
        </p>
        <button type="submit" className="btn-primary mt-4 w-full text-sm" disabled={pending || !plan}>
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          {pending ? "Opening secure payment…" : "Continue to secure payment"}
        </button>
        <p className="mt-2 text-center text-[11px] text-[color:var(--text-secondary)]">Payment is handled by Stripe. We never see your card.</p>
      </aside>
    </form>
  );
}
