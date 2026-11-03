import { createRoot } from "react-dom/client";
import { AppFrame } from "@/components/vigil/AppFrame";
import { PageHeader } from "@/components/vigil/ui";
import { WebsiteMeasurementsView } from "@/components/vigil/WebsiteMeasurements";
import { previewMeasurements } from "./fixture";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
createRoot(document.getElementById("root")!).render(
  <AppFrame
    homeHref="/"
    initialCollapsed={false}
    workspaceBrand={{ name: "Marlow & Fen", iconUrl: null }}
    workspace={
      <span style={{ fontSize: 13, fontWeight: 600 }}>Marlow & Fen</span>
    }
    account={
      <p style={{ fontSize: 11, padding: 16 }}>
        Fictional preview · No live connections
      </p>
    }
    groups={[
      {
        items: [
          { href: "/overview", label: "Overview", icon: "overview" },
          { href: "/dashboard", label: "Website analytics", icon: "insights" },
        ],
      },
    ]}
  >
    <PageHeader
      eyebrow="Marlow & Fen"
      title="Website analytics"
      description="Traffic, search visibility, speed and security checks, with the evidence behind each result."
    />
    <WebsiteMeasurementsView
      data={previewMeasurements(params.get("state") ?? "current")}
    />
  </AppFrame>,
);
