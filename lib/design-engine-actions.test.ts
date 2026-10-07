import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { designComponents } from "@/design-engine/registry/components";
import { sectionContracts } from "@/design-engine/composition/catalog";
import { parseSection, type SectionId } from "@/design-engine/composition/schemas";
import { renderSection } from "@/design-engine/composition/render";
import { getActionCapabilities, actionItems } from "@/design-engine/actions/capabilities";
import { ActionSiteProvider } from "@/design-engine/actions/ActionContext";
import { makeActionSection, makeConnectedActionFixture } from "@/design-engine/preview/action-fixtures";
import { makeSection } from "@/design-engine/preview/composition/fixtures";
import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import { actionIssues, materializeActions } from "@/design-engine/site/actions";
import { deletePage, deletionImpact, duplicatePage, updatePage } from "@/design-engine/site/operations";
import { deserializeSite, serializeSite } from "@/design-engine/site/persistence";
import { sitePageChoices } from "@/design-engine/preview/composition/ContextualActionsEditor";
import { SitePagePreview } from "@/design-engine/site/render";
import { ContextualActionsEditor } from "@/design-engine/preview/composition/ContextualActionsEditor";
import { actionSchema } from "@/design-engine/site/action-schema";

const production = designComponents.filter(entry => entry.status === "production");
const markup = (section: ReturnType<typeof makeSection>, site = makeComplexSiteFixture()) => renderToStaticMarkup(createElement(ActionSiteProvider,{site},renderSection(section)));
describe("Production Library Action & CTA Integration", () => {
  it("audits all 89 Production components and every other runtime section with serializable registry capabilities", () => {
    expect(production).toHaveLength(89);
    for (const entry of production) {
      const capability = getActionCapabilities(entry.id);
      expect("composition" in entry ? entry.composition?.actions : undefined).toEqual(capability);
      expect(JSON.parse(JSON.stringify(capability))).toEqual(capability);
    }
    for (const id of Object.keys(sectionContracts)) expect(getActionCapabilities(id).reason).toBeTruthy();
  });
  it.each(Object.keys(sectionContracts) as SectionId[])("renders all declared section slots without requiring new configuration: %s", component => {
    const section = makeActionSection(component), capability = getActionCapabilities(component), html = markup(section);
    if (capability.primary && !component.startsWith("navigation.")) expect(html).toContain("Start a project with our team");
    if (capability.secondary) expect(html).toContain("Explore selected work");
    if (capability.items.length) expect(html).toContain("de-action");
    expect(markup(makeSection(component,"test-subject"))).toBeTruthy();
  });
  it.each(["hero.comparison","hero.full-scene","hero.scene-poster","hero.object-study","hero.vertical-record","hero.front-page","hero.open-circuit","hero.between-acts","hero.assembly","hero.statement"] as SectionId[])("supports neither, secondary only and both in %s", component => {
    const base = makeSection(component,"test-subject");
    const secondary = {enabled:true as const,label:"Only secondary",action:{type:"page" as const,pageId:"page-work"}};
    expect(markup(parseSection({...base,contextualActions:{primary:{enabled:false},secondary}}))).toContain("Only secondary");
    const neither = markup(parseSection({...base,contextualActions:{primary:{enabled:false},secondary:{enabled:false}}}));
    expect(neither).not.toContain('data-action-link="true"');
    expect(markup(makeActionSection(component))).toContain("Explore selected work");
  });
  it("keeps optional item configuration attached to entities through item reordering", () => {
    const section = makeActionSection("services.offering-index");
    if(section.component !== "services.offering-index") throw new Error("Unexpected fixture");
    const first = section.content.entries[0]; section.content.entries.reverse();
    const html = markup(section);
    expect(html).toContain(`Explore ${first.title}`);
    expect(section.contextualActions!.items!.find(item => item.itemId === first.id)!.slot).toMatchObject({action:{pageId:"page-web-design"}});
  });
  it("round-trips contextual destinations/presentation and follows slug and parent changes", () => {
    let site = deserializeSite(serializeSite(makeConnectedActionFixture()));
    site = updatePage(site,"page-contact",{slug:"book"});
    site = updatePage(site,"page-web-design",{parentId:"page-about"});
    const html = renderToStaticMarkup(createElement(SitePagePreview,{site,pageId:"page-home"}));
    expect(html).toContain('href="/book"'); expect(html).toContain('href="/about/web-design"');
    expect(actionIssues(site)).toEqual([]);
    expect(site.pages[0].sections[0].contextualActions!.primary).toMatchObject({action:{pageId:"page-contact"}});
  });
  it("resolves section targets and supplies download attributes in server markup", () => {
    const base=makeSection("hero.comparison","test-subject"), site=makeComplexSiteFixture();
    const section=parseSection({...base,contextualActions:{primary:{enabled:true,label:"Jump to services",action:{type:"section",pageId:"page-services",sectionId:"section-services-1"}},secondary:{enabled:true,label:"Download brief",action:{type:"download",url:"/brief.pdf",filename:"brief.pdf"}}}});
    const html=markup(section,site); expect(html).toContain('href="/services#section-services-1"'); expect(html).toContain('download="brief.pdf"');
  });
  it("reports deleted pages, sections and items; never silently uses an old href", () => {
    const site=makeConnectedActionFixture(); expect(deletionImpact(site,"page-contact","subtree").incoming.length).toBeGreaterThan(0);
    const deleted=deletePage(site,"page-contact","subtree"); expect(actionIssues(deleted).some(issue => issue.message.includes("page-contact"))).toBe(true);
    expect(() => renderToStaticMarkup(createElement(SitePagePreview,{site:deleted,pageId:"page-home"}))).toThrow("Missing page target");
    const section=makeActionSection("services.offering-index");
    if(section.component !== "services.offering-index") throw new Error("Unexpected fixture");
    section.content.entries[0].id="changed-record"; expect(() => materializeActions(site,section)).toThrow("Missing action item");
    const broken=parseSection({...makeSection("hero.comparison","test-subject"),contextualActions:{primary:{enabled:true,label:"Broken",action:{type:"section",pageId:"page-services",sectionId:"missing-section"}}}});
    expect(() => materializeActions(site,broken)).toThrow("Missing section target");
  });
  it("retargets contextual self-links during duplication without aliasing original data", () => {
    const site=makeConnectedActionFixture(); site.pages[0].sections[0].contextualActions={primary:{enabled:true,label:"Self",action:{type:"section",pageId:"page-home",sectionId:site.pages[0].sections[0].id}}};
    const result=duplicatePage(site,"page-home"), copy=result.site.pages.find(page=>page.id===result.pageId)!;
    expect(copy.sections[0].contextualActions!.primary).toMatchObject({action:{pageId:copy.id,sectionId:copy.sections[0].id}});
    expect(site.pages[0].sections[0].contextualActions!.primary).toMatchObject({action:{pageId:"page-home"}});
  });
  it("serializes inactive configuration and retargets it when duplicating without rendering it", () => {
    const site=makeConnectedActionFixture(), section=site.pages[0].sections[0];
    section.contextualActions!.primary={enabled:false,label:"Return to this page",action:{type:"page",pageId:"page-home"},presentation:{variant:"outline",icon:"mail"}};
    const restored=deserializeSite(serializeSite(site));
    expect(restored.pages[0].sections[0].contextualActions!.primary).toEqual(section.contextualActions!.primary);
    expect(markup(section)).not.toContain("Return to this page");
    const copy=duplicatePage(restored,"page-home");
    expect(copy.site.pages.find(page=>page.id===copy.pageId)!.sections[0].contextualActions!.primary).toMatchObject({enabled:false,action:{pageId:copy.pageId},presentation:{icon:"mail"}});
  });
  it("rejects fake/destructive controls and keeps intentional no-action components actionless", () => {
    expect(()=>parseSection({...makeSection("proof.moving-chorus","test-subject"),contextualActions:{primary:{enabled:true,label:"Fake",action:{type:"page",pageId:"page-home"}}}})).toThrow("does not support");
    expect(()=>makeActionSection("hero.comparison",{size:"display"})).toThrow("Unsupported action presentation");
    expect(()=>parseSection({...makeSection("hero.comparison","test-subject"),contextualActions:{primary:{enabled:false,presentation:{size:"display"}}}})).toThrow("Unsupported action presentation");
    expect(()=>makeActionSection("hero.full-scene",{alignment:"right"})).toThrow("Unsupported action presentation");
    const html=renderToStaticMarkup(createElement(ContextualActionsEditor,{site:makeComplexSiteFixture(),section:makeSection("proof.moving-chorus","test-subject"),onChange:()=>{}}));
    expect(html).not.toContain("CTA enabled");
  });
  it("renders media and whole-item links as single named anchors, separate from disclosure buttons", () => {
    const section=makeActionSection("work.gallery-hanging"), group=getActionCapabilities(section.component).items[0], record=actionItems(section,group)[0];
    section.contextualActions!.items![0].display="media";
    const html=markup(section); expect(html).toContain('class="de-action-media"'); expect(html).toContain(`aria-label="Explore ${record.label}"`);
    const slot=section.contextualActions!.items![0].slot;
    if(slot.enabled) slot.action={type:"download",url:"/project.pdf",filename:"project.pdf"};
    expect(markup(section)).toContain('data-action-link="true" class="de-action-media" href="/project.pdf" download="project.pdf"');
    section.contextualActions!.items![0].display="whole-item";
    expect(markup(section)).toContain("de-action-stretched");
  });
  it("presents ordered readable nested page choices using stable values", () => {
    const choices=sitePageChoices(makeComplexSiteFixture());
    expect(choices.find(choice=>choice.id==="page-web-design")!.label).toContain("↳ Web Design · /services/web-design");
    expect(choices.findIndex(choice=>choice.id==="page-services")).toBeLessThan(choices.findIndex(choice=>choice.id==="page-web-design"));
  });
  it("keeps media presentation and video controls outside button/whole-item interaction", () => {
    const section=makeActionSection("commerce.collection-atlas");
    if(section.component!=="commerce.collection-atlas") throw new Error("Unexpected fixture");
    const configured=section.contextualActions!.items![0];
    configured.display="media";
    expect(()=>parseSection(section)).toThrow("without button presentation");
    if(configured.slot.enabled) delete configured.slot.presentation;
    expect(parseSection(section)).toBeTruthy();
    section.content.collections[0].media={kind:"video",id:"collection-film",label:"Collection film",video:{src:"/film.mp4",width:1200,height:800,label:"Collection film",poster:{src:"/poster.jpg",alt:"Collection preview",width:1200,height:800},transcript:"Silent collection film",hasSpeech:false}};
    expect(()=>parseSection(section)).toThrow("Unsupported item action display");
  });
  it("preserves collection headings when their optional destination is disabled", () => {
    const section=makeActionSection("commerce.collection-atlas");
    if(section.component!=="commerce.collection-atlas") throw new Error("Unexpected fixture");
    section.contextualActions!.items![0].slot={enabled:false};
    expect(markup(parseSection(section))).toContain(section.content.collections[0].title);
  });
  it.each([{type:"external",url:"javascript:alert(1)"},{type:"email",email:"bad"},{type:"phone",phone:"abc"},{type:"download",url:"//evil.test/x"}])("validates external input %j", action=>expect(actionSchema.safeParse(action).success).toBe(false));
});
