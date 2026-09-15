"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicBuild, PublicPlan } from "@/lib/vigil/queries/public-pricing";
import { BuildCards } from "./BuildCards";
import { PricingTable } from "./PricingTable";

type Tab = "websites" | "subscriptions";

const tabs: { key: Tab; label: string; hint: string }[] = [
  { key: "websites", label: "Websites", hint: "paid once" },
  { key: "subscriptions", label: "Subscriptions", hint: "keeps it running" },
];

/**
 * The two halves of the price, one at a time: the website (paid once) and
 * the Vigil plan (ongoing). The active tab's pill slides between the
 * buttons and the panels cross-fade.
 */
export function PricingTabs({ plans, builds }: { plans: PublicPlan[]; builds: PublicBuild[] }) {
  const [tab, setTab] = useState<Tab>("websites");
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1.5" role="tablist" aria-label="What you pay for">
          {tabs.map((t) => {
            const active = t.key === tab;
            return (
              <motion.button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                whileHover={{ scale: active ? 1 : 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={clsx("relative min-h-12 rounded-xl px-6 text-sm font-semibold transition-colors", active ? "text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}
              >
                {active ? <motion.span layoutId="pricing-tab-pill" className="absolute inset-0 rounded-xl bg-[color:var(--accent)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} /> : null}
                <span className="relative flex flex-col items-center leading-tight">
                  {t.label}
                  <span className={clsx("text-[10px] font-medium tracking-wide", active ? "opacity-75" : "opacity-60")}>{t.hint}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            {tab === "websites" ? <BuildCards builds={builds} /> : <PricingTable plans={plans} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
