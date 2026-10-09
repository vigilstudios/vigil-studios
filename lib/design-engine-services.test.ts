import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { serviceContexts, serviceFixture } from "@/design-engine/preview/collection-006/fixtures";
import { serviceStudies, serviceProposal } from "@/design-engine/preview/collection-006/studies";
import { serviceStudySchemas } from "@/design-engine/preview/collection-006/contracts";
import { ServiceStudyPreview } from "@/design-engine/preview/collection-006/Study";
import { designComponents } from "@/design-engine/registry/components";
import { compositionFixtures } from "@/design-engine/preview/composition/fixtures";
import { collection004Review, collection005Review } from "@/design-engine/registry/creative-review";

describe("Collection 006 services and capabilities review",()=>{
 it("renders all 36 adaptations with valid content, semantic headings and visible resting content",()=>{
  expect(serviceStudies).toHaveLength(12);
  for(const s of serviceStudies)for(const [i,b]of serviceContexts.entries()){
   const fixture=serviceFixture(s.id,b);
   expect(serviceStudySchemas[s.id].safeParse(fixture.content).success).toBe(true);
   const html=renderToStaticMarkup(createElement(ServiceStudyPreview,{study:s,context:b,adaptation:i}));
   expect(html.match(/<h2\b/g)).toHaveLength(1);
   expect(html).toContain(b.brand.replace(/&/g,"&amp;"));
   expect(html).not.toMatch(/<h1\b|NaN|undefined|autoplay|opacity:0/);
  }
 });
 it("rejects missing media, excess entries, duplicate IDs and unrelated commerce fields",()=>{
  const desk=serviceFixture("C03",serviceContexts[0]);if(desk.kind!=="C03")throw Error("fixture");
  expect(serviceStudySchemas.C03.safeParse({...desk.content,capabilities:desk.content.capabilities.map(c=>({...c,image:undefined}))}).success).toBe(false);
  expect(serviceStudySchemas.C03.safeParse({...desk.content,capabilities:Array(9).fill(desk.content.capabilities[0])}).success).toBe(false);
  expect(serviceStudySchemas.C03.safeParse({...desk.content,capabilities:Array(4).fill(desk.content.capabilities[0])}).success).toBe(false);
  expect(serviceStudySchemas.C03.safeParse({...desk.content,price:99}).success).toBe(false);
  expect(serviceStudySchemas.C03.safeParse({...desk.content,title:"x".repeat(101)}).success).toBe(false);
 });
 it("rejects matrix and scope comparisons with missing relationship values",()=>{
  const matrix=serviceFixture("C07",serviceContexts[1]);if(matrix.kind!=="C07")throw Error("fixture");
  matrix.content.groups[0].capabilities[0].coverage=["Lead","Support","—"];
  expect(serviceStudySchemas.C07.safeParse(matrix.content).success).toBe(false);
  const scope=serviceFixture("C12",serviceContexts[0]);if(scope.kind!=="C12")throw Error("fixture");
  scope.content.criteria.push("New criterion");
  expect(serviceStudySchemas.C12.safeParse(scope.content).success).toBe(false);
 });
 it("keeps studies separate from their production inventory and preserves earlier human decisions",()=>{
  expect(designComponents).toHaveLength(126);
  expect(designComponents.filter(c=>c.status==="production")).toHaveLength(91);
  expect(designComponents.filter(c=>"sourceConcept" in c && serviceStudies.some(s=>s.id===c.sourceConcept))).toHaveLength(12);
  expect(collection004Review.S05.status).toBe("Rejected");
  expect(collection004Review.S04.status).toBe("Promising / Revision Required");
  expect(collection005Review.M03.status).toBe("Revision required");
  expect(new Set(serviceStudies.map(s=>s.typography[0])).size).toBe(10);
  for(let i=1;i<serviceStudies.length;i++)expect(serviceStudies[i].typography[0]).not.toBe(serviceStudies[i-1].typography[0]);
  for(const s of serviceStudies){expect(serviceProposal(s).motion).toEqual(["none"]);expect(serviceProposal(s).usage).toBe(s.usage);}
 });
 it("keeps composition IDs stable while exposing distinct readable titles",()=>{
  expect(compositionFixtures).toHaveLength(147);
  expect(new Set(compositionFixtures.map(f=>f.label)).size).toBe(147);
  expect(compositionFixtures[0].id).toBe("composition-a");
  expect(compositionFixtures.every(f=>!/^004|^[A-E] ·/.test(f.label))).toBe(true);
 });
});
