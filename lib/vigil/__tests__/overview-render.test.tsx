import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveOverviewDashboard } from "@/components/vigil/overview/LiveOverviewDashboard";
import {
  ActivityPanel,
  InboxPanel,
  WebsitePanel,
} from "@/components/vigil/overview/OverviewPanels";
import { readLayout } from "@/lib/vigil/overview/model";
import { sampleOverview } from "../../../scripts/overview-preview/fixture";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
import { previewMeasurements } from "../../../scripts/measurements-preview/fixture";
import { TrendChart } from "@/components/vigil/overview/OverviewCharts";
const save = async () => ({ ok: true as const, data: undefined });
describe("adaptive working panels", () => {
  it("expands the inbox to five contacts and simplifies it to three in the narrow position", () => {
    const data = sampleOverview();
    const wide = renderToStaticMarkup(<InboxPanel data={data} />);
    const narrow = renderToStaticMarkup(<InboxPanel data={data} compact />);
    expect(wide).toContain("Maya Chen");
    expect(wide).toContain("<table>");
    expect(narrow).toContain("Olivia Bennett");
    expect(narrow).not.toContain("Maya Chen");
    expect(narrow).not.toContain("<table>");
  });
  it("shows more activity and full dates in the wide position", () => {
    const data = sampleOverview();
    const wide = renderToStaticMarkup(<ActivityPanel data={data} />);
    const narrow = renderToStaticMarkup(<ActivityPanel data={data} compact />);
    expect(wide).toContain("Domain verification completed");
    expect(wide).toContain("Oct 23, 2026");
    expect(narrow).not.toContain("Domain verification completed");
  });
});
describe("overview data truth in the rendered interface", () => {
  it("does not show invented traffic metrics when analytics is unconnected", () => {
    const html = renderToStaticMarkup(
      <LiveOverviewDashboard
        data={sampleOverview(true, true)}
        initialLayout={readLayout(null)}
        saveLayout={save}
      />,
    );
    expect(html).toContain("Analytics not connected");
    expect(html).toContain("No visitor data is available yet.");
    expect(html).toContain("Coming soon");
    expect(html).toContain("You’re all caught up.");
    expect(html).not.toContain("2,846");
    expect(html).not.toContain("99.9%");
  });
  it("shows pending availability instead of claiming a live URL is proof of health", () => {
    const data = sampleOverview();
    data.site.last_health_at = null;
    data.site.health_ok = true;
    data.domain = null;
    const html = renderToStaticMarkup(
      <LiveOverviewDashboard
        data={data}
        initialLayout={readLayout(null)}
        saveLayout={save}
      />,
    );
    expect(html).toContain("Availability");
    expect(html).toContain("Pending");
    expect(html).not.toContain("Passed");
  });
  it("warns when history is capped and suppresses a growth comparison", () => {
    const data = sampleOverview();
    data.completeHistory = false;
    data.historyCount = 15000;
    const html = renderToStaticMarkup(
      <LiveOverviewDashboard
        data={data}
        initialLayout={readLayout(null)}
        saveLayout={save}
      />,
    );
    expect(html).toContain("Period totals may be incomplete");
    expect(html).toContain("15,000");
    expect(html).not.toContain("+50% vs previous period");
  });
});

describe("recorded availability and sparse traffic", () => {
  it("uses a current measured HTTPS response when legacy health was never checked", () => {
    const data = {
      ...sampleOverview(),
      asOf: "2026-11-02T14:00:00.000Z",
      measurements: previewMeasurements("current"),
    };
    data.site.last_health_at = null;
    data.domain = null;
    expect(renderToStaticMarkup(<WebsitePanel data={data} />)).toContain(
      "Passed",
    );
    data.measurements.connections = data.measurements.connections.map((c) => ({
      ...c,
      state: "stale" as const,
    }));
    const html = renderToStaticMarkup(<WebsitePanel data={data} />);
    expect(html).toContain("Needs refresh");
    expect(html).not.toContain("Passed");
  });
  it("draws the one actual observation without adding dates", () => {
    const html = renderToStaticMarkup(
      <TrendChart
        points={[{ date: "2026-11-04", label: "Nov 4", value: 1 }]}
        view="area"
        label="Visitors"
      />,
    );
    expect(html).toContain("<circle");
    expect(html).toContain("Nov 4: 1 visitors");
    expect((html.match(/data-point=/g) || []).length).toBe(1);
  });
});
