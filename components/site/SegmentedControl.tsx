"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

/**
 * A row of equal-width options with one pill that slides to the active one.
 * The pill is a plain span moved with a CSS transition from the active
 * index: not a `layoutId` (a shared-layout pill inside an AnimatePresence
 * panel stops that panel's exit from ever completing) and not a motion
 * value (framer serialises a non-zero initial transform differently on the
 * server, which broke hydration when the second tab was preselected).
 */
export function SegmentedControl<K extends string>({ options, value, onChange, label, role = "tablist", size = "md", className }: { options: { key: K; label: ReactNode }[]; value: K; onChange: (key: K) => void; label: string; role?: "tablist" | "radiogroup"; size?: "md" | "lg"; className?: string }) {
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const itemRole = role === "tablist" ? "tab" : "radio";
  return (
    <div className={clsx("rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]", size === "lg" ? "p-1.5" : "p-1", className)}>
      {/* An unpadded track, so the pill's width is a plain percentage (a calc() here is normalised by the browser and trips hydration). */}
      <div role={role} aria-label={label} className="relative grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <span
          aria-hidden
          className={clsx("pointer-events-none absolute inset-y-0 left-0 bg-[color:var(--accent)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", size === "lg" ? "rounded-xl" : "rounded-lg")}
          style={{ width: `${100 / options.length}%`, transform: `translateX(${index * 100}%)` }}
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
    </div>
  );
}
