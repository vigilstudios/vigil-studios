import { z } from "zod";
import { RANGES, type ReportRange } from "@/lib/vigil/overview/model";

export const measurementKinds = [
  "traffic",
  "quality_mobile",
  "quality_desktop",
  "field_performance",
  "site_security",
  "repository_security",
  "search",
] as const;
export type MeasurementKind = (typeof measurementKinds)[number];
export const measurementLabels: Record<MeasurementKind, string> = {
  traffic: "Website traffic",
  quality_mobile: "Mobile site audit",
  quality_desktop: "Desktop site audit",
  field_performance: "Real-user speed",
  site_security: "Website security checks",
  repository_security: "Dependency alerts",
  search: "Google search results",
};
export const measurementSources: Record<MeasurementKind, string> = {
  traffic: "Vercel Web Analytics",
  quality_mobile: "PageSpeed Insights · Lighthouse",
  quality_desktop: "PageSpeed Insights · Lighthouse",
  field_performance: "Chrome UX Report",
  site_security: "Public HTTPS response",
  repository_security: "GitHub Dependabot",
  search: "Google Search Console",
};
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const metric = z.number().finite().nonnegative().nullable();
const score = z.number().finite().min(0).max(100).nullable();
const ranked = z.object({ label: z.string().min(1).max(160), value: count });
export const trafficRangeSchema = z.object({
  visitors: count,
  pageViews: count,
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  series: z
    .array(
      z.object({
        date: z.iso.datetime(),
        label: z.string().max(40),
        value: count,
      }),
    )
    .max(100),
  sources: z.array(ranked).max(20),
  pages: z.array(ranked).max(20),
});
export const trafficPayloadSchema = z.object({
  kind: z.literal("traffic"),
  timezone: z.literal("UTC"),
  collectionStartedAt: z.iso.datetime().nullable().optional(),
  ranges: z.object({
    "7": trafficRangeSchema,
    "30": trafficRangeSchema,
    "90": trafficRangeSchema,
  }),
});
export const qualityPayloadSchema = z.object({
  kind: z.literal("quality"),
  device: z.enum(["mobile", "desktop"]),
  auditVersion: z.string().max(80),
  measuredAt: z.iso.datetime(),
  seo: score,
  performance: score,
  accessibility: score,
  bestPractices: score,
  lcpMs: metric,
  fcpMs: metric,
  cls: metric,
  tbtMs: metric,
  issues: z
    .array(z.object({ id: z.string().max(100), title: z.string().max(240) }))
    .max(12),
});
export const fieldPayloadSchema = z.object({
  kind: z.literal("field"),
  formFactor: z.literal("PHONE"),
  lcpMs: metric,
  inpMs: metric,
  cls: metric,
  periodStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  periodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  sufficient: z.boolean(),
});
export const baselineCheckSchema = z.object({
  id: z.string().max(80),
  title: z.string().max(100),
  status: z.enum(["passed", "attention", "unknown"]),
  detail: z.string().max(240),
});
export const siteSecurityPayloadSchema = z.object({
  kind: z.literal("site_security"),
  statusCode: count,
  checks: z.array(baselineCheckSchema).max(12),
});
export const repositoryPayloadSchema = z.object({
  kind: z.literal("repository_security"),
  complete: z.boolean(),
  openCount: count,
  findings: z
    .array(
      z.object({
        reference: z.string().max(100),
        title: z.string().max(240),
        severity: z.enum(["low", "medium", "high", "critical"]),
        detectedAt: z.iso.datetime(),
      }),
    )
    .max(100),
});
export const searchPayloadSchema = z.object({
  kind: z.literal("search"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.literal("America/Los_Angeles"),
  clicks: count.nullable(),
  impressions: count.nullable(),
  ctr: z.number().min(0).max(1).nullable(),
  position: metric,
  queries: z
    .array(
      z.object({
        label: z.string().max(160),
        clicks: count,
        impressions: count,
      }),
    )
    .max(10),
});
export const measurementPayloadSchema = z.discriminatedUnion("kind", [
  trafficPayloadSchema,
  qualityPayloadSchema,
  fieldPayloadSchema,
  siteSecurityPayloadSchema,
  repositoryPayloadSchema,
  searchPayloadSchema,
]);
export type MeasurementPayload = z.infer<typeof measurementPayloadSchema>;
export type TrafficPayload = z.infer<typeof trafficPayloadSchema>;
export type QualityPayload = z.infer<typeof qualityPayloadSchema>;
export type FieldPayload = z.infer<typeof fieldPayloadSchema>;
export type SearchPayload = z.infer<typeof searchPayloadSchema>;
export type ConnectionState =
  | "not_connected"
  | "collecting"
  | "current"
  | "stale"
  | "attention"
  | "insufficient"
  | "paused";
export type MeasurementConnectionView = {
  id: string;
  kind: MeasurementKind;
  enabled: boolean;
  revision: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  nextRunAt: string;
  state: ConnectionState;
  observedAt: string | null;
  expiresAt: string | null;
  payload: MeasurementPayload | null;
  errorCode?: string | null;
};
export type WebsiteMeasurements = {
  available: boolean;
  connections: MeasurementConnectionView[];
  updatesEnabled?: boolean;
};
export const measurementStateLabels: Record<ConnectionState, string> = {
  not_connected: "Not connected",
  collecting: "Collecting",
  current: "Up to date",
  stale: "Update overdue",
  attention: "Connection needs attention",
  insufficient: "Not enough data yet",
  paused: "Updates paused",
};
export function rangesFromTraffic(payload: TrafficPayload) {
  return Object.fromEntries(
    RANGES.map((range) => [
      range,
      payload.ranges[String(range) as `${ReportRange}`],
    ]),
  ) as Record<ReportRange, z.infer<typeof trafficRangeSchema>>;
}
export function payloadMatchesKind(
  kind: MeasurementKind,
  payload: MeasurementPayload,
) {
  return kind === "quality_mobile"
    ? payload.kind === "quality" && payload.device === "mobile"
    : kind === "quality_desktop"
      ? payload.kind === "quality" && payload.device === "desktop"
      : kind === "field_performance"
        ? payload.kind === "field"
        : kind === payload.kind;
}

export function runnerState(
  health: { status: string; started_at: string; finished_at: string | null },
  asOf = Date.now(),
): "healthy" | "attention" | "overdue" {
  if (health.status === "error") return "attention";
  const age = asOf - Date.parse(health.started_at);
  if (
    !Number.isFinite(age) ||
    age < 0 ||
    age > 3 * 60 * 60 * 1000 ||
    (health.status === "running" && age > 10 * 60 * 1000)
  )
    return "overdue";
  return "healthy";
}
