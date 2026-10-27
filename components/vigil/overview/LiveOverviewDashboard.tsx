"use client";

import {
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Globe2,
  GripVertical,
  Inbox,
  LayoutGrid,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  PANEL_LABELS,
  RANGES,
  REPORT_PANELS,
  WORK_PANELS,
  canSwapPanels,
  readLayout,
  swapPanels,
  type LayoutPreference,
  type OverviewData,
  type PanelId,
  type ReportRange,
} from "@/lib/vigil/overview/model";
import type { ActionResult } from "@/lib/vigil/auth/errors";
import {
  ActivityPanel,
  HealthPanel,
  InboxPanel,
  InsightsPanel,
  LeadTrendsPanel,
  PipelinePanel,
  TrafficPanel,
  WebsitePanel,
} from "./OverviewPanels";
import "./overview.css";

const icons = {
  website: Globe2,
  health: ShieldCheck,
  leads: BarChart3,
  pipeline: PieChart,
  traffic: Activity,
  insights: Sparkles,
  followup: Inbox,
  activity: Activity,
};

export function LiveOverviewDashboard({
  data,
  initialLayout,
  saveLayout,
  sample = false,
}: {
  data: OverviewData;
  initialLayout: LayoutPreference;
  saveLayout: (layout: LayoutPreference) => Promise<ActionResult>;
  sample?: boolean;
}) {
  const router = useRouter();
  const [layout, setLayout] = useState(() => readLayout(initialLayout));
  const latest = useRef(layout);
  const queued = useRef<LayoutPreference | null>(null);
  const inFlight = useRef(false);
  const [range, setRange] = useState<ReportRange>(30);
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const [dropTarget, setDropTarget] = useState<PanelId | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [refreshing, startRefresh] = useTransition();
  const touch = useRef<{
    id: PanelId;
    x: number;
    y: number;
    active: boolean;
    target: PanelId | null;
  } | null>(null);

  // Serialize saves: a slower response can never overwrite a later swap/chart choice.
  const persist = async (next: LayoutPreference) => {
    queued.current = next;
    if (inFlight.current) return;
    inFlight.current = true;
    setError("");
    setNotice("Saving…");
    while (queued.current) {
      const pending = queued.current;
      queued.current = null;
      try {
        const result = await saveLayout(pending);
        if (!result.ok) throw new Error(result.error);
        setNotice(sample ? "Saved in sample browser" : "Layout saved");
        setError("");
      } catch {
        setNotice("");
        setError("Layout couldn’t be saved. Your changes are still here.");
      }
    }
    inFlight.current = false;
  };
  const update = (patch: Partial<LayoutPreference>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setLayout(next);
    void persist(next);
  };
  const swap = (id: PanelId, target: PanelId) => {
    if (!canSwapPanels(id, target)) return;
    update({ order: swapPanels(latest.current.order, id, target) });
  };
  const panels: Record<PanelId, ReactNode> = {
    website: <WebsitePanel data={data} />,
    health: <HealthPanel data={data} />,
    leads: (
      <LeadTrendsPanel
        data={data}
        range={range}
        view={layout.leadView}
        onView={(leadView) => update({ leadView })}
      />
    ),
    pipeline: (
      <PipelinePanel
        data={data}
        range={range}
        view={layout.statusView}
        onView={(statusView) => update({ statusView })}
      />
    ),
    traffic: (
      <TrafficPanel
        data={data}
        range={range}
        view={layout.trafficView}
        onView={(trafficView) => update({ trafficView })}
      />
    ),
    insights: <InsightsPanel />,
    followup: (
      <InboxPanel
        data={data}
        compact={
          layout.order.filter((id) =>
            (WORK_PANELS as readonly PanelId[]).includes(id),
          )[1] === "followup"
        }
      />
    ),
    activity: (
      <ActivityPanel
        data={data}
        compact={
          layout.order.filter((id) =>
            (WORK_PANELS as readonly PanelId[]).includes(id),
          )[1] === "activity"
        }
      />
    ),
  };
  return (
    <div className="ov-dashboard">
      {sample && (
        <div className="ov-sample-banner">
          <LayoutGrid size={12} />
          Sample business & data · changes stay in this preview
        </div>
      )}
      <header className="ov-page-header">
        <h1 className="ov-eyebrow">
          {data.organizationName}
          <span>/</span>OVERVIEW
        </h1>
        <div className="ov-header-actions">
          <span className="ov-save-status" aria-live="polite">
            {notice}
          </span>
          {data.sites.length > 1 && (
            <label className="ov-site-select">
              <span className="ov-sr-only">Website</span>
              <select
                value={data.site.id}
                onChange={(event) =>
                  router.push(
                    `/dashboard?website=${encodeURIComponent(event.target.value)}`,
                  )
                }
              >
                {data.sites.map((site) => (
                  <option value={site.id} key={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} />
            </label>
          )}
          <div
            className="ov-segments"
            role="group"
            aria-label="Report date range"
          >
            {RANGES.map((days) => (
              <button
                type="button"
                key={days}
                aria-pressed={range === days}
                onClick={() => setRange(days)}
              >
                {days}d
              </button>
            ))}
          </div>
          <button
            className="ov-icon-button"
            type="button"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={refreshing ? "ov-spinning" : ""} />
          </button>
        </div>
      </header>
      {!data.completeHistory && (
        <p className="ov-warning" role="status">
          Trend and status charts include the latest 10,000 records (
          {data.historyCount.toLocaleString()} available). Period totals may be
          incomplete. Inbox counts are complete.
        </p>
      )}
      {data.otherProjects > 0 && (
        <div className="ov-project-note">
          {data.otherProjects}{" "}
          {data.otherProjects === 1 ? "project" : "projects"} in progress.{" "}
          <a href="/dashboard/website">
            View projects
            <ArrowUpRight size={12} />
          </a>
        </div>
      )}
      {error && (
        <div className="ov-warning" role="alert">
          {error}
          <button type="button" onClick={() => void persist(latest.current)}>
            Retry save
          </button>
        </div>
      )}
      {(
        [
          { kind: "site", ids: ["website", "health"] as PanelId[] },
          {
            kind: "reports",
            ids: layout.order.filter((id) =>
              (REPORT_PANELS as readonly PanelId[]).includes(id),
            ),
          },
          {
            kind: "work",
            ids: layout.order.filter((id) =>
              (WORK_PANELS as readonly PanelId[]).includes(id),
            ),
          },
        ] as const
      ).map(({ kind, ids }) => (
        <div
          key={kind}
          className={`ov-row ov-row-${kind}`}
          style={
            kind === "reports"
              ? {
                  gridTemplateColumns: ids
                    .map((id) =>
                      id === "pipeline"
                        ? "minmax(180px, .82fr)"
                        : "minmax(0, 1fr)",
                    )
                    .join(" "),
                }
              : undefined
          }
        >
          {ids.map((id, index) => {
            const Icon = icons[id];
            return (
              <section
                key={id}
                className={`ov-card ov-card-${id} ${dropTarget === id ? "ov-drop-target" : ""} ${dragging === id ? "ov-dragging" : ""}`}
                data-panel={id}
                data-slot={index}
                data-compact={(kind === "work" && index === 1) || undefined}
                style={
                  id === "website"
                    ? ({
                        "--website-accent":
                          data.previewAccent ?? "var(--ov-neutral-tint)",
                      } as CSSProperties)
                    : undefined
                }
                aria-labelledby={`ov-heading-${id}`}
                onDragOver={(event) => {
                  if (dragging && canSwapPanels(dragging, id)) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropTarget(id);
                  }
                }}
                onDrop={(event) => {
                  if (dragging && canSwapPanels(dragging, id)) {
                    event.preventDefault();
                    swap(dragging, id);
                    setDragging(null);
                    setDropTarget(null);
                  }
                }}
              >
                <div
                  className="ov-card-heading"
                  draggable={kind !== "site"}
                  onDragStart={(event) => {
                    if ((event.target as HTMLElement).closest("a,select")) {
                      event.preventDefault();
                      return;
                    }
                    setDragging(id);
                    event.dataTransfer.setData("text/plain", id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropTarget(null);
                  }}
                >
                  <h2 id={`ov-heading-${id}`}>
                    <Icon size={14} aria-hidden="true" />
                    {PANEL_LABELS[id]}
                  </h2>
                  {kind !== "site" && (
                    <button
                      className="ov-grip"
                      draggable
                      type="button"
                      aria-label={`Swap ${PANEL_LABELS[id]}`}
                      title="Drag to swap panels. Arrow keys also swap panels."
                      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                      onKeyDown={(event) => {
                        const step =
                          event.key === "ArrowUp" || event.key === "ArrowLeft"
                            ? -1
                            : event.key === "ArrowDown" ||
                                event.key === "ArrowRight"
                              ? 1
                              : 0;
                        if (step) {
                          event.preventDefault();
                          const target = ids[index + step];
                          if (target) swap(id, target);
                        }
                      }}
                      onPointerDown={(event) => {
                        if (
                          event.pointerType === "touch" ||
                          event.pointerType === "pen"
                        ) {
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          touch.current = {
                            id,
                            x: event.clientX,
                            y: event.clientY,
                            active: false,
                            target: null,
                          };
                        }
                      }}
                      onPointerMove={(event) => {
                        const current = touch.current;
                        if (!current) return;
                        if (
                          Math.hypot(
                            event.clientX - current.x,
                            event.clientY - current.y,
                          ) < 7 &&
                          !current.active
                        )
                          return;
                        current.active = true;
                        setDragging(current.id);
                        const target = document
                          .elementFromPoint(event.clientX, event.clientY)
                          ?.closest<HTMLElement>("[data-panel]")?.dataset
                          .panel as PanelId | undefined;
                        current.target = target ?? null;
                        setDropTarget(
                          target && canSwapPanels(current.id, target)
                            ? target
                            : null,
                        );
                      }}
                      onPointerUp={() => {
                        const current = touch.current;
                        if (current?.active && current.target)
                          swap(current.id, current.target);
                        touch.current = null;
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      onPointerCancel={() => {
                        touch.current = null;
                        setDragging(null);
                        setDropTarget(null);
                      }}
                    >
                      <GripVertical size={16} />
                    </button>
                  )}
                </div>
                <div className="ov-card-body">{panels[id]}</div>
              </section>
            );
          })}
        </div>
      ))}
      <footer className="ov-page-footer">
        <span>Kept running by Vigil</span>
        <span>
          Snapshot{" "}
          {new Date(data.asOf).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          })}{" "}
          UTC
        </span>
      </footer>
    </div>
  );
}
