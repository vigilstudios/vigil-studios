import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppFrame } from "@/components/vigil/AppFrame";
import { AccountBlock } from "@/components/vigil/AccountBlock";
import { LiveOverviewDashboard } from "@/components/vigil/overview/LiveOverviewDashboard";
import { readLayout } from "@/lib/vigil/overview/model";
import { sampleOverview } from "./fixture";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import "./preview.css";
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
function Preview() {
  const [initial] = useState(() => {
    try {
      return readLayout(
        JSON.parse(localStorage.getItem("overview-sample-layout") || "null"),
      );
    } catch {
      return readLayout(null);
    }
  });
  return (
    <AppFrame
      homeHref="/"
      initialCollapsed={params.has("rail")}
      workspace={
        <span style={{ fontSize: 13, fontWeight: 600 }}>Marlow & Fen</span>
      }
      account={<AccountBlock name="Alex Morgan" email="alex@example.com" />}
      groups={[
        {
          items: [
            { href: "/", label: "Overview", icon: "overview", exact: true },
            {
              href: "/dashboard/content",
              label: "Content Hub",
              icon: "blog",
              premium: true,
            },
            { href: "/dashboard/files", label: "Files", icon: "files" },
            {
              href: "/dashboard/requests",
              label: "Requests",
              icon: "requests",
              premium: true,
            },
            { href: "/dashboard/domain", label: "Domain", icon: "domain" },
            {
              href: "/dashboard/billing",
              label: "Subscription",
              icon: "billing",
            },
          ],
        },
        {
          label: "GROW",
          items: [
            { href: "/dashboard/leads", label: "Lead Hub", icon: "leads" },
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
        {
          items: [
            {
              href: "/dashboard/settings",
              label: "Settings",
              icon: "settings",
            },
          ],
        },
      ]}
    >
      <LiveOverviewDashboard
        data={sampleOverview(params.has("empty"), params.has("disconnected"))}
        initialLayout={initial}
        sample
        saveLayout={async (layout) => {
          if (params.has("fail"))
            return {
              ok: false,
              error: "Sample save failed. Try again.",
              code: "validation",
            };
          localStorage.setItem(
            "overview-sample-layout",
            JSON.stringify(layout),
          );
          return { ok: true, data: undefined };
        }}
      />
    </AppFrame>
  );
}
const testWidth = params.get("viewport");
const testParams = new URLSearchParams(params);
testParams.delete("viewport");
createRoot(document.getElementById("root")!).render(
  testWidth && ["320", "390", "768"].includes(testWidth) ? (
    <div style={{ padding: 24, background: "#e8ebef", minHeight: "100vh" }}>
      <p style={{ font: "12px Arial", marginBottom: 12 }}>
        Responsive test · {testWidth}px viewport · production components
      </p>
      <iframe
        title={`${testWidth}px dashboard test`}
        src={`/?${testParams}`}
        style={{
          width: Number(testWidth),
          height: 900,
          border: 0,
          outline: "1px solid #ccd2da",
          display: "block",
          background: "white",
        }}
      />
    </div>
  ) : (
    <Preview />
  ),
);
