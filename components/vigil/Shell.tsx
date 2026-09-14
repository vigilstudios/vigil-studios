import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "./Logo";
import { ShellNav, type NavItem } from "./ShellNav";

/**
 * Product chrome shared by the client dashboard and the admin console.
 * Mobile-first: header + horizontal nav strip; from `md` the nav becomes a
 * sidebar. No motion, no marketing background — calm and fast.
 */
export function Shell({
  items,
  homeHref,
  title,
  headerRight,
  children,
}: {
  items: NavItem[];
  homeHref: string;
  title: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={homeHref} aria-label="Home" className="shrink-0">
              <Logo />
            </Link>
            <div className="min-w-0 truncate text-sm font-medium text-[color:var(--text-secondary)]">{title}</div>
          </div>
          <div className="flex items-center gap-1">
            {headerRight}
            <div className="scale-75">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="md:hidden">
          <ShellNav items={items} orientation="horizontal" />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 md:py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <ShellNav items={items} orientation="vertical" />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
