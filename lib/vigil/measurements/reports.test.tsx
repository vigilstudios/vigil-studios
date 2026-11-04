import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WebsiteReport } from "@/components/vigil/WebsiteReport";
import { LiveOverviewDashboard } from "@/components/vigil/overview/LiveOverviewDashboard";
import { readLayout } from "@/lib/vigil/overview/model";
import {
  measurementRange,
  measurementReport,
  measurementReportHref,
  overviewHref,
} from "./navigation";
import { overviewMeasurementData } from "./overview";
import { previewMeasurements } from "../../../scripts/measurements-preview/fixture";
import { sampleOverview } from "../../../scripts/overview-preview/fixture";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
const measurements = previewMeasurements();
const base = sampleOverview(false, false, false, "2026-11-02T14:00:00.000Z");
const site = { id: base.site.id, name: base.site.name };
describe("Overview report journeys", () => {
  it.each([7, 30, 90] as const)(
    "carries the selected %d-day range from Overview into every report and back",
    (range) => {
      const html = renderToStaticMarkup(
        <LiveOverviewDashboard
          data={{
            ...base,
            ...overviewMeasurementData(measurements),
            measurements,
          }}
          initialLayout={readLayout(null)}
          initialRange={range}
          saveLayout={async () => ({ ok: true, data: undefined })}
        />,
      );
      for (const report of ["traffic", "quality", "security"] as const) {
        expect(html).toContain(
          measurementReportHref(site.id, range, report).replaceAll(
            "&",
            "&amp;",
          ),
        );
        const details = renderToStaticMarkup(
          <WebsiteReport
            site={site}
            sites={[site]}
            data={measurements}
            report={report}
            range={range}
          />,
        );
        expect(details).toContain(
          overviewHref(site.id, range).replaceAll("&", "&amp;"),
        );
        expect(details).toContain('aria-label="Breadcrumb"');
      }
    },
  );
  it("uses the same stored traffic numbers on Overview and its selected-period report", () => {
    const overview = overviewMeasurementData(measurements);
    const html = renderToStaticMarkup(
      <WebsiteReport
        site={site}
        sites={[site]}
        data={measurements}
        report="traffic"
        range={7}
      />,
    );
    expect(html).toContain("Recorded visitors · 7 days");
    expect(html).toContain(`>${overview.traffic![7].visitors}<`);
    expect(html).not.toContain("Recorded visitors · 30 days");
    expect(html).not.toContain("Mobile site audit");
    expect(html).not.toContain("Dependency alerts");
  });
  it("shows quality and search evidence together without unrelated traffic or security cards", () => {
    const html = renderToStaticMarkup(
      <WebsiteReport
        site={site}
        sites={[site]}
        data={measurements}
        report="quality"
        range={90}
      />,
    );
    for (const title of [
      "Mobile site audit",
      "Desktop site audit",
      "Real-user speed",
      "Google search results",
    ])
      expect(html).toContain(title);
    expect(html).not.toContain("Recorded visitors");
    expect(html).not.toContain("Dependency alerts");
    expect(html).toContain("Finalized search data");
    expect(html).toContain("2026-10-03");
  });
  it("retains the context when switching the selected website within a report", () => {
    const html = renderToStaticMarkup(
      <WebsiteReport
        site={site}
        sites={[site, { id: "other-site", name: "Second website" }]}
        data={measurements}
        report="security"
        range={7}
      />,
    );
    expect(html).toContain('name="report" value="security"');
    expect(html).toContain('name="range" value="7"');
    expect(html).toContain('value="other-site"');
    expect(html).toContain("Website security checks");
    expect(html).not.toContain("SEO audit");
  });
  it("defaults malformed or repeated query values safely and encodes identifiers as query data", () => {
    for (const value of [undefined, "bad", "7.5", ["7", "90"]])
      expect(measurementRange(value)).toBe(30);
    expect(measurementReport(["quality", "security"])).toBe("traffic");
    const url = new URL(
      measurementReportHref("site&report=security", 7, "traffic"),
      "https://app.example.com",
    );
    expect(url.searchParams.get("website")).toBe("site&report=security");
    expect(url.searchParams.get("report")).toBe("traffic");
  });
});
