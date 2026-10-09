import { createElement } from "react";
import { MotionPolicyProvider } from "../design-engine/motion/MotionPolicy";
import { describe,it,expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync,readdirSync } from "node:fs";
import { evidenceSectionIds } from "../design-engine/composition/evidence-contracts";
import { chorusOptions,chorusDefaults } from "../design-engine/composition/evidence-schemas";
import { makeEvidenceSection } from "../design-engine/preview/evidence-fixtures";
import { parseSection } from "../design-engine/composition/schemas";
import { renderSection } from "../design-engine/composition/render";
import type { DesignComponentDefinition } from "../design-engine/registry/types";
import { designComponents,getDesignComponent } from "../design-engine/registry/components";
import { collection008Review } from "../design-engine/registry/creative-review";
import { compositionFixtures } from "../design-engine/preview/composition/fixtures";
import { inspectComposition } from "../design-engine/composition/validation";
import { provenanceSchema,reviewSchema } from "../design-engine/evidence/types";
import { loopGeometry } from "../design-engine/motion/MeasuredLoop";
import { renderDesignPreview } from "../design-engine/preview/render";
const chorus=()=>makeEvidenceSection("proof.moving-chorus","voices");
describe("Pass 008 production evidence",()=>{
 it("productizes all twelve approved concepts independently with current-pass lifecycle evidence",()=>{
  const entries:readonly DesignComponentDefinition[]=designComponents.filter(c=>(evidenceSectionIds as readonly string[]).includes(c.id));expect(entries.map(c=>c.id)).toEqual([...evidenceSectionIds]);
  for(const [i,entry] of entries.entries()) {expect(collection008Review[`E${String(i+1).padStart(2,"0")}`].status).toBe("Approved");expect(entry.status).toBe("production");expect(entry.version).toBe(entry.id === "proof.moving-chorus" ? "1.1.0" : "1.0.0");expect(entry.productionEvidence).toBeDefined();expect(entry.composition?.evidence?.integrity).toContain("publication-source-required");}
 });
 it.each(evidenceSectionIds)("%s has narrow schemas, three honest contexts and canonical readable evidence",component=>{
  for(const context of ["security","strength","furniture"]) {
   const s=makeEvidenceSection(component,"evidence",context,"long");expect(()=>parseSection(s)).not.toThrow();
   const html=renderToStaticMarkup(renderSection(s));if(component!=="proof.moving-chorus")expect(html).toContain("fictional evidence");else expect(html).not.toContain("de-proof-disclosure");if(component!=="proof.moving-chorus")expect(html).toContain("Source");else if("voices" in s.content)expect(html).toContain(s.content.voices[0].quote);
   expect(()=>parseSection({...s,evidenceMode:"publication"})).toThrow(/illustrative/);
   expect(()=>parseSection({...s,unrelated:"fake-platform-total"})).toThrow();
  }
 });
 it("publication declarations require source context/permission and never infer verified purchase",()=>{
  const source={status:"client-supplied",source:"Interview recording",timeframe:"May 2026",context:"Experience of the named customer",attribution:"Named speaker",recordReference:"interview-1",permission:"publication-authorized"};
  expect(provenanceSchema.safeParse(source).success).toBe(true);
  for(const field of ["source","timeframe","context","attribution","recordReference","permission"]) expect(provenanceSchema.safeParse({...source,[field]:undefined}).success).toBe(false);
  const review={id:"review-one",quote:"A supplied observation",author:{name:"A customer"},rating:4,date:"2026-05-01",platform:"Supplied source",verifiedPurchase:true,provenance:source};
  expect(reviewSchema.safeParse(review).success).toBe(false);expect(reviewSchema.safeParse({...review,verifiedPurchase:false}).success).toBe(true);
  expect(reviewSchema.safeParse({...review,verifiedPurchase:false,date:"2026-02-30"}).success).toBe(false);
 });
 it("publishes supplied evidence without Lab labels and rejects unsupported capability combinations",()=>{
  const s=makeEvidenceSection("proof.margin-voice","evidence");s.content.testimony.provenance={status:"client-supplied",source:"Customer interview",timeframe:"2026",context:"Specific engagement",attribution:"Named customer",recordReference:"interview-one",permission:"publication-authorized"};
  s.evidenceMode="publication";expect(()=>parseSection(s)).not.toThrow();expect(renderToStaticMarkup(renderSection(s))).not.toContain("fictional evidence");
  expect(()=>parseSection({...chorus(),direction:"up"})).toThrow();expect(()=>parseSection({...chorus(),pauseOnFocus:"no"})).toThrow();
 });
 it("enforces distinct 3–24 voices, preserves long quotes, and declares the ideal range",()=>{
  const s=chorus(),voices=s.content.voices;
  expect(()=>parseSection({...s,content:{...s.content,voices:voices.slice(0,2)}})).toThrow();
  expect(()=>parseSection({...s,content:{...s.content,voices:[voices[0],voices[0],voices[1]]}})).toThrow();
  const large=Array.from({length:24},(_,i)=>({...voices[i%voices.length],id:`voice-${i}`,quote:"Long but bounded testimony ".repeat(30)}));
  expect(()=>parseSection({...s,content:{...s.content,voices:large}})).not.toThrow();
  expect(()=>parseSection({...s,content:{...s.content,voices:[...large,{...large[0],id:"extra"}]}})).toThrow();
  expect((getDesignComponent(s.component) as DesignComponentDefinition)?.composition?.evidence?.idealRange).toEqual({min:4,max:9});
 });
 it("preserves all effective E06 controls in both section and registry metadata",()=>{
  const entry=getDesignComponent("proof.moving-chorus")! as DesignComponentDefinition;
  for(const [name,options] of Object.entries(chorusOptions)) {
   expect(entry.configurations.find(c=>c.name===name)?.options).toEqual(options);
   expect(entry.composition?.configuration?.find(c=>c.name===name)?.options).toEqual(options);
   for(const option of options) expect(()=>renderToStaticMarkup(renderDesignPreview("proof.moving-chorus","default",{[name]:option}))).not.toThrow();
  }
  expect(()=>parseSection({...chorus(),...chorusDefaults})).not.toThrow();
 });
 it("section motion none produces resting evidence even inside an expressive site policy",()=>{
  for(const component of evidenceSectionIds) {
   const section={...makeEvidenceSection(component,"evidence"),motion:"none"};
   const html=renderToStaticMarkup(createElement(MotionPolicyProvider,{mode:"expressive"} as Parameters<typeof MotionPolicyProvider>[0],renderSection(parseSection(section))));
   expect(html).not.toContain("opacity:0");
  }
 });
 it("fills wide viewports with the fewest complete cycle copies and uses a distance-based duration",()=>{
  const small=loopGeometry(300,1920,"slow",false,"standard");expect((small.copies-1)*300).toBeGreaterThanOrEqual(1920);expect(small.duration).toBeCloseTo(300/18);
  expect(loopGeometry(3600,1440,"slow",false,"standard").copies).toBe(2);
  expect(loopGeometry(3600,390,"slow",true,"standard").duration).toBeGreaterThan(loopGeometry(3600,1440,"slow",false,"standard").duration);
 });
 it("adds two mixed QA contexts per approved system without recipes or production imports of studies",()=>{
  const pages=compositionFixtures.filter(c=>c.id.startsWith("evidence-"));expect(pages).toHaveLength(24);pages.forEach(p=>expect(inspectComposition(p).issues).toEqual([]));
  expect(pages.filter(p=>p.sections.some(s=>s.component==="proof.moving-chorus"))).toHaveLength(2);
  for(const file of readdirSync("design-engine/sections/proof")) if(file.endsWith("tsx")) expect(readFileSync(`design-engine/sections/proof/${file}`,"utf8")).not.toMatch(/preview\/|collection-008/);
 });
});
