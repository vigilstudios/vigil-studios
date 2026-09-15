"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { DASHBOARD_TOUR } from "@/lib/site-copy";

/**
 * The customer dashboard, one page at a time: pick a page, see the real
 * screen in a browser frame with a sentence about what it does. The
 * screenshots come from scripts/capture-dashboard.mjs in both themes and
 * follow the site's theme.
 */
export function DashboardShowcase() {
  const [key, setKey] = useState(DASHBOARD_TOUR[0].key);
  const theme = useTheme();
  const page = DASHBOARD_TOUR.find((p) => p.key === key) ?? DASHBOARD_TOUR[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-10">
      <ol className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:flex-col lg:overflow-visible lg:pb-0">
        {DASHBOARD_TOUR.map((p) => {
          const active = p.key === key;
          return (
            <li key={p.key} className="shrink-0 lg:shrink">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setKey(p.key)}
                className={clsx("w-full rounded-xl border px-4 py-3 text-left transition-colors", active ? "border-[color:var(--accent)] bg-[color:var(--accent)]/8" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:border-[color:var(--text-secondary)]/40")}
              >
                <span className="block text-sm font-semibold">{p.title}</span>
                <span className="hidden text-[13px] leading-5 text-[color:var(--text-secondary)] lg:block">{p.caption}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.6)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--border)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--border)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--border)]" />
            </span>
            <span className="mx-auto truncate rounded-md bg-[color:var(--bg-primary)]/60 px-3 py-0.5 text-[11px] text-[color:var(--text-secondary)]">vigilstudios.co{page.path}</span>
          </div>
          <div className="relative aspect-[16/10]">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div key={`${page.key}-${theme}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <Image src={`/site/dashboard/${page.key}-${theme}.webp`} alt={`The ${page.title} page of the Vigil dashboard`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover object-top" priority={page.key === DASHBOARD_TOUR[0].key} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[color:var(--text-secondary)] lg:hidden">{page.caption}</p>
      </div>
    </div>
  );
}

function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const apply = () => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}
