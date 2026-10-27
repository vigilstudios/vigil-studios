import type { Deployment, Domain, Lead, Website } from "@/lib/vigil/types";

export const DAY = 86_400_000;
export const RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof RANGES)[number];
export type ChartView = "area" | "bars" | "table";
export const PANEL_IDS = [
  "website",
  "health",
  "leads",
  "pipeline",
  "traffic",
  "insights",
  "followup",
  "activity",
  "service",
] as const;
export type PanelId = (typeof PANEL_IDS)[number];
export const PANEL_LABELS: Record<PanelId, string> = {
  website: "Your website",
  health: "Health & security",
  leads: "Inquiry trends",
  pipeline: "Lead status",
  traffic: "Website traffic",
  insights: "Insights",
  followup: "Your inbox",
  activity: "Recent activity",
  service: "Your Vigil plan",
};
export type LayoutPreference = {
  version: 1;
  order: PanelId[];
  hidden: PanelId[];
  spans: Record<PanelId, 4 | 8 | 12>;
  leadView: ChartView;
  trafficView: ChartView;
  statusView: "donut" | "bars";
};
export const DEFAULT_LAYOUT: LayoutPreference = {
  version: 1,
  order: [...PANEL_IDS],
  hidden: [],
  spans: {
    website: 8,
    health: 4,
    leads: 8,
    pipeline: 4,
    traffic: 8,
    insights: 4,
    followup: 8,
    activity: 4,
    service: 12,
  },
  leadView: "area",
  trafficView: "area",
  statusView: "donut",
};
export const LAYOUT_METADATA_KEY = "vigil_overview_layout_v1";
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const panel = (v: unknown): v is PanelId =>
  typeof v === "string" && PANEL_IDS.includes(v as PanelId);
export function readLayout(input: unknown): LayoutPreference {
  if (!isObject(input) || input.version !== 1)
    return structuredClone(DEFAULT_LAYOUT);
  const order = Array.isArray(input.order)
    ? [...new Set(input.order.filter(panel))]
    : [];
  const spans = { ...DEFAULT_LAYOUT.spans };
  if (isObject(input.spans))
    for (const id of PANEL_IDS) {
      const value = input.spans[id];
      if (value === 4 || value === 8 || value === 12) spans[id] = value;
    }
  const view = (v: unknown): ChartView =>
    v === "bars" || v === "table" ? v : "area";
  return {
    version: 1,
    order: [...order, ...PANEL_IDS.filter((id) => !order.includes(id))],
    hidden: Array.isArray(input.hidden)
      ? [...new Set(input.hidden.filter(panel))].filter(
          (id) => id !== "website" && id !== "health",
        )
      : [],
    spans,
    leadView: view(input.leadView),
    trafficView: view(input.trafficView),
    statusView: input.statusView === "bars" ? "bars" : "donut",
  };
}
export function movePanel(
  order: PanelId[],
  id: PanelId,
  target: PanelId,
): PanelId[] {
  if (id === target || !order.includes(id) || !order.includes(target))
    return [...order];
  const next = order.filter((item) => item !== id);
  next.splice(order.indexOf(target), 0, id);
  return next;
}
export type SeriesPoint = { date: string; label: string; value: number };
export type LeadDatum = Pick<Lead, "received_at" | "status" | "source">;
export type InboxLead = Pick<
  Lead,
  "id" | "contact" | "status" | "received_at" | "read_at" | "source"
>;
export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "booked",
  "won",
  "lost",
] as const;
export const STAGE_LABELS = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  booked: "Booked",
  won: "Won",
  lost: "Closed / lost",
};
export const STAGE_COLORS = {
  new: "var(--accent)",
  contacted: "var(--ov-cyan)",
  qualified: "var(--ov-purple)",
  booked: "var(--ov-blue)",
  won: "var(--ov-lime)",
  lost: "var(--ov-muted)",
};
export type LeadReport = {
  total: number;
  previous: number;
  won: number;
  booked: number;
  series: SeriesPoint[];
  stages: { key: (typeof STAGES)[number]; label: string; value: number }[];
  sources: { label: string; value: number }[];
};
export function rangeStart(asOf: string, days: number) {
  const date = new Date(asOf);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() - (days - 1) * DAY;
}
export function leadReport(
  rows: LeadDatum[],
  days: ReportRange,
  asOf: string,
): LeadReport {
  const end = new Date(asOf).getTime(),
    start = rangeStart(asOf, days),
    previousStart = start - days * DAY;
  const current = rows.filter(
    (row) =>
      row.status !== "spam" &&
      Date.parse(row.received_at) >= start &&
      Date.parse(row.received_at) <= end,
  );
  const previous = rows.filter(
    (row) =>
      row.status !== "spam" &&
      Date.parse(row.received_at) >= previousStart &&
      Date.parse(row.received_at) < start,
  ).length;
  const bucketDays = days === 90 ? 7 : 1;
  const series = Array.from(
    { length: Math.ceil(days / bucketDays) },
    (_, i) => {
      const at = start + i * bucketDays * DAY;
      return {
        date: new Date(at).toISOString(),
        label: new Date(at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        value: current.filter(
          (row) =>
            Date.parse(row.received_at) >= at &&
            Date.parse(row.received_at) < at + bucketDays * DAY,
        ).length,
      };
    },
  );
  const sourceCounts = new Map<string, number>();
  current.forEach((row) => {
    const label = row.source || "Website inquiry";
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  });
  return {
    total: current.length,
    previous,
    won: current.filter((row) => row.status === "won").length,
    booked: current.filter((row) => row.status === "booked").length,
    series,
    stages: STAGES.map((key) => ({
      key,
      label: STAGE_LABELS[key],
      value: current.filter((row) => row.status === key).length,
    })),
    sources: [...sourceCounts]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}
export function comparison(total: number, previous: number) {
  if (!previous)
    return total ? "First recorded inquiries" : "No inquiries in either period";
  const change = Math.round(((total - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}% vs previous period`;
}
export type TrafficReport = {
  visitors: number;
  pageViews: number;
  series: SeriesPoint[];
  sources: { label: string; value: number }[];
  pages: { label: string; value: number }[];
};
export type OverviewData = {
  asOf: string;
  organizationName: string;
  userName: string | null;
  site: Pick<
    Website,
    | "id"
    | "name"
    | "live_url"
    | "health_ok"
    | "last_health_at"
    | "last_deployed_at"
    | "export_eligible"
    | "code_ownership"
  >;
  sites: { id: string; name: string }[];
  domain: Pick<
    Domain,
    "hostname" | "dns_ok" | "ssl_ok" | "last_checked_at"
  > | null;
  reports: Record<ReportRange, LeadReport>;
  completeHistory: boolean;
  historyCount: number;
  queue: InboxLead[];
  recent: InboxLead[];
  awaiting: number;
  unread: number;
  captureEnabled: boolean;
  traffic: Record<ReportRange, TrafficReport> | null;
  activity: {
    id: string;
    title: string;
    at: string;
    tone: "good" | "warn" | "bad" | "info" | "neutral";
  }[];
  releases: Pick<
    Deployment,
    "id" | "status" | "environment" | "created_at" | "finished_at"
  >[];
  subscription: {
    name: string;
    status: string;
    renewsAt: string | null;
    cancels: boolean;
  } | null;
  openRequests: number;
  canExport: boolean;
  canRequest: boolean;
  otherProjects: number;
};
