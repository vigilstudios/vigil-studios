import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe,expect,it } from "vitest";
import { importSectionIds } from "@/design-engine/composition/import-schemas";
import { parseSection } from "@/design-engine/composition/schemas";
import { getSectionContract } from "@/design-engine/composition/catalog";
import { renderSection } from "@/design-engine/composition/render";
import { makeImportSection } from "@/design-engine/preview/import-fixtures";
import { makeCollectionSection } from "@/design-engine/preview/production-fixtures";
import { makeEvidenceSection } from "@/design-engine/preview/evidence-fixtures";
import { configurationVisible } from "@/design-engine/composition/configuration";
import { spherePoint } from "@/design-engine/sections/imports/sphere-geometry";
import { actionItems } from "@/design-engine/actions/capabilities";
import { getDesignComponent } from "@/design-engine/registry/components";

import { makeComplexSiteFixture } from "@/design-engine/preview/composition/site-fixture";
import { ActionSiteProvider } from "@/design-engine/actions/ActionContext";
import { updatePage } from "@/design-engine/site/operations";

describe("external production mechanisms",()=>{
 it.each(importSectionIds)("registers, serializes and renders %s with optional actions",id=>{
  const section=makeImportSection(id,"imported"),contract=getSectionContract(id);
  expect(parseSection(JSON.parse(JSON.stringify(section)))).toEqual(section);
  expect(getDesignComponent(id)?.status).toBe("production");
  expect(contract.actions?.classification).not.toBe("no-action");
  const group=contract.actions!.items[0],items=actionItems(section,group);
  expect(items.length).toBeGreaterThan(1);
  const linked=parseSection({...section,contextualActions:{primary:{enabled:true,label:"Explore the project",action:{type:"page",pageId:"nested-project"}},items:[{group:group.group,itemId:items[0].id,display:"link",slot:{enabled:true,label:"Read more",action:{type:"section",pageId:"nested-project",sectionId:"details"}}}]}});
  expect(()=>renderToStaticMarkup(createElement(()=>renderSection(linked)))).not.toThrow();
  expect(renderToStaticMarkup(createElement(()=>renderSection(section)))).toContain(section.content.title);
 });
 it.each(importSectionIds)("%s retains nested page/section destinations after route edits",id=>{
  const original=makeImportSection(id,"imported"),group=getSectionContract(id).actions!.items[0];
  const itemId=actionItems(original,group)[0].id;
  const section=parseSection({...original,contextualActions:{primary:{enabled:true,label:"Learn more",action:{type:"page",pageId:"page-web-design"}},items:[{group:group.group,itemId,display:"link",slot:{enabled:true,label:"View details",action:{type:"section",pageId:"page-services",sectionId:"section-services-1"}}}]}});
  let site=makeComplexSiteFixture();
  site=updatePage(site,"page-web-design",{slug:"design",parentId:"page-about"});
  site=updatePage(site,"page-services",{slug:"expertise"});
  const markup=renderToStaticMarkup(createElement(ActionSiteProvider,{site},renderSection(section)));
  expect(markup).toContain('href="/about/design"');
  expect(markup).toContain('href="/expertise#section-services-1"');
  expect(section.contextualActions!.primary).toMatchObject({action:{pageId:"page-web-design"}});
 });
 it("rejects duplicate identities, unknown controls and missing thumbnail budgets",()=>{
  const section=makeImportSection("work.image-sphere","sphere");
  expect(()=>parseSection({...section,content:{...section.content,images:[...section.content.images,section.content.images[0]]}})).toThrow();
  const images=Array.from({length:9},(_,i)=>({...section.content.images[i%section.content.images.length],id:`image-${i}`,thumbnail:undefined}));
  expect(()=>parseSection({...section,content:{...section.content,images}})).toThrow(/thumbnails/);
  expect(()=>parseSection({...section,hoverScale:99})).toThrow();
 });
 it("retains existing layouts when old gallery/chorus data omits the new controls",()=>{
  const gallery=makeCollectionSection("work.gallery-hanging","gallery");
  expect(gallery.component==="work.gallery-hanging"&&gallery.layout).toBe("hanging");
  const chorus=makeEvidenceSection("proof.moving-chorus","voices");
  const {layout:unused,columns:unused2,...old}=chorus;void unused;void unused2;
  const parsed=parseSection(old);
  expect(parsed.component==="proof.moving-chorus"&&parsed.layout).toBe("ribbon");
  expect(configurationVisible(chorus,"columns")).toBe(false);
 });
 it("keeps sphere distribution finite and on the unit sphere for every supported count",()=>{
  for(const count of [4,8,16,32])for(let i=0;i<count;i++){
   const point=spherePoint(i,count,.7,1.9);
   expect(Math.hypot(point.x,point.y,point.z)).toBeCloseTo(1,8);
   expect(Object.values(point).every(Number.isFinite)).toBe(true);
  }
 });
 it("does not allow whole-item links over sphere inspection controls",()=>{
  const sphere=makeImportSection("work.image-sphere","sphere");
  expect(()=>parseSection({...sphere,contextualActions:{items:[{group:"images",itemId:sphere.content.images[0].id,display:"whole-item",slot:{enabled:true,label:"Go",action:{type:"page",pageId:"work"}}}]}})).toThrow(/display/);
 });
});
