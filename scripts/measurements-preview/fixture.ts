// Fictional design-lab data. This module is never imported by application routes.
import {
  measurementKinds,
  type MeasurementPayload,
  type WebsiteMeasurements,
} from "@/lib/vigil/measurements/contract";
const timestamp = "2026-11-02T14:00:00.000Z";
const range = {
  visitors: 243,
  pageViews: 514,
  periodStart: "2026-10-04T00:00:00.000Z",
  periodEnd: timestamp,
  series: [],
  pages: [
    { label: "/", value: 298 },
    { label: "/services", value: 162 },
    { label: "/contact", value: 54 },
  ],
  sources: [
    { label: "google.com", value: 113 },
    { label: "Direct / unknown", value: 82 },
    { label: "instagram.com", value: 48 },
  ],
};
const audit = {
  kind: "quality" as const,
  auditVersion: "13",
  measuredAt: timestamp,
  seo: 96,
  performance: 87,
  accessibility: 94,
  bestPractices: 100,
  lcpMs: 2100,
  fcpMs: 1300,
  cls: 0.02,
  tbtMs: 74,
  issues: [
    {
      id: "image-delivery",
      title: "Improve image delivery on the service page",
    },
  ],
};
const payloads: MeasurementPayload[] = [
  {
    kind: "traffic",
    timezone: "UTC",
    ranges: { "7": range, "30": range, "90": range },
  },
  { ...audit, device: "mobile" },
  { ...audit, device: "desktop", performance: 98, lcpMs: 1100 },
  {
    kind: "field",
    formFactor: "PHONE",
    sufficient: false,
    lcpMs: null,
    inpMs: null,
    cls: null,
    periodStart: null,
    periodEnd: null,
  },
  {
    kind: "site_security",
    statusCode: 200,
    checks: [
      {
        id: "https",
        title: "HTTPS response",
        status: "passed",
        detail: "A valid HTTPS connection returned a successful response.",
      },
      {
        id: "hsts",
        title: "Strict transport policy",
        status: "passed",
        detail: "An HSTS policy with a positive max-age was observed.",
      },
      {
        id: "csp",
        title: "Content security policy",
        status: "attention",
        detail:
          "The response did not include a Content-Security-Policy header.",
      },
    ],
  },
  {
    kind: "repository_security",
    complete: true,
    openCount: 1,
    findings: [
      {
        reference: "fictional-alert",
        title: "Update an affected image-processing dependency",
        severity: "high",
        detectedAt: timestamp,
      },
    ],
  },
  {
    kind: "search",
    periodStart: "2026-10-03",
    periodEnd: "2026-10-30",
    timezone: "America/Los_Angeles",
    clicks: 113,
    impressions: 1830,
    ctr: 113 / 1830,
    position: 12.4,
    queries: [
      { label: "local interior design studio", clicks: 29, impressions: 420 },
      { label: "marlow and fen", clicks: 54, impressions: 112 },
    ],
  },
];
export function previewMeasurements(state = "current"): WebsiteMeasurements {
  return {
    available: true,
    updatesEnabled: state !== "paused",
    connections:
      state === "empty"
        ? []
        : measurementKinds.map((kind, index) => ({
            id: `fictional-${kind}`,
            kind,
            enabled: true,
            revision: 1,
            lastAttemptAt: timestamp,
            lastSuccessAt: timestamp,
            nextRunAt: timestamp,
            observedAt: timestamp,
            expiresAt: "2026-11-04T14:00:00.000Z",
            state:
              state === "stale"
                ? "stale"
                : kind === "field_performance"
                  ? "insufficient"
                  : kind === "repository_security"
                    ? "attention"
                    : "current",
            payload: payloads[index],
          })),
  };
}
