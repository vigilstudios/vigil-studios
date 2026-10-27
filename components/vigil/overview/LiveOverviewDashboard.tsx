"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  Gauge,
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
  InboxPanel,
  InsightsPanel,
  LeadTrendsPanel,
  PipelinePanel,
  TrafficPanel,
  WebsitePanel,
} from "./OverviewPanels";
import {
  SecurityPanel,
  SiteQualityPanel,
  VigilEyeIcon,
} from "./OverviewMonitoring";
import { securityState } from "@/lib/vigil/overview/monitoring";
import "./overview.css";

const icons = {
  website: Globe2,
  health: VigilEyeIcon,
  quality: Gauge,
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
  const pointer = useRef<{
    id: PanelId;
    pointerId: number;
    handle: HTMLElement;
    x: number;
    y: number;
    active: boolean;
    clientX: number;
    clientY: number;
    scrollFrame: number | null;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    id: PanelId;
    x: number;
    y: number;
    host: HTMLElement;
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
  const cancelDrag = useCallback(() => {
    const current = pointer.current;
    pointer.current = null;
    if (current?.scrollFrame != null) cancelAnimationFrame(current.scrollFrame);
    if (current?.handle.hasPointerCapture(current.pointerId))
      current.handle.releasePointerCapture(current.pointerId);
    setDragging(null);
    setDropTarget(null);
    setDragPreview(null);
  }, []);
  useEffect(() => {
    window.addEventListener("blur", cancelDrag);
    return () => {
      window.removeEventListener("blur", cancelDrag);
      const current = pointer.current;
      if (current?.scrollFrame != null)
        cancelAnimationFrame(current.scrollFrame);
    };
  }, [cancelDrag]);
  const panelAt = (x: number, y: number) =>
    document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-panel]")
      ?.dataset.panel as PanelId | undefined;
  const beginDrag = (event: PointerEvent<HTMLElement>, id: PanelId) => {
    if (!event.isPrimary || event.button !== 0 || pointer.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget
      .closest(".ov-card-heading")
      ?.querySelector<HTMLButtonElement>(".ov-grip")
      ?.focus({ preventScroll: true });
    pointer.current = {
      id,
      pointerId: event.pointerId,
      handle: event.currentTarget,
      x: event.clientX,
      y: event.clientY,
      active: false,
      clientX: event.clientX,
      clientY: event.clientY,
      scrollFrame: null,
    };
  };
  const scrollDrag = () => {
    const current = pointer.current;
    if (!current?.active) return;
    const scroller = current.handle.closest("main");
    if (scroller) {
      const bounds = scroller.getBoundingClientRect();
      const y = current.clientY;
      const delta =
        y < bounds.top + 48
          ? -Math.min(12, (bounds.top + 48 - y) / 4)
          : y > bounds.bottom - 48
            ? Math.min(12, (y - bounds.bottom + 48) / 4)
            : 0;
      if (
        delta &&
        current.clientX >= bounds.left &&
        current.clientX <= bounds.right
      ) {
        scroller.scrollTop += delta;
        const target = panelAt(current.clientX, y);
        setDropTarget(
          target && canSwapPanels(current.id, target) ? target : null,
        );
      }
    }
    current.scrollFrame = requestAnimationFrame(scrollDrag);
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (
      !current.active &&
      Math.hypot(event.clientX - current.x, event.clientY - current.y) < 7
    )
      return;
    current.active = true;
    current.clientX = event.clientX;
    current.clientY = event.clientY;
    if (current.scrollFrame === null)
      current.scrollFrame = requestAnimationFrame(scrollDrag);
    setDragging(current.id);
    const target = panelAt(event.clientX, event.clientY);
    setDropTarget(target && canSwapPanels(current.id, target) ? target : null);
    setDragPreview({
      id: current.id,
      x: Math.max(8, Math.min(event.clientX + 14, window.innerWidth - 236)),
      y: Math.max(8, Math.min(event.clientY + 14, window.innerHeight - 56)),
      // Outside the scrolling/container-query surface, with the dashboard theme.
      host:
        current.handle.closest<HTMLElement>(".vigil-frame") ?? document.body,
    });
  };
  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    const current = pointer.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const target = current.active
      ? panelAt(event.clientX, event.clientY)
      : undefined;
    cancelDrag();
    if (target) swap(current.id, target);
  };
  const pointerHandlers = {
    onPointerMove: moveDrag,
    onPointerUp: finishDrag,
    onPointerCancel: cancelDrag,
    onLostPointerCapture: cancelDrag,
  };
  const DragIcon = dragPreview ? icons[dragPreview.id] : GripVertical;
  const reportOrder = layout.order.filter((id) =>
    (REPORT_PANELS as readonly PanelId[]).includes(id),
  );
  const workOrder = layout.order.filter((id) =>
    (WORK_PANELS as readonly PanelId[]).includes(id),
  );
  const panels: Record<PanelId, ReactNode> = {
    website: <WebsitePanel data={data} />,
    health: <SecurityPanel data={data} />,
    quality: <SiteQualityPanel data={data} />,
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
    followup: <InboxPanel data={data} compact={workOrder[1] === "followup"} />,
    activity: (
      <ActivityPanel data={data} compact={workOrder[1] === "activity"} />
    ),
  };
  const renderPanel = (
    id: PanelId,
    index: number,
    kind: "site" | "reports" | "work",
    ids: readonly PanelId[],
  ) => {
    const Icon = icons[id];
    return (
      <section
        key={id}
        className={`ov-card ov-card-${id} ${dropTarget === id ? "ov-drop-target" : ""} ${dragging === id ? "ov-dragging" : ""}`}
        data-panel={id}
        data-security-state={
          id === "health" ? securityState(data.security, data.asOf) : undefined
        }
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
      >
        <div
          className="ov-card-heading"
          data-draggable={kind !== "site" || undefined}
          onPointerDown={
            kind !== "site" ? (event) => beginDrag(event, id) : undefined
          }
          {...(kind !== "site" ? pointerHandlers : {})}
        >
          <h2 id={`ov-heading-${id}`}>
            <Icon size={14} aria-hidden="true" />
            {PANEL_LABELS[id]}
          </h2>
          {kind !== "site" && (
            <button
              className="ov-grip"
              draggable={false}
              type="button"
              aria-label={`Swap ${PANEL_LABELS[id]}`}
              title="Drag to swap panels. Arrow keys also swap panels. Escape cancels dragging."
              aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  cancelDrag();
                  return;
                }
                if (pointer.current) return;
                const step =
                  event.key === "ArrowUp" || event.key === "ArrowLeft"
                    ? -1
                    : event.key === "ArrowDown" || event.key === "ArrowRight"
                      ? 1
                      : 0;
                if (step) {
                  event.preventDefault();
                  const target = ids[index + step];
                  if (target) swap(id, target);
                }
              }}
              onPointerDown={(event) => beginDrag(event, id)}
              {...pointerHandlers}
            >
              <GripVertical size={16} />
            </button>
          )}
        </div>
        <div className="ov-card-body">{panels[id]}</div>
      </section>
    );
  };
  return (
    <div className="ov-dashboard">
      {dragPreview &&
        createPortal(
          <div
            className="ov-drag-preview"
            aria-hidden="true"
            style={{ left: dragPreview.x, top: dragPreview.y }}
          >
            <DragIcon size={16} />
            <span>{PANEL_LABELS[dragPreview.id]}</span>
            <GripVertical size={16} />
          </div>,
          dragPreview.host,
        )}
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
      <div className="ov-row ov-row-site">
        {renderPanel("website", 0, "site", [])}
        <div className="ov-site-status">
          {renderPanel("health", 0, "site", [])}
          <div className="ov-status-detail-row">
            {renderPanel("quality", 1, "site", [])}
            {renderPanel("pipeline", 2, "site", [])}
          </div>
        </div>
      </div>
      <div className="ov-row ov-row-reports">
        {reportOrder.map((id, index) =>
          renderPanel(id, index, "reports", reportOrder),
        )}
      </div>
      <div className="ov-row ov-row-work">
        {workOrder.map((id, index) =>
          renderPanel(id, index, "work", workOrder),
        )}
      </div>
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
