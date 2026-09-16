"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { TopbarActions } from "./AppFrame";

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
  const [state, setState] = useState<ConnectionState>("connecting");
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  const refresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      setRefreshing(true);
      router.refresh();
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => setRefreshing(false), 800);
    }, 250);
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`dashboard:${scope.kind}:${scope.kind === "organization" ? scope.organizationId : scope.kind === "viewer" ? scope.userId : "all"}`);
    const tables = scope.kind === "admin" ? adminTables : scope.kind === "organization" ? organizationTables : [];

    for (const table of tables) {
      const filter = scope.kind === "organization" ? `organization_id=eq.${scope.organizationId}` : undefined;
      channel.on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, refresh);
    }
    if (scope.kind === "organization") {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "organizations", filter: `id=eq.${scope.organizationId}` }, refresh);
    } else if (scope.kind === "admin") {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, refresh);
    }
    if (scope.kind !== "admin") channel.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${scope.userId}` }, refresh);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setState("live");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setState("offline");
    });

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const fallback = window.setInterval(refresh, 60_000);

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      window.clearInterval(fallback);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh, scope]);

  const label = refreshing ? "Updating" : state === "live" ? "Live" : state === "offline" ? "Offline" : "Connecting";
  return (
    <TopbarActions>
      <div className="flex items-center gap-1.5" aria-live="polite">
        <span className="hidden items-center gap-1.5 text-[11px] text-[color:var(--text-secondary)] sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${state === "live" ? "bg-[color:var(--accent)]" : state === "offline" ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`} />
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
