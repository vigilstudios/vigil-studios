/** Disposable loopback QA: real production renderer and labs; no public route or authentication bypass. */
import { createRoot } from "react-dom/client";
import { ProfessionalLab } from "../design-engine/preview/editor/ProfessionalLab";
import { makeEndingSection, inquiryPreset } from "../design-engine/preview/ending-fixtures";
import type { EndingSectionId } from "../design-engine/composition/ending-schemas";
import { parseSection, type SectionInstance } from "../design-engine/composition/schemas";
import { CompositionPreview } from "../design-engine/composition/render";
import { ActionSiteProvider } from "../design-engine/actions/ActionContext";
import { FormSubmissionProvider, type FormAdapter } from "../design-engine/forms/InquiryForm";
import { makeComplexSiteFixture } from "../design-engine/preview/composition/site-fixture";
import { materializeNavigation } from "../design-engine/site/navigation";
import { SitePagePreview } from "../design-engine/site/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import "../design-engine/styles.css";
import "../design-engine/composition/styles.css";
import "../design-engine/preview/editor/editor.css";
import "../design-engine/preview/composition/lab.css";
import "../design-engine/preview/calibration/calibration.css";
const params=new URLSearchParams(location.search),component=(params.get("component")??"cta.editorial") as EndingSectionId;
let section:SectionInstance=makeEndingSection(component,"readiness",Object.fromEntries(params));
const site=makeComplexSiteFixture();
site.settings={...site.settings,typography:(params.get("type")??"neo-grotesk") as "neo-grotesk",artDirection:(params.get("art")??"publication") as "publication",motion:(params.get("intensity")??"restrained") as "restrained"};
if(params.has("actions"))section=parseSection({...section,contextualActions:{primary:{enabled:true,label:params.has("longActions")?"Discuss the full scope of a thoughtful creative collaboration with our studio team":"Start a project",action:{type:"page",pageId:"page-contact"},presentation:{variant:component==="footer.compact"?"underline":"primary",size:component==="footer.compact"?"small":"large",icon:"arrow-up-right",width:params.has("fullActions")?"full":"auto"}},...(!component.startsWith("footer.")?{secondary:{enabled:true,label:"View selected work",action:{type:"section",pageId:"page-work",sectionId:"section-work-1"},presentation:{variant:"outline",size:"medium"}}}:{})}});
if(params.has("maximum")&&"works" in section.content){
 const works=section.content.works;
 section=parseSection({...section,content:{...section.content,works:Array.from({length:16},(_,i)=>({...works[i%works.length],id:`work-${i}`,title:`Selected image ${i+1} — a detailed record with a long project title`,note:"A detailed description of the project, its process and the people who made it possible."}))}});
}
if(section.component==="contact.inquiry"&&params.has("form"))section=parseSection({...section,content:{...section.content,form:{...inquiryPreset(params.get("preset")==="booking"?"booking":"general"),submission:params.get("form")==="email"?{mode:"email-draft",destination:{type:"email",email:"hello@example.com"}}:{mode:"host",integration:"qa"}}}});
if(params.has("siteTree")&&component.startsWith("footer."))section=materializeNavigation(site,parseSection({...section,navigationSource:{mode:"site",depth:"all",pageIds:["page-services","page-work","page-shop"]},navigationDepth:component==="footer.compact"?"top-level":"all"}));
const adapter:FormAdapter=async()=>{await new Promise(resolve=>setTimeout(resolve,150));return params.get("form")==="failure"?{ok:false,error:"Fixture server rejected this inquiry."}:{ok:true};};
if(params.has("site")){
 site.globals.navigation=undefined;site.globals.footer=makeEndingSection("footer.sitemap","global-footer");
 site.pages[0].sections=[makeSection("hero.statement","opening"),makeEndingSection("cta.editorial","conversion"),makeEndingSection("contact.inquiry","inquiry")];
}
function QA(){
 if(params.has("lab"))return <ProfessionalLab initialWorkspace={params.get("lab")==="composition"?"composition":"design"}/>;
 if(params.has("site")){
  return <SitePagePreview site={site} pageId="page-home" embedded={false}/>;
 }
 const view=<ActionSiteProvider site={site}><CompositionPreview composition={{id:"readiness-qa",label:"Readiness import",site:site.settings,sections:[section]}} embedded={false}/></ActionSiteProvider>;
 return params.has("form")&&params.get("form")!=="missing"?<FormSubmissionProvider adapter={adapter}>{view}</FormSubmissionProvider>:view;
}
createRoot(document.getElementById("root")!).render(<QA/>);
