import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT,
  PANEL_IDS,
  comparison,
  leadReport,
  movePanel,
  rangeStart,
  readLayout,
} from "../overview/model";
const asOf = "2026-10-26T18:30:00Z";
const row = (received_at: string, status: "new" | "won" | "spam" = "new") => ({
  received_at,
  status,
  source: "contact-form",
});
describe("live overview reporting", () => {
  it("uses explicit UTC day boundaries and exclusive previous-period boundaries", () => {
    expect(new Date(rangeStart(asOf, 7)).toISOString()).toBe(
      "2026-10-20T00:00:00.000Z",
    );
    const report = leadReport(
      [
        row("2026-10-20T00:00:00Z"),
        row("2026-10-19T23:59:59Z"),
        row("2026-10-13T00:00:00Z"),
        row("2026-10-12T23:59:59Z"),
        row("2026-10-26T18:31:00Z"),
        row("invalid"),
      ],
      7,
      asOf,
    );
    expect(report.total).toBe(1);
    expect(report.previous).toBe(2);
    expect(report.series.reduce((a, b) => a + b.value, 0)).toBe(1);
  });
  it("excludes spam from counts, status shares and trends", () => {
    const report = leadReport(
      [
        row("2026-10-26T12:00:00Z"),
        row("2026-10-26T13:00:00Z", "won"),
        row("2026-10-26T14:00:00Z", "spam"),
      ],
      30,
      asOf,
    );
    expect(report.total).toBe(2);
    expect(report.won).toBe(1);
    expect(report.stages.reduce((a, b) => a + b.value, 0)).toBe(2);
    expect(report.sources).toEqual([{ label: "contact-form", value: 2 }]);
  });
  it.each([7, 30, 90] as const)(
    "keeps totals and chart buckets consistent for %d days",
    (days) => {
      const rows = Array.from({ length: 180 }, (_, i) =>
        row(new Date(Date.parse(asOf) - i * 86400000).toISOString()),
      );
      const report = leadReport(rows, days, asOf);
      expect(report.total).toBe(days);
      expect(report.previous).toBe(days);
      expect(report.series.reduce((a, b) => a + b.value, 0)).toBe(days);
      expect(report.series).toHaveLength(days === 90 ? 13 : days);
    },
  );
  it("handles an empty history without dividing by zero or inventing growth", () => {
    const report = leadReport([], 7, asOf);
    expect(report.total).toBe(0);
    expect(report.series.every((p) => p.value === 0)).toBe(true);
    expect(comparison(0, 0)).toBe("No inquiries in either period");
    expect(comparison(3, 0)).toBe("First recorded inquiries");
    expect(comparison(6, 4)).toBe("+50% vs previous period");
    expect(comparison(2, 4)).toBe("-50% vs previous period");
  });
});
describe("personal dashboard layouts", () => {
  it.each([null, {}, "bad", { version: 2 }])(
    "falls back safely for unsupported preferences: %j",
    (input) => {
      expect(readLayout(input)).toEqual(DEFAULT_LAYOUT);
    },
  );
  it("deduplicates panel ids, drops unknown fields and restores missing panels", () => {
    const layout = readLayout({
      version: 1,
      order: ["leads", "leads", "evil"],
      hidden: ["website", "health", "traffic", "traffic", "evil"],
      spans: { leads: 12, health: "999;background:red" },
      leadView: "table",
      trafficView: "unsupported",
      statusView: "bars",
      role: "admin",
    });
    expect(layout.order).toHaveLength(PANEL_IDS.length);
    expect(layout.order[0]).toBe("leads");
    expect(layout.hidden).toEqual(["traffic"]);
    expect(layout.spans.leads).toBe(12);
    expect(layout.spans.health).toBe(4);
    expect(layout.leadView).toBe("table");
    expect(layout.trafficView).toBe("area");
    expect(layout.statusView).toBe("bars");
    expect(layout).not.toHaveProperty("role");
  });
  it("moves in both directions without duplicating or losing panels", () => {
    expect(
      movePanel(["website", "health", "leads"], "website", "health"),
    ).toEqual(["health", "website", "leads"]);
    expect(
      movePanel(["website", "health", "leads"], "leads", "website"),
    ).toEqual(["leads", "website", "health"]);
    expect(movePanel(["website", "health"], "health", "health")).toEqual([
      "website",
      "health",
    ]);
  });
  it("returns independent defaults so one account cannot mutate another layout", () => {
    const a = readLayout(null);
    a.order.reverse();
    a.spans.website = 4;
    expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  });
});
