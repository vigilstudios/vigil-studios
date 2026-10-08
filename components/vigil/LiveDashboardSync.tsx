"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { TopbarActions } from "./AppFrame";
import { createDashboardRefreshController, dashboardAutoRefreshEnabled } from "@/lib/vigil/dashboard-refresh";

type Scope =
  | { kind: "admin" }
  | { kind: "organization"; organizationId: string; userId: string }
  | { kind: "viewer"; userId: string };

type ConnectionState = "connecting" | "live" | "offline";

const organizationTables = [
  "audit_events",
  "change_requests",
  "deployments",
  "domains",
  "entitlement_overrides",
  "organization_invites",
  "organization_members",
  "orders",
  "project_review_responses",
  "project_review_rounds",
  "project_review_submissions",
  "projects",
  "subscriptions",
  "websites",
] as const;

const adminTables = [...organizationTables, "notifications", "provisioning_jobs"] as const;

/**
 * Keeps server-rendered dashboard data and layout attention markers current.
 * Realtime is primary; focus, reconnect and manual refresh are safe fallbacks.
 */
export function LiveDashboardSync({ scope }: { scope: Scope }) {
  const router = useRouter();
  const automatic = dashboardAutoRefreshEnabled(usePathname());
  const kind = scope.kind;
  const organizationId = scope.kind === "organization" ? scope.organizationId : null;
  const userId = scope.kind === "admin" ? null : scope.userId;
  const [state, setState] = useState<ConnectionState>("connecting");
  const [refreshing, setRefreshing] = useState(false);
  const settleTimer = useRef<number | null>(null);

  const refresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setRefreshing(false), 800);
  }, [router]);

  useEffect(() => {
    if (!automatic) return;
    const controller = createDashboardRefreshController({
      refresh,
      isVisible: () => document.visibilityState === "visible",
      isOnline: () => navigator.onLine,
    });
    const supabase = createClient();
    const channel = supabase.channel(`dashboard:${kind}:${organizationId ?? userId ?? "all"}`);
    const tables = kind === "admin" ? adminTables : kind === "organization" ? organizationTables : [];

    for (const table of tables) {
      const filter = kind === "organization" ? `organization_id=eq.${organizationId}` : undefined;
      channel.on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, controller.changed);
    }
    if (kind === "organization") {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "organizations", filter: `id=eq.${organizationId}` }, controller.changed);
    } else if (kind === "admin") {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, controller.changed);
    }
    if (kind !== "admin") channel.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, controller.changed);

    channel.subscribe((status) => {
      const connected = status === "SUBSCRIBED";
      controller.connection(connected);
      setState(connected ? "live" : "offline");
    });

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") controller.wake();
    };
    window.addEventListener("focus", controller.wake);
    window.addEventListener("online", controller.wake);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const fallback = window.setInterval(controller.poll, 60_000);

    return () => {
      controller.dispose();
      window.clearInterval(fallback);
      window.removeEventListener("focus", controller.wake);
      window.removeEventListener("online", controller.wake);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [automatic, refresh, kind, organizationId, userId]);

  useEffect(() => () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
  }, []);

  const label = refreshing ? "Updating" : !automatic ? "Manual" : state === "live" ? "Live" : state === "offline" ? "Offline" : "Connecting";
  return (
    <TopbarActions>
      <div className="flex items-center gap-1.5" aria-live="polite">
        <span className="hidden items-center gap-1.5 text-[11px] text-[color:var(--text-secondary)] sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${!automatic ? "bg-[color:var(--text-secondary)]" : state === "live" ? "bg-[color:var(--accent)]" : state === "offline" ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`} />
          {label}
        </span>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-soft)] hover:text-[color:var(--text-primary)]"
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </TopbarActions>
  );
}
