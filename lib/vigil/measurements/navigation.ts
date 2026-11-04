import { RANGES, type ReportRange } from "@/lib/vigil/overview/model";
import type { MeasurementKind } from "./contract";

export const measurementReports = {
  traffic: {
    title: "Traffic report",
    description:
      "Audience, page views and discovery sources for your selected period.",
    kinds: ["traffic"],
  },
  quality: {
    title: "SEO & speed report",
    description:
      "Search visibility, device audits and real-user speed, with each source’s own measurement dates.",
    kinds: ["quality_mobile", "quality_desktop", "field_performance", "search"],
  },
  security: {
    title: "Security report",
    description:
      "The latest website checks and dependency findings, including their coverage and freshness.",
    kinds: ["site_security", "repository_security"],
  },
} as const satisfies Record<
  string,
  { title: string; description: string; kinds: readonly MeasurementKind[] }
>;
export type MeasurementReport = keyof typeof measurementReports;

export function measurementReport(value: unknown): MeasurementReport {
  return value === "quality" || value === "security" ? value : "traffic";
}
export function measurementRange(value: unknown): ReportRange {
  return RANGES.find((days) => value === days || value === String(days)) ?? 30;
}
export function overviewHref(website: string, range: ReportRange) {
  return `/dashboard?${new URLSearchParams({ website, range: String(range) })}`;
}
export function measurementReportHref(
  website: string,
  range: ReportRange,
  report: MeasurementReport,
) {
  return `/dashboard/analytics?${new URLSearchParams({ website, range: String(range), report })}`;
}
