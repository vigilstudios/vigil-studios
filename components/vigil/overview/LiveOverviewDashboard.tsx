"use client";

import {
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Grip,
  LayoutGrid,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  DEFAULT_LAYOUT,
  PANEL_IDS,
  PANEL_LABELS,
  RANGES,
  movePanel,
  readLayout,
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
  ServicePanel,
  SnapshotStrip,
  TrafficPanel,
  WebsitePanel,
} from "./OverviewPanels";
import "./overview.css";

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
  const [saved, setSaved] = useState(() => readLayout(initialLayout));
  const [customizing, setCustomizing] = useState(false);
  const [range, setRange] = useState<ReportRange>(30);
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const [dropTarget, setDropTarget] = useState<PanelId | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, startSave] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const dirty = JSON.stringify(layout) !== JSON.stringify(saved);
  const visible = layout.order.filter((id) => !layout.hidden.includes(id));
  const update = (patch: Partial<LayoutPreference>) => {
    setLayout((current) => ({ ...current, ...patch }));
    setNotice("");
    setError("");
  };
  const move = (id: PanelId, target: PanelId) => {
    setLayout((current) => ({
      ...current,
      order: movePanel(current.order, id, target),
    }));
    setNotice(`${PANEL_LABELS[id]} moved.`);
  };
  const save = () => {
    setError("");
    startSave(async () => {
      try {
        const result = await saveLayout(layout);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(layout);
        setCustomizing(false);
        setNotice(
          sample
            ? "Layout saved in this sample browser."
            : "Your view is saved to your account.",
        );
      } catch {
        setError(
          "Your layout could not be saved. Your changes are still here; please try again.",
        );
      }
    });
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
    followup: <InboxPanel data={data} />,
    activity: <ActivityPanel data={data} />,
    service: <ServicePanel data={data} />,
  };
  const labels: Record<PanelId, string> = {
    website: "01 / YOUR DIGITAL HOME",
    health: "THE ESSENTIALS",
    leads: "THE CONVERSATIONS START HERE",
    pipeline: "FROM HELLO TO CUSTOMER",
    traffic: "YOUR AUDIENCE",
    insights: "A LOOK AHEAD",
    followup: "TURN INTEREST INTO CONVERSATION",
    activity: "BEHIND THE SCENES",
    service: "WE’RE IN YOUR CORNER",
  };
  return (
    <div className="ov-dashboard">
      {sample && (
        <div className="ov-sample-banner">
          <LayoutGrid size={14} />
          Design preview · fictional business & sample data. No customer records
          are changed.
        </div>
      )}
      <header className="ov-page-header">
        <div>
          <p className="ov-eyebrow">
            {data.organizationName} <span>/</span> OVERVIEW
          </p>
          <h1>
            Your business, in view<span>.</span>
          </h1>
          <p>Your website, your conversations, and what comes next.</p>
        </div>
        <div className="ov-header-actions">
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
              <ChevronDown size={13} />
            </label>
          )}
          <button
            className="ov-icon-button"
            type="button"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw size={16} className={refreshing ? "ov-spinning" : ""} />
          </button>
          <button
            className={`ov-button ${customizing ? "ov-button-active" : ""}`}
            type="button"
            aria-expanded={customizing}
            aria-controls="overview-customize"
            onClick={() => {
              setCustomizing(!customizing);
              setError("");
            }}
          >
            <SlidersHorizontal size={15} />
            Customize
          </button>
          {dirty && !customizing && (
            <button
              className="ov-button ov-button-primary"
              type="button"
              onClick={save}
              disabled={saving}
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save view"}
            </button>
          )}
        </div>
      </header>
      <div className="ov-report-bar">
        <div>
          <span className="ov-tiny-dot" />
          {data.site.name}
          <span className="ov-report-divider" />
          Live overview
        </div>
        <div className="ov-range-control">
          <span>Inquiries & traffic</span>
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
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>
      {!data.completeHistory && (
        <p className="ov-warning" role="status">
          Trend and status charts include only the latest 10,000 records from
          the last 180 days ({data.historyCount.toLocaleString()} available).
          Period totals may be incomplete. Inbox counts are complete.
        </p>
      )}
      {data.otherProjects > 0 && (
        <div className="ov-project-note">
          You also have {data.otherProjects}{" "}
          {data.otherProjects === 1 ? "project" : "projects"} in progress.{" "}
          <a href="/dashboard/website">
            View website projects
            <ArrowUpRight size={12} />
          </a>
        </div>
      )}
      {customizing && (
        <section
          className="ov-customize"
          id="overview-customize"
          aria-label="Customize dashboard layout"
        >
          <div className="ov-customize-heading">
            <div>
              <h2>Make room for what matters.</h2>
              <p>
                Drag a panel by its grip, or use the arrows. Choose what to
                show. Panel widths adapt on smaller screens.
              </p>
            </div>
            <button
              className="ov-icon-button"
              type="button"
              aria-label="Close layout editor"
              onClick={() => {
                setLayout(saved);
                setCustomizing(false);
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="ov-widget-choices">
            {PANEL_IDS.map((id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={!layout.hidden.includes(id)}
                  disabled={id === "website" || id === "health" || saving}
                  onChange={(event) =>
                    update({
                      hidden: event.target.checked
                        ? layout.hidden.filter((item) => item !== id)
                        : [...layout.hidden, id],
                    })
                  }
                />
                {PANEL_LABELS[id]}
              </label>
            ))}
          </div>
          <div className="ov-customize-bottom">
            <span>
              Website and health stay visible. Your layout is personal,
              including in Client view.
            </span>
            <div>
              <button
                type="button"
                className="ov-text-link"
                disabled={saving}
                onClick={() => {
                  setLayout(structuredClone(DEFAULT_LAYOUT));
                  setNotice("Default layout restored. Save to keep it.");
                }}
              >
                <RotateCcw size={13} />
                Reset layout
              </button>
              <button
                type="button"
                className="ov-button"
                disabled={saving}
                onClick={() => {
                  setLayout(saved);
                  setCustomizing(false);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ov-button ov-button-primary"
                disabled={saving}
                onClick={save}
              >
                <Check size={14} />
                {saving ? "Saving…" : "Save layout"}
              </button>
            </div>
          </div>
        </section>
      )}
      <div className="ov-save-status" aria-live="polite">
        {notice}
      </div>
      {error && (
        <p className="ov-warning" role="alert">
          {error}
        </p>
      )}
      <div className={`ov-grid ${customizing ? "ov-grid-editing" : ""}`}>
        {visible.map((id, index) => (
          <section
            key={id}
            className={`ov-card ov-card-${id} ${dropTarget === id ? "ov-drop-target" : ""}`}
            data-panel={id}
            data-span={layout.spans[id]}
            style={{ "--panel-span": layout.spans[id] } as CSSProperties}
            aria-labelledby={`ov-heading-${id}`}
            onDragOver={(event) => {
              if (customizing && dragging) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTarget(id);
              }
            }}
            onDrop={(event) => {
              if (customizing && dragging) {
                event.preventDefault();
                move(dragging, id);
                setDragging(null);
                setDropTarget(null);
              }
            }}
          >
            {customizing && (
              <div className="ov-panel-tools">
                <button
                  className="ov-icon-button ov-grip"
                  type="button"
                  draggable={!saving}
                  aria-label={`Drag ${PANEL_LABELS[id]}`}
                  title="Drag to move"
                  onDragStart={(event) => {
                    setDragging(id);
                    event.dataTransfer.setData("text/plain", id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropTarget(null);
                  }}
                >
                  <Grip size={15} />
                </button>
                <span>
                  {layout.spans[id] === 4
                    ? "Compact"
                    : layout.spans[id] === 8
                      ? "Wide"
                      : "Full width"}
                </span>
                <button
                  type="button"
                  className="ov-icon-button"
                  disabled={index === 0 || saving}
                  onClick={() => move(id, visible[index - 1])}
                  aria-label={`Move ${PANEL_LABELS[id]} up`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="ov-icon-button"
                  disabled={index === visible.length - 1 || saving}
                  onClick={() => move(id, visible[index + 1])}
                  aria-label={`Move ${PANEL_LABELS[id]} down`}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="ov-icon-button"
                  disabled={saving}
                  onClick={() =>
                    update({
                      spans: {
                        ...layout.spans,
                        [id]:
                          layout.spans[id] === 4
                            ? 8
                            : layout.spans[id] === 8
                              ? 12
                              : 4,
                      },
                    })
                  }
                  aria-label={`Resize ${PANEL_LABELS[id]}`}
                  title="Change panel width"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            )}
            <div className="ov-card-heading">
              <div>
                <p>{labels[id]}</p>
                <h2 id={`ov-heading-${id}`}>{PANEL_LABELS[id]}</h2>
              </div>
              {id === "health" && <ShieldMark />}
              {id === "leads" && (
                <span className="ov-small-period">Last {range} days</span>
              )}
              {id === "pipeline" && (
                <span className="ov-small-period">Last {range} days</span>
              )}
            </div>
            <div className="ov-card-body">{panels[id]}</div>
            {id === "leads" && <SnapshotStrip data={data} range={range} />}
          </section>
        ))}
      </div>
      <footer className="ov-page-footer">
        <span>
          <span className="ov-tiny-dot" />
          Kept running by Vigil.
        </span>
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
function ShieldMark() {
  return (
    <span className="ov-shield-mark">
      <Check size={14} />
    </span>
  );
}
