/** Loopback-only visual fixture: portable renderers and the real editor. */
import { createRoot } from "react-dom/client";
import { ProfessionalLab } from "../design-engine/preview/editor/ProfessionalLab";
import { CompositionPreview } from "../design-engine/composition/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { adaptSectionExample } from "../design-engine/preview/client-adaptations";
import { creatorImagePackages } from "../design-engine/preview/creator-image-packages";
import { parseSection, type SectionId, type PageComposition } from "../design-engine/composition/schemas";
import "../design-engine/styles.css";
import "../design-engine/composition/styles.css";
import "../design-engine/sections/storytelling/styles.css";
import "../design-engine/preview/editor/editor.css";
import "../design-engine/preview/composition/lab.css";
import "../design-engine/preview/calibration/calibration.css";
const params = new URLSearchParams(location.search);
const pack = creatorImagePackages.find(pack => pack.id === params.get("pack")) ?? creatorImagePackages[0];
const fonts = { fraunces:"qa-fraunces",bodoni:"qa-bodoni-moda",public:"qa-public-sans",jost:"qa-jost",anton:"qa-anton",source:"qa-source-sans-3",plex:"qa-ibm-plex-mono",archivo:"qa-archivo-black",recursive:"qa-recursive",cormorant:"qa-cormorant-garamond" };
function fixture() {
 const component = (params.get("component") ?? "about.creator-profile") as SectionId;
 let section = adaptSectionExample(makeSection(component, "creator-section"), pack.id);
 const choices = Object.fromEntries([...params].filter(([key]) => key in section && !["id", "component", "content", "media"].includes(key)));
 section = parseSection({ ...section, ...choices });
 if (params.has("stress")) {
  if (section.component === "about.creator-profile") section = parseSection({ ...section, content: { ...section.content, biography: "An everyday creator with stories from coffee shops, gym sessions and quiet road trips. ".repeat(27), interests: Array.from({ length: 8 }, (_, i) => ({ id: `interest-${i}`, label: "Everyday storytelling and daily rituals" })) } });
  if (section.component === "proof.social-reach") section = parseSection({ ...section, content: { ...section.content, stats: Array.from({ length: 8 }, (_, i) => ({ id: `stat-${i}`, value: "999,999,999", label: "People following the everyday journal", platform: "My social channel", period: "The previous calendar quarter" })), socials: Array.from({ length: 8 }, (_, i) => ({ id: `profile-${i}`, platform: `Social channel ${i + 1}`, handle: "@my-long-everyday-creator-handle", href: "https://example.com/" })) } });
 }
 const dark = pack.set.endsWith("dark"), pink = pack.set.startsWith("pink");
 const page: PageComposition = { id:"creator-qa",label:"Creator section QA",site:{typography:"humanist",artDirection:"gallery",motion:"none",brand:{theme:"neutral",colors:{background:pack.background,foreground:pack.foreground,accent:pack.accent,accentForeground:pack.background,surface:dark?(pink?"#30232a":"#302b25"):(pink?"#f2e0e5":"#ede4d8"),surfaceElevated:dark?(pink?"#3b2b33":"#3b332c"):(pink?"#fff6f8":"#fffaf2"),muted:dark?"#c2afb5":"#6c5960",border:dark?"#68545c":"#ccb6bf"}},icons:{id:"core",strokeWidth:1.5}},sections:[section] };
 return <CompositionPreview composition={page} fonts={fonts} />;
}
createRoot(document.getElementById("root")!).render(params.has("lab") ? <ProfessionalLab /> : fixture());
