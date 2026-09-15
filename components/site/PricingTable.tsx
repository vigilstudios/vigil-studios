"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { BILLING_PERIODS, savingsPercent, type BillingPeriodKey } from "@/lib/vigil/billing-periods";
import { formatMoney } from "@/lib/vigil/format";
import type { PublicPlan } from "@/lib/vigil/queries/public-pricing";
import { PLAN_COPY } from "@/lib/site-copy";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { FlipNumber } from "./FlipNumber";
import { Chip } from "./primitives";
import { cardVariants, gridVariants } from "./pricing-motion";

const money = (cents: number, currency: string) => formatMoney(cents, currency).replace(/\.00$/, "");

/**
 * The four Vigil plans in a row, centred, with a Monthly / Annual / 3 years
 * toggle. Numbers are the rows the checkout sells; this component never
 * invents one. Prices roll to the new figure when the period changes.
 */
export function PricingTable({ plans, planHref = "/express", bullets = 3 }: { plans: PublicPlan[]; planHref?: string; bullets?: number }) {
  const periods = BILLING_PERIODS.filter((per) => plans.some((p) => p.prices[per.key] != null));
  const [periodKey, setPeriodKey] = useState<BillingPeriodKey>(periods[0]?.key ?? "month");
  const period = BILLING_PERIODS.find((p) => p.key === periodKey) ?? BILLING_PERIODS[0];
  const highlight = "care";

  if (plans.length === 0) {
    return <p className="text-center text-sm text-[color:var(--text-secondary)]">Plan prices are being finalised. Email hello@vigilstudios.co and we will send them over.</p>;
  }

  return (
    <div>
      {periods.length > 1 ? (
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1" role="radiogroup" aria-label="Billing period">
            {periods.map((per) => {
              const active = per.key === periodKey;
              const save = Math.max(0, ...plans.map((p) => savingsPercent(p.prices[per.key] ?? 0, per.months, p.prices.month ?? null) ?? 0));
              return (
                <button key={per.key} type="button" role="radio" aria-checked={active} onClick={() => setPeriodKey(per.key)} className={clsx("relative min-h-10 rounded-lg px-4 text-sm font-medium transition-colors", active ? "text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}>
                  {active ? <motion.span layoutId="period-pill" className="absolute inset-0 rounded-lg bg-[color:var(--accent)]" transition={{ type: "spring", stiffness: 400, damping: 34 }} /> : null}
                  <span className="relative">
                    {per.label}
                    {save > 0 ? <span className={clsx("ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors", active ? "bg-black/15" : "bg-[color:var(--accent)]/15 text-[color:var(--accent)]")}>save {save}%</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <motion.div variants={gridVariants} initial="hidden" animate="visible" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const cents = p.prices[periodKey];
          const copy = PLAN_COPY[p.code];
          const perMonth = cents != null ? Math.round(cents / period.months) : null;
          const save = cents != null ? savingsPercent(cents, period.months, p.prices.month ?? null) : null;
          const featured = p.code === highlight;
          return (
            <motion.div key={p.code} variants={cardVariants} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className={clsx("relative flex flex-col rounded-2xl border p-5 lg:p-6", featured ? "border-[color:var(--accent)] bg-[color:var(--accent)]/6 shadow-[0_0_0_1px_var(--accent),0_24px_60px_-40px_var(--accent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)]")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {featured ? <div className="mb-2"><Chip tone="accent">Most chosen</Chip></div> : null}
                  <h3 className="text-lg font-semibold tracking-tight">{p.name.replace(/^Vigil /, "")}</h3>
                  {p.tagline ? <p className="text-sm text-[color:var(--text-secondary)]">{p.tagline}</p> : null}
                </div>
                {copy?.virtue ? <VirtueOrb size="sm" label="Includes Virtue" /> : null}
              </div>
              <div className="mt-5">
                {cents != null ? (
                  <>
                    <p className="flex items-baseline whitespace-nowrap text-3xl font-semibold tracking-tight">
                      <FlipNumber value={money(cents, p.currency)} />
                      <span className="ml-1 text-sm font-normal text-[color:var(--text-secondary)]">{period.key === "month" ? "/ month" : period.every}</span>
                    </p>
                    <p className="mt-1 h-4 text-xs text-[color:var(--text-secondary)]">{period.months > 1 && perMonth != null ? `${money(perMonth, p.currency)}/mo${save ? ` · save ${save}%` : ""}` : "Cancel any time"}</p>
                  </>
                ) : (
                  <p className="text-sm text-[color:var(--text-secondary)]">Ask us</p>
                )}
              </div>
              <ul className="mt-4 space-y-2 text-[13px] text-[color:var(--text-secondary)]">
                {(copy?.bullets ?? []).slice(0, bullets).map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {b}
                  </li>
                ))}
              </ul>
              <Link href={`${planHref}${planHref.includes("?") ? "&" : "?"}plan=${p.code}&period=${periodKey}`} className={clsx("mt-auto inline-flex min-h-11 items-center justify-center rounded-lg pt-0 text-sm font-semibold transition-colors", featured ? "btn-primary !mt-6 !px-4 !py-2" : "btn-secondary !mt-6 !px-4 !py-2")}>
                Choose {p.name.replace(/^Vigil /, "")} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
