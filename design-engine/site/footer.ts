import { parseSection, type SectionInstance } from "../composition/schemas";
import type { SiteDefinition } from "./model";
import { deriveNavigation, type SiteDestination } from "./navigation";
/** Footer groups are a projection of page identity/order/visibility, never a second sitemap. */
export function footerGroups(site:SiteDefinition,section:SectionInstance) {
  if(!section.component.startsWith("footer.")||!("navigationDepth" in section))throw new Error("A Footer is required.");
  const depthMode=section.navigationDepth;
  const tree=deriveNavigation(site,{...section.navigationSource,mode:"site",depth:section.navigationDepth==="top-level"?"top-level":"all"});
  const record=(page:SiteDestination)=>({id:page.pageId,title:page.label,destination:page.action});
  if(section.component==="footer.compact")return [{id:"site-pages",title:section.content.navigationLabel,links:tree.map(record)}];
  function flatten(items:SiteDestination[],depth:number):ReturnType<typeof record>[] {
    return items.flatMap(page=>[record(page),...(page.children&&(depthMode==="all"||depth<2)?flatten(page.children,depth+1):[])]);
  }
  return tree.map(page=>({id:page.pageId,title:page.label,links:[record(page),...(page.children&&section.navigationDepth!=="top-level"?flatten(page.children,2):[])]}));
}
export function footerNavigationIssues(site:SiteDefinition,section:SectionInstance):string[] {
  const groups=footerGroups(site,section),issues:string[]=[];
  if(groups.length>6)issues.push("This Footer supports at most six sitemap groups. Select pages or use the compact Footer for up to twelve top-level pages.");
  if(groups.some(group=>group.links.length>12))issues.push("Footer groups support at most twelve destinations. Choose a smaller page selection or shallower sitemap.");
  if(section.navigationSource?.pageIds?.some(id=>!site.pages.some(page=>page.id===id)))issues.push("Footer selection references a missing page.");
  const ids=groups.flatMap(group=>group.links.map(link=>link.id));
  if(new Set(ids).size!==ids.length)issues.push("Footer page selection contains overlapping or duplicate page identities.");
  if(groups.some(group=>group.title.length>100||group.links.some(link=>link.title.length>120)))issues.push("Footer labels exceed supported bounds. Set a shorter page navigation label.");
  return issues;
}
export function materializeFooter(site:SiteDefinition,section:SectionInstance):SectionInstance {
  const issues=footerNavigationIssues(site,section);if(issues.length)throw new Error(issues.join(" "));
  return parseSection({...section,content:{...section.content,groups:footerGroups(site,section)}});
}
