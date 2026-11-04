import { createRoot } from "react-dom/client";
import { AppFrame } from "@/components/vigil/AppFrame";
import { LiveOverviewDashboard } from "@/components/vigil/overview/LiveOverviewDashboard";
import { WebsiteReport } from "@/components/vigil/WebsiteReport";
import { readLayout } from "@/lib/vigil/overview/model";
import {
  measurementRange,
  measurementReport,
} from "@/lib/vigil/measurements/navigation";
import { overviewMeasurementData } from "@/lib/vigil/measurements/overview";
import { sampleOverview } from "../overview-preview/fixture";
import { previewMeasurements } from "./fixture";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import "../overview-preview/preview.css";
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
const state = params.get("state") ?? "current",
  range = measurementRange(params.get("range"));
const measurements = previewMeasurements(state);
const base = sampleOverview(
  state === "empty",
  state === "empty",
  false,
  state === "stale" ? "2026-11-10T14:00:00.000Z" : "2026-11-02T14:00:00.000Z",
);
const data = {
  ...base,
  ...overviewMeasurementData(measurements),
  measurements,
};
// Explicit sparse-history scenario; all values remain fictional preview data.
if (params.get("history") === "single" && data.traffic) {
  for (const days of [7, 30, 90] as const) {
    data.traffic[days] = {...data.traffic[days], visitors:1, pageViews:3, series:[{date:base.asOf, label:"Nov 2", value:1}]};
  }
}
const report = measurementReport(params.get("report"));
let initial = readLayout(null);
try {
  initial = readLayout(
    JSON.parse(localStorage.getItem("overview-measurements-layout") || "null"),
  );
} catch {
  /* Use the standard layout. */
}
createRoot(document.getElementById("root")!).render(
  <AppFrame
    homeHref="/dashboard"
    initialCollapsed={false}
    workspaceBrand={{
      name: data.organizationName,
      iconUrl: "/sample-icon.svg",
    }}
    workspace={
      <span style={{ fontSize: 13, fontWeight: 600 }}>
        {data.organizationName}
      </span>
    }
    account={
      <p style={{ fontSize: 11, padding: 16 }}>
        Fictional preview · No live connections
      </p>
    }
    groups={[
      {
        items: [
          {
            href: "/dashboard",
            label: "Overview",
            icon: "overview",
            exact: true,
            activePaths: ["/dashboard/analytics"],
          },
        ],
      },
      {
        label: "Grow",
        items: [
          {
            href: "/dashboard/insights",
            label: "Insights",
            icon: "insights",
            disabled: true,
            badge: "Soon",
          },
          {
            href: "/dashboard/virtue",
            label: "Virtue",
            icon: "virtue",
            disabled: true,
            badge: "Soon",
          },
        ],
      },
    ]}
  >
    {location.pathname === "/dashboard/analytics" ? (
      <>
        <p className="ov-sample-banner">
          Fictional report · No live connections
        </p>
        <WebsiteReport
          site={data.site}
          sites={data.sites}
          data={measurements}
          range={range}
          report={report}
        />
      </>
    ) : (
      <LiveOverviewDashboard
        data={data}
        initialLayout={initial}
        initialRange={range}
        sample
        saveLayout={async (layout) => {
          localStorage.setItem(
            "overview-measurements-layout",
            JSON.stringify(layout),
          );
          return { ok: true, data: undefined };
        }}
      />
    )}
  </AppFrame>,
);
