"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, Check } from "lucide-react";
import { BILLING_PERIODS, savingsPercent, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { formatMoney } from "@/lib/vigil/format";
import type { PublicPlan } from "@/lib/vigil/queries/public-pricing";
import { PLAN_COPY } from "@/lib/site-copy";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { Chip } from "./primitives";

/**
 * The four Vigil plans with a Monthly / Annual / 3 years toggle. Numbers are
 * the rows the checkout sells; this component never invents one. Compact
 * mode is the home-page teaser; full mode is the pricing page.
 */
export function PricingTable({ plans, compact, planHref = "/express" }: { plans: PublicPlan[]; compact?: boolean; planHref?: string }) {
  const periods = BILLING_PERIODS.filter((per) => plans.some((p) => p.prices[per.key] != null));
  const [periodKey, setPeriodKey] = useState<BillingPeriodKey>(periods[0]?.key ?? "month");
  const period = BILLING_PERIODS.find((p) => p.key === periodKey) ?? BILLING_PERIODS[0];
  const highlight = "care";

  if (plans.length === 0) {
    return <p className="text-sm text-[color:var(--text-secondary)]">Plan prices are being finalised. Email hello@vigilstudios.co and we will send them over.</p>;
  }

  return (
    <div>
      {periods.length > 1 ? (
        <div className={clsx("flex", compact ? "justify-start" : "justify-center")}>
        <div className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1" role="radiogroup" aria-label="Billing period">
          {periods.map((per) => {
            const active = per.key === periodKey;
            const save = Math.max(0, ...plans.map((p) => savingsPercent(p.prices[per.key] ?? 0, per.months, p.prices.month ?? null) ?? 0));
            return (
              <button key={per.key} type="button" role="radio" aria-checked={active} onClick={() => setPeriodKey(per.key)} className={clsx("min-h-10 rounded-lg px-4 text-sm font-medium transition-colors", active ? "bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}>
                {per.label}
                {save > 0 ? <span className={clsx("ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", active ? "bg-black/15" : "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)]")}>save {save}%</span> : null}
              </button>
            );
          })}
        </div>
        </div>
      ) : null}

      <div className={clsx("mt-8 grid gap-4", compact ? "sm:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4")}>
        {plans.map((p) => {
          const cents = p.prices[periodKey];
          const copy = PLAN_COPY[p.code];
          const perMonth = cents != null ? Math.round(cents / period.months) : null;
          const save = cents != null ? savingsPercent(cents, period.months, p.prices.month ?? null) : null;
          const featured = p.code === highlight;
          return (
            <div key={p.code} className={clsx("relative flex flex-col rounded-2xl border p-6", featured ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--bg-surface))]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)]")}>
              {featured ? <span className="absolute -top-3 left-6"><Chip tone="accent">Most chosen</Chip></span> : null}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{p.name.replace(/^Vigil /, "")}</h3>
                  {p.tagline ? <p className="text-sm text-[color:var(--text-secondary)]">{p.tagline}</p> : null}
                </div>
                {copy?.virtue ? <VirtueOrb size="sm" label="Includes Virtue" /> : null}
              </div>
              <div className="mt-5">
                {cents != null ? (
                  <>
                    <p className="whitespace-nowrap text-3xl font-semibold tracking-tight">
                      {formatMoney(cents, p.currency).replace(/\.00$/, "")}
                      <span className="text-sm font-normal text-[color:var(--text-secondary)]"> {period.key === "month" ? "/ month" : period.every}</span>
                    </p>
                    {period.months > 1 && perMonth != null ? (
                      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                        {formatMoney(perMonth, p.currency).replace(/\.00$/, "")}/mo{save ? ` · save ${save}%` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Cancel any time</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[color:var(--text-secondary)]">Ask us</p>
                )}
              </div>
              {!compact && copy ? <p className="mt-4 text-sm font-medium">{copy.headline}</p> : null}
              <ul className={clsx("mt-4 space-y-2 text-sm text-[color:var(--text-secondary)]", compact && "text-[13px]")}>
                {(compact ? (copy?.bullets ?? []).slice(0, 3) : copy?.bullets ?? []).map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {b}
                  </li>
                ))}
              </ul>
              <Link href={`${planHref}${planHref.includes("?") ? "&" : "?"}plan=${p.code}&period=${periodKey}`} className={clsx("mt-6 inline-flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors", featured ? "btn-primary !px-4 !py-2" : "btn-secondary !px-4 !py-2")}>
                {compact ? "Choose" : `Start with ${p.name.replace(/^Vigil /, "")}`} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
