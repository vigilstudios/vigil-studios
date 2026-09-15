"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

/**
 * A row of equal-width options with one pill that slides to the active one.
 * The pill animates its own `x` from the active index, deliberately not a
 * `layoutId`: a shared-layout pill inside an AnimatePresence panel stops
 * that panel's exit from ever completing (PricingTabs).
 */
export function SegmentedControl<K extends string>({ options, value, onChange, label, role = "tablist", size = "md", className }: { options: { key: K; label: ReactNode }[]; value: K; onChange: (key: K) => void; label: string; role?: "tablist" | "radiogroup"; size?: "md" | "lg"; className?: string }) {
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const itemRole = role === "tablist" ? "tab" : "radio";
  return (
    <div role={role} aria-label={label} className={clsx("relative grid rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]", size === "lg" ? "p-1.5" : "p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <motion.span
        aria-hidden
        className={clsx("pointer-events-none absolute bg-[color:var(--accent)]", size === "lg" ? "inset-y-1.5 left-1.5 rounded-xl" : "inset-y-1 left-1 rounded-lg")}
        style={{ width: `calc((100% - ${size === "lg" ? "0.75rem" : "0.5rem"}) / ${options.length})` }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      />
      {options.map((o) => {
        const active = o.key === value;
        return (
          <motion.button
            key={o.key}
            type="button"
            role={itemRole}
            aria-selected={role === "tablist" ? active : undefined}
            aria-checked={role === "radiogroup" ? active : undefined}
            onClick={() => onChange(o.key)}
            whileHover={{ scale: active ? 1 : 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={clsx("relative text-sm font-medium transition-colors", size === "lg" ? "min-h-12 rounded-xl px-6 font-semibold" : "min-h-10 rounded-lg px-4", active ? "text-[color:var(--bg-primary)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}
          >
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}
