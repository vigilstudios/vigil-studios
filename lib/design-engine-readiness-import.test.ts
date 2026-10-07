import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { endingSectionIds } from "@/design-engine/composition/ending-schemas";
import { endingSections } from "@/design-engine/registry/ending-sections";
import { makeEndingSection, inquiryPreset } from "@/design-engine/preview/ending-fixtures";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import { parseSection } from "@/design-engine/composition/schemas";
import { inspectComposition } from "@/design-engine/composition/validation";
import { designComponents } from "@/design-engine/registry/components";
import { validateDesignRegistry } from "@/design-engine/registry/validation";
import { resolvePageComposition, navigationIssues } from "@/design-engine/site/navigation";
import { serializeSite, deserializeSite, parseSiteDefinition } from "@/design-engine/site/persistence";
import { footerGroups } from "@/design-engine/site/footer";
import { effectiveSections } from "@/design-engine/site/model";
import { actionIssues, resolveAction } from "@/design-engine/site/actions";
import { updatePage, duplicatePage, deletionImpact } from "@/design-engine/site/operations";
import { renderSection } from "@/design-engine/composition/render";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { ActionSiteProvider } from "@/design-engine/actions/ActionContext";
import { SitePagePreview } from "@/design-engine/site/render";
function markup(section:ReturnType<typeof parseSection>) {
  return renderToStaticMarkup(createElement(ActionSiteProvider,{site:makeComplexSiteFixture()},createElement(DesignThemeProvider,{theme:"neutral"},renderSection(section))));
}
describe("Readiness import production contracts",()=>{
  it("keeps the registry valid and all previews renderable under every declared structure",()=>{
    expect(validateDesignRegistry(designComponents)).toEqual([]);
    for(const entry of endingSections)for(const variant of entry.previewVariants){
      const section=makeEndingSection(entry.id,"readiness",variant.config);
      expect(inspectComposition({id:"page",label:"Readiness",site:makeComplexSiteFixture().settings,sections:[section]}).issues).toEqual([]);
      expect(markup(section)).toContain('id="readiness"');
    }
  });
  it("rejects unsupported option, unsafe destination and duplicate record identities",()=>{
    const footer=makeEndingSection("footer.sitemap","footer");
    expect(()=>parseSection({...footer,structure:"giant-mega-footer"})).toThrow();
    expect(()=>parseSection({...footer,content:{...footer.content,socials:[{id:"bad",title:"Unsafe",destination:{type:"external",url:"javascript:alert(1)"}}]}})).toThrow();
    expect(()=>parseSection({...footer,content:{...footer.content,groups:[...footer.content.groups,footer.content.groups[0]]}})).toThrow();
    const gallery=makeEndingSection("work.expand-rail","gallery");
    expect(()=>parseSection({...gallery,content:{...gallery.content,works:[gallery.content.works[0],gallery.content.works[0]]}})).toThrow();
  });
  it("persists forms, social destinations, presentation and nested page/section actions",()=>{
    const site=makeComplexSiteFixture(),section=makeEndingSection("contact.inquiry","inquiry");
    site.pages.find(page=>page.id==="page-contact")!.sections=[parseSection({...section,contextualActions:{primary:{enabled:true,label:"Selected work",action:{type:"page",pageId:"page-project-alpha"},presentation:{variant:"outline",size:"large",width:"full",alignment:"right",icon:"arrow-up-right",iconPosition:"leading"}},secondary:{enabled:true,label:"Project details",action:{type:"section",pageId:"page-home",sectionId:site.pages[0].sections[0].id}}}})];
    const restored=deserializeSite(serializeSite(site));
    expect(restored).toEqual(site);expect(actionIssues(restored)).toEqual([]);
  });
  it("derives sitemap identity/order/visibility and depth from the real site",()=>{
    const site=makeComplexSiteFixture(),footer=parseSection({...makeEndingSection("footer.sitemap","footer"),navigationDepth:"all",navigationSource:{mode:"site",depth:"all",pageIds:["page-shop"]}});
    expect(navigationIssues(site,footer)).toEqual([]);
    const groups=footerGroups(site,footer);expect(groups[0].links.map(link=>link.id)).toContain("page-product-alpha");
    const hidden=updatePage(site,"page-product-alpha",{showInNavigation:false});
    expect(footerGroups(hidden,footer)[0].links.map(link=>link.id)).not.toContain("page-product-alpha");
    const compact=parseSection({...makeEndingSection("footer.compact","footer"),navigationSource:{mode:"site",depth:"all",pageIds:["page-shop"]}});
    expect(footerGroups(site,compact)[0].links.map(link=>link.id)).toEqual(["page-shop"]);
  });
  it("survives nested rename, slug change and reparent without replacing action identities",()=>{
    let site=makeComplexSiteFixture();
    const footer=parseSection({...makeEndingSection("footer.sitemap","global-footer"),navigationDepth:"all",navigationSource:{mode:"site",depth:"all",pageIds:["page-shop"]}});
    site.globals.footer=footer;
    site=updatePage(site,"page-product-alpha",{title:"Renamed product",navLabel:"New label",slug:"new-product"});
    site=updatePage(site,"page-apparel",{parentId:null});
    const link=footerGroups(site,parseSection({...footer,navigationSource:{mode:"site",depth:"all",pageIds:["page-apparel"]}}))[0].links.find(link=>link.id==="page-product-alpha")!;
    expect(link.destination).toEqual({type:"page",pageId:"page-product-alpha"});
    expect(resolveAction(site,link.destination).href).toBe("/apparel/new-product");
    expect(link.title).toBe("New label");
  });
  it("shares a global footer across pages with omit and replacement support, outside main",()=>{
    const site=makeComplexSiteFixture();site.globals.footer=makeEndingSection("footer.banner","global-footer");
    site.pages.find(page=>page.id==="page-about")!.slots.footer={mode:"omit"};
    site.pages.find(page=>page.id==="page-contact")!.slots.footer={mode:"replace",section:makeEndingSection("footer.compact","contact-footer")};
    const restored=parseSiteDefinition(site);
    expect(effectiveSections(restored,restored.pages[0]).at(-1)?.id).toBe("global-footer");
    expect(effectiveSections(restored,restored.pages.find(page=>page.id==="page-about")!).some(section=>section.component.startsWith("footer."))).toBe(false);
    expect(resolvePageComposition(restored,"page-contact").sections.at(-1)?.id).toBe("contact-footer");
    const html=renderToStaticMarkup(createElement(SitePagePreview,{site:restored,pageId:"page-contact",embedded:false}));
    expect(html.indexOf("</main>")).toBeLessThan(html.indexOf("<footer"));
  });
  it("reports broken direct contact/footer actions and counts incoming deletion references",()=>{
    const site=makeComplexSiteFixture(),section=makeEndingSection("contact.inquiry","inquiry");
    site.pages[0].sections.push(parseSection({...section,content:{...section.content,details:[{id:"project",title:"Project",destination:{type:"page",pageId:"page-product-alpha"}}]}}));
    expect(deletionImpact(site,"page-product-alpha","reparent").incoming).toContain(`${site.pages[0].title} / inquiry`);
    site.pages=site.pages.filter(page=>page.id!=="page-product-alpha");
    expect(actionIssues(site).some(issue=>issue.message.includes("page-product-alpha"))).toBe(true);
  });
  it("remaps self-directed content actions when a page is duplicated",()=>{
    const site=makeComplexSiteFixture(),section=makeEndingSection("contact.inquiry","inquiry");
    site.pages.find(page=>page.id==="page-contact")!.sections=[parseSection({...section,content:{...section.content,details:[{id:"self",title:"Inquiry",destination:{type:"section",pageId:"page-contact",sectionId:"inquiry"}}]}})];
    const copy=duplicatePage(site,"page-contact"),page=copy.site.pages.find(page=>page.id===copy.pageId)!;
    const cloned=page.sections[0];if(cloned.component!=="contact.inquiry")throw new Error("Contact required");
    expect(cloned.content.details[0].destination).toEqual({type:"section",pageId:copy.pageId,sectionId:cloned.id});
  });
  it("shows an honest unconnected form state, labels required fields and has no fake success",()=>{
    const html=markup(makeEndingSection("contact.inquiry","inquiry"));
    expect(html).toContain("Online inquiries are not connected yet");expect(html).toContain("disabled");
    expect(html).toContain("for=");expect(html).toContain('type="email"');expect(html).toContain('autoComplete="email"');
    expect(html).not.toContain("Your inquiry was received");
    for(const preset of ["general","collaboration","booking","newsletter"] as const){
      const base=makeEndingSection("contact.inquiry","inquiry");
      expect(()=>parseSection({...base,content:{...base.content,form:inquiryPreset(preset)}})).not.toThrow();
    }
  });
  it("allows both, either or neither CTA without leftover links or fake buttons",()=>{
    for(const primary of [true,false])for(const secondary of [true,false]){
      const section=parseSection({...makeEndingSection("cta.editorial","conversion"),contextualActions:{primary:primary?{enabled:true,label:"Email me",action:{type:"email",email:"hello@example.com"}}:{enabled:false},secondary:secondary?{enabled:true,label:"Call",action:{type:"phone",phone:"+1 555 123 4567"}}:{enabled:false}}});
      const html=markup(section);expect(html.includes("mailto:")).toBe(primary);expect(html.includes("tel:")).toBe(secondary);
    }
  });
  it("rejects footer source on ordinary content and allows it only on navigation/footer",()=>{
    expect(()=>parseSection({...makeEndingSection("cta.editorial","conversion"),navigationSource:{mode:"site",depth:"all"}})).toThrow();
    expect(()=>parseSection({...makeEndingSection("footer.sitemap","footer"),navigationSource:{mode:"site",depth:"all"}})).not.toThrow();
    expect(endingSectionIds).toHaveLength(13);
  });
});
