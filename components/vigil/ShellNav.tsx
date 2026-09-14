"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Lock } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Rendered dimmed with a lock; the page explains why. */
  locked?: boolean;
  /** Small trailing tag such as "Soon". */
  badge?: string;
  exact?: boolean;
};

export function ShellNav({ items, orientation }: { items: NavItem[]; orientation: "horizontal" | "vertical" }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav
      aria-label="Sections"
      className={clsx(
        orientation === "horizontal"
          ? "scrollbar-hide flex gap-1 overflow-x-auto px-3 pb-2"
          : "flex flex-col gap-0.5"
      )}
    >
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color:var(--accent)]"
                : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]",
              item.locked && "opacity-70"
            )}
          >
            <span>{item.label}</span>
            {item.locked ? <Lock className="h-3.5 w-3.5" aria-label="Not included in your plan" /> : null}
            {item.badge ? (
              <span className="rounded-full bg-[color:var(--bg-surface-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
