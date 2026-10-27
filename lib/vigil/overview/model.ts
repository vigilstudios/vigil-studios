import type { Deployment, Domain, Lead, Website } from "@/lib/vigil/types";

export const DAY = 86_400_000;
export const RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof RANGES)[number];
export type ChartView = "area" | "bars" | "table";
export const REPORT_PANELS = [
  "insights",
  "traffic",
  "leads",
  "pipeline",
] as const;
export const WORK_PANELS = ["followup", "activity"] as const;
export const PANEL_IDS = [
  "website",
  "health",
  ...REPORT_PANELS,
  ...WORK_PANELS,
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
};
export type LayoutPreference = {
  version: 2;
  order: PanelId[];
  leadView: ChartView;
  trafficView: ChartView;
  statusView: "donut" | "bars";
};
export const DEFAULT_LAYOUT: LayoutPreference = {
  version: 2,
  order: [...PANEL_IDS],
  leadView: "area",
  trafficView: "area",
  statusView: "donut",
};
export const LAYOUT_METADATA_KEY = "vigil_overview_layout_v2";
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const panel = (v: unknown): v is PanelId =>
  typeof v === "string" && PANEL_IDS.includes(v as PanelId);
export function readLayout(input: unknown): LayoutPreference {
  if (!isObject(input) || input.version !== 2)
    return structuredClone(DEFAULT_LAYOUT);
  const order = Array.isArray(input.order)
    ? [...new Set(input.order.filter(panel))]
    : [];
  const group = (ids: readonly PanelId[]) => [
    ...order.filter((id) => ids.includes(id)),
    ...ids.filter((id) => !order.includes(id)),
  ];
  const view = (v: unknown): ChartView =>
    v === "bars" || v === "table" ? v : "area";
  return {
    version: 2,
    order: [
      "website",
      "health",
      ...group(REPORT_PANELS),
      ...group(WORK_PANELS),
    ],
    leadView: view(input.leadView),
    trafficView: view(input.trafficView),
    statusView: input.statusView === "bars" ? "bars" : "donut",
  };
}
export function canSwapPanels(id: PanelId, target: PanelId): boolean {
  return (
    id !== target &&
    [REPORT_PANELS, WORK_PANELS].some(
      (group) =>
        (group as readonly PanelId[]).includes(id) &&
        (group as readonly PanelId[]).includes(target),
    )
  );
}
/** Exchange the contents of two dashboard positions without shifting other panels. */
export function swapPanels(
  order: PanelId[],
  id: PanelId,
  target: PanelId,
): PanelId[] {
  const a = order.indexOf(id),
    b = order.indexOf(target);
  if (a < 0 || b < 0 || a === b) return [...order];
  const next = [...order];
  [next[a], next[b]] = [next[b], next[a]];
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
  previewAccent?: string | null;
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
