"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PRODUCT_LINKS } from "@/lib/site-copy";

/**
 * "Products" in the top bar: the word itself is a link to the overview; the
 * panel opens on hover, on the chevron (keyboard), and closes on Escape,
 * on an outside click, or when the pointer leaves. Each item carries a
 * one-line descriptor so "Vigil" under a Vigil logo is never ambiguous.
 */
export function ProductsMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={root} className="relative flex h-full items-center" onMouseEnter={show} onMouseLeave={hide}>
      <Link href="/products" className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]" onFocus={show}>
        Products
      </Link>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Products menu"
        onClick={() => setOpen((o) => !o)}
        className="ml-1 rounded-md p-0.5 text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
      >
        <ChevronDown className={clsx("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={id}
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3"
          >
            <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)]/95 p-1.5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              {PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex flex-col rounded-xl px-3 py-2.5 transition-colors hover:bg-[color:var(--bg-surface-soft)]"
                >
                  <span className="text-sm font-semibold text-[color:var(--text-primary)]">{item.label}</span>
                  <span className="text-[12px] leading-5 text-[color:var(--text-secondary)]">{item.blurb}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
