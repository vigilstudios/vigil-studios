import { createRoot } from "react-dom/client";
import { SitePagePreview } from "../site/render";
import { parseSiteDefinition } from "../site/persistence";
import { resolveRoutes } from "../site/routes";
import "../styles.css";
import "../composition/styles.css";
import "../sections/storytelling/styles.css";

// The exact production renderer used by the workspace, with a portable route host.
const site = parseSiteDefinition(JSON.parse(document.getElementById("vigil-site")!.textContent!));
const path = location.pathname.replace(/\/$/, "") || "/";
const explicitPage = document.getElementById("root")?.dataset.vigilPage;
const page = site.pages.find(page => explicitPage ? page.id === explicitPage : resolveRoutes(site).get(page.id) === path);
if (page) {
  createRoot(document.getElementById("root")!).render(<SitePagePreview site={site} pageId={page.id} embedded={false}/>);
} else {
  document.getElementById("root")!.textContent = "This page is unavailable.";
}
