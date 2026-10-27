import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveOverviewDashboard } from "@/components/vigil/overview/LiveOverviewDashboard";
import { readLayout } from "@/lib/vigil/overview/model";
import { sampleOverview } from "../../../scripts/overview-preview/fixture";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
const save = async () => ({ ok: true as const, data: undefined });
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
    expect(html).toContain("0/3");
    expect(html).toContain("Waiting for a complete picture");
    expect(html).toContain("Pending");
    expect(html).not.toContain("Your latest checks look good");
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
