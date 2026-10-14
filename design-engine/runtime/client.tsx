import { createRoot,hydrateRoot } from "react-dom/client";
import { SitePagePreview } from "../site/render";
import { parseSiteDefinition } from "../site/persistence";
import { resolveRoutes } from "../site/routes";
import "../styles.css";
import "../composition/styles.css";
import "../sections/storytelling/styles.css";

// The exact production renderer used by the workspace, with a portable route host.
const contact = document.getElementById("root")?.dataset.vigilContact;
const site = parseSiteDefinition(JSON.parse(document.getElementById("vigil-site")!.textContent!));
const path = location.pathname.replace(/\/$/, "") || "/";
const explicitPage = document.getElementById("root")?.dataset.vigilPage;
const page = site.pages.find(page => explicitPage ? page.id === explicitPage : resolveRoutes(site).get(page.id) === path);
if (page) {
  const root=document.getElementById('root')!,view=<SitePagePreview site={site} pageId={page.id} embedded={false} contactEndpoint={contact}/>;
  if(root.dataset.vigilSsr==='true')hydrateRoot(root,view);else createRoot(root).render(view);
} else {
  document.getElementById("root")!.textContent = "This page is unavailable.";
}
