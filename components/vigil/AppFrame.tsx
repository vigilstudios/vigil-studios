"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  ClipboardCheck,
  CreditCard,
  Globe,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Lock,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { VirtueOrb } from "./VirtueOrb";
import { SIDEBAR_COOKIE, type NavGroup, type NavIcon, type NavItem } from "./nav";

/** Virtue's nav icon is the orb itself, sized like the other glyphs. */
function VirtueNavIcon({ className }: { className?: string }) {
  return <VirtueOrb size="xs" label="" className={className} />;
}

const icons: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  website: MonitorSmartphone,
  domain: Globe,
  billing: CreditCard,
  requests: ClipboardList,
  review: ClipboardCheck,
  leads: Inbox,
  insights: BarChart3,
  virtue: VirtueNavIcon,
  settings: Settings,
  customers: Building2,
  websites: MonitorSmartphone,
  domains: Globe,
  subscriptions: CreditCard,
  jobs: ListChecks,
  audit: ScrollText,
  plans: SlidersHorizontal,
};

export const EXPANDED_WIDTH = 240;
export const RAIL_WIDTH = 56;

/**
 * The product frame: a viewport-height grid with a collapsible sidebar, a
 * slim top bar and a scrolling content region. Below `md` the sidebar is an
 * off-canvas drawer. The collapsed state is mirrored into a cookie so the
 * server renders the right width on the next request (no layout flash).
 */
export function AppFrame({
  groups,
  homeHref,
  workspace,
  account,
  initialCollapsed,
  children,
}: {
  groups: NavGroup[];
  homeHref: string;
  /** Top-of-sidebar block: workspace switcher or console label. */
  workspace: ReactNode;
  /** Bottom-of-sidebar block: who is signed in, theme, sign-out, cross-links. */
  account: ReactNode;
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  // The drawer remembers the path it was opened on, so navigating closes it
  // without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const setDrawerOpen = useCallback((open: boolean) => setDrawerPath(open ? pathname : null), [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  // Escape closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const active = findActive(groups, pathname);

  // The drawer is always the full sidebar; only the desktop aside collapses.
  const sidebar = (rail: boolean) => (
    <div className="flex h-full flex-col">
      <div className={clsx("flex h-14 shrink-0 items-center border-b border-[color:var(--border)] py-3", rail ? "justify-center px-0" : "gap-2.5 px-4")}>
        <Link href={homeHref} aria-label="Home" className="shrink-0">
          <Logo size="sm" />
        </Link>
        {!rail ? <div className="min-w-0 flex-1">{workspace}</div> : null}
      </div>

      <nav aria-label="Sections" className="flex-1 overflow-y-auto px-2 py-2">
        {groups.map((group, gi) => (
          <div key={gi} className={clsx(gi > 0 && "mt-3 border-t border-[color:var(--border)] pt-3")}>
            {group.label && !rail ? (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">{group.label}</p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(item, pathname)} collapsed={rail} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={clsx("shrink-0 border-t border-[color:var(--border)]", rail ? "p-1.5" : "p-2")}>{account}</div>
    </div>
  );

  return (
    <div className="vigil-frame flex h-dvh w-full overflow-hidden bg-[color:var(--bg-primary)] text-[13px] text-[color:var(--text-primary)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden shrink-0 border-r border-[color:var(--border)] bg-[color:var(--bg-secondary)]/60 transition-[width] duration-200 md:block"
        style={{ width: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH }}
        data-collapsed={collapsed ? "true" : "false"}
      >
        {sidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[color:var(--bg-primary)] shadow-2xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)]"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar(false)}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 sm:px-4">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)] md:inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1 truncate text-sm font-medium">{active?.label ?? titleFromPath(pathname)}</div>
          <div id="vigil-topbar-actions" className="flex items-center gap-2" />
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Pages with no nav entry (onboarding after it is sent, detail views) still get a title. */
function titleFromPath(pathname: string): string {
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  if (!last || /^[0-9a-f-]{36}$/.test(last)) return "";
  return last.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function findActive(groups: NavGroup[], pathname: string): NavItem | undefined {
  const all = groups.flatMap((g) => g.items);
  // Longest matching href wins so /admin/organizations beats /admin.
  return all
    .filter((i) => isActive(i, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = icons[item.icon] ?? Briefcase;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={clsx(
        "group relative flex h-10 items-center rounded-md text-[13px] font-medium transition-colors md:h-9",
        collapsed ? "justify-center px-0" : "gap-2.5 px-2",
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color:var(--accent)]"
          : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]",
        item.locked && !active && "opacity-60"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {collapsed && item.attention ? <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[color:var(--accent)] ring-2 ring-[color:var(--bg-secondary)]" aria-label="Needs attention" /> : null}
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.attention ? <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]" aria-label="Needs attention" title="Needs attention" /> : null}
          {item.locked ? <Lock className="h-3 w-3 shrink-0 opacity-70" aria-label="Not included in your plan" /> : null}
          {item.badge ? (
            <span className="rounded-full bg-[color:var(--bg-surface-soft)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">{item.badge}</span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

const noop = () => () => {};
const getTopbarHost = () => document.getElementById("vigil-topbar-actions");
const getServerHost = () => null;

/** Mount a set of controls in the top bar from any page. */
export function TopbarActions({ children }: { children: ReactNode }) {
  // The host is rendered by this same frame, before the content, so it exists
  // by the time any page mounts; the server snapshot is null so SSR emits nothing.
  const host = useSyncExternalStore(noop, getTopbarHost, getServerHost);
  if (!host) return null;
  return createPortal(children, host);
}
