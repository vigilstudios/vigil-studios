import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { presentationSchema, resolvePresentation, entranceEffects } from "../design-engine/presentation/schema";
import { motionFrame } from "../design-engine/presentation/PresentationSurface";
import { deserializeSite, serializeSite } from "../design-engine/site/persistence";
import { pageComposition } from "../design-engine/site/model";
import { applyPageComposition } from "../design-engine/site/operations";
import { parseSection } from "../design-engine/composition/schemas";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { MovingChorus } from "../design-engine/sections/proof/MovingChorus";
import muse from "../docs/design-engine/creator-express-editor/muse-bennett.site.json";

describe("Editor presentation and saved draft compatibility", () => {
 it("retains page and section settings through export, import and page edits", () => {
  const site=deserializeSite(JSON.stringify(muse));
  expect(deserializeSite(serializeSite(site))).toEqual(site);
  const composition=pageComposition(site,site.navigation.homePageId);
  const updated=applyPageComposition(site,site.navigation.homePageId,{...composition,label:"Updated"});
  expect(updated.pages[0].presentation).toEqual(site.pages[0].presentation);
  expect(composition.sections[1].presentation?.headingMode).toBe("original");
 });
 it("uses parent typography until a section explicitly overrides it", () => {
  const site={heading:{titleSize:70,descriptionSize:18},buttons:{shape:"square" as const}};
  const page={heading:{titleSize:60}};
  expect(resolvePresentation(site,page,{heading:{titleSize:30}}).heading).toEqual({titleSize:60,descriptionSize:18});
  expect(resolvePresentation(site,page,{headingMode:"override",heading:{titleSize:30}}).heading?.titleSize).toBe(30);
  expect(resolvePresentation(site,page,{headingMode:"original"}).heading).toBeUndefined();
  expect(resolvePresentation(site,page,{buttons:{hover:"lift"}}).buttons).toEqual({shape:"square",hover:"lift"});
 });
 it("allows section motion overrides and explicit disabling without discarding parent settings", () => {
  const parent={motion:{entrance:"blur" as const,mediaHover:"zoom" as const,duration:800}};
  expect(resolvePresentation(parent,undefined,{motion:{entrance:"clip"}}).motion?.entrance).toBe("blur");
  expect(resolvePresentation(parent,undefined,{motionMode:"override",motion:{entrance:"clip"}}).motion?.entrance).toBe("clip");
  expect(resolvePresentation(parent,undefined,{motionMode:"none"}).motion).toMatchObject({entrance:"none",exit:"none",mediaHover:"none",duration:800});
 });
 it.each(entranceEffects)("provides bounded keyframes for %s",effect=>{
  expect(motionFrame(effect,{distance:40,blur:8,scale:.9}).opacity).toBe(effect==="none"?1:0);
  expect(JSON.stringify(motionFrame(effect))).not.toMatch(/NaN|undefined/);
 });
 it("rejects unsafe dimensions and malformed settings",()=>{
  expect(presentationSchema.safeParse({viewport:{minimum:10000}}).success).toBe(false);
  expect(presentationSchema.safeParse({motion:{duration:-1}}).success).toBe(false);
  expect(presentationSchema.safeParse({heading:{css:"arbitrary"}}).success).toBe(false);
 });
 it("requires unique testimonial card pieces and a quote",()=>{
  const section=makeSection("proof.moving-chorus","voices");
  expect(()=>parseSection({...section,cardSettings:{order:["name"]}})).toThrow();
  expect(()=>parseSection({...section,cardSettings:{order:["quote","quote"]}})).toThrow();
  expect(parseSection({...section,cardSettings:{order:["name","quote"],design:"transparent"}}).component).toBe(section.component);
 });
 it("preserves optional equal-height testimonial cards through a saved-site round trip",()=>{
  const site=deserializeSite(JSON.stringify(muse));
  const page=site.pages[0];
  const index=page.sections.findIndex(section=>section.component==="proof.moving-chorus");
  const original=page.sections[index];
  expect(original.component).toBe("proof.moving-chorus");
  for(const equalHeight of [true,false]) {
   page.sections[index]=parseSection({...original,cardSettings:{equalHeight,minHeight:280}});
   const restored=deserializeSite(serializeSite(site)).pages[0].sections[index];
   expect(restored.component==="proof.moving-chorus" && restored.cardSettings).toEqual({equalHeight,minHeight:280});
  }
  expect(()=>parseSection({...original,cardSettings:{equalHeight:"yes"}})).toThrow();
 });
 it("removes the pause button, forced eyebrow and read-all disclosure while retaining accessible quotes",()=>{
  const section=makeSection("proof.moving-chorus","voices");
  if(section.component!=="proof.moving-chorus")throw Error("Wrong fixture");
  const html=renderToStaticMarkup(createElement(MovingChorus,section));
  expect(html).not.toMatch(/Pause motion|Read all voices|Demo evidence/);
  expect(html).toContain('aria-label="Testimonials"');
  expect(html).toContain(section.content.voices[0].quote);
 });
});
