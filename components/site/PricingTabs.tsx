"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicBuild, PublicPlan } from "@/lib/vigil/queries/public-pricing";
import { BuildCards } from "./BuildCards";
import { PricingTable } from "./PricingTable";
import { SegmentedControl } from "./SegmentedControl";

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
export type PricingTab = Tab;

export function PricingTabs({ plans, builds, initialTab = "websites" }: { plans: PublicPlan[]; builds: PublicBuild[]; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div>
      <div className="flex justify-center">
        <SegmentedControl
          size="lg"
          label="What you pay for"
          value={tab}
          onChange={setTab}
          options={tabs.map((t) => ({
            key: t.key,
            label: (
              <span className="flex flex-col items-center leading-tight">
                {t.label}
                <span className={clsx("text-[10px] font-medium tracking-wide", t.key === tab ? "opacity-75" : "opacity-60")}>{t.hint}</span>
              </span>
            ),
          }))}
        />
      </div>

      <div className="relative mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            {tab === "websites" ? <BuildCards builds={builds} /> : <PricingTable plans={plans} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
