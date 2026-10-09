/** Local-only real editor QA. Never imported into the production application. */
import { createRoot } from "react-dom/client";
import { CompositionLab } from "../design-engine/preview/composition/CompositionLab";
import { SitePagePreview } from "../design-engine/site/render";
import { deserializeSite, siteDraftKey } from "../design-engine/site/persistence";
import seed from "../docs/design-engine/creator-express-editor/muse-bennett.site.json";
import "../design-engine/styles.css";
import "../design-engine/composition/styles.css";
import "../design-engine/sections/storytelling/styles.css";
import "../design-engine/preview/editor/editor.css";
import "../design-engine/preview/composition/lab.css";
const site=deserializeSite(JSON.stringify(seed));
if(!localStorage.getItem(siteDraftKey))localStorage.setItem(siteDraftKey,JSON.stringify(seed));
const fonts={fraunces:"qa-fraunces",bodoni:"qa-bodoni-moda",public:"qa-public-sans",jost:"qa-jost",anton:"qa-anton",source:"qa-source-sans-3",plex:"qa-ibm-plex-mono",archivo:"qa-archivo-black",recursive:"qa-recursive",cormorant:"qa-cormorant-garamond"};
createRoot(document.getElementById("root")!).render((new URLSearchParams(location.search).has("site") || location.hash)?<SitePagePreview site={site} pageId={site.navigation.homePageId} fonts={fonts}/>:<CompositionLab/>);
