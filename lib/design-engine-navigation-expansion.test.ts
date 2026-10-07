import { describe, it, expect } from "vitest";
import { navigationStudies } from "../design-engine/preview/collection-003b/studies";
import { configurationIssues, defaultConfig, heroOptions, navigationControls, updateNavigationConfig } from "../design-engine/preview/collection-003b/contracts";
import { destinationsFor, navigationContexts } from "../design-engine/preview/collection-003b/fixtures";
import { designComponents } from "../design-engine/registry/components";
import { collection003BReview } from "../design-engine/registry/creative-review";

describe("Collection 003B approved behavior contract",()=>{
 it("retains the original navigations beside twelve approved production systems",()=>{
  expect(designComponents.filter(c=>c.category==="navigation")).toHaveLength(15);
  for(const id of ["navigation.contents","navigation.island","navigation.primary"])expect(designComponents.some(c=>c.id===id)).toBe(true);
  expect(navigationStudies).toHaveLength(12);
  expect(new Set(navigationStudies.map(s=>s.id)).size).toBe(12);
  expect(Object.values(collection003BReview).every(r=>r.status==="Approved")).toBe(true);
 });
 it.each(navigationStudies)("$id supports common scroll modes and all available Hero contexts",s=>{
  expect(s.status).toBe("experimental");expect(s.review).toBe("approved");
  for(const scroll of ["sticky","reveal","solidify"] as const){
   expect(s.scroll).toContain(scroll);
   const config=updateNavigationConfig(defaultConfig(s),{scroll});
   for(const hero of heroOptions)expect(configurationIssues(s,config,hero)).toEqual([]);
  }
  for(const context of navigationContexts){const links=destinationsFor(s,context);expect(links.length).toBeGreaterThanOrEqual(s.destinations[0]);expect(links.length).toBeLessThanOrEqual(s.destinations[1]);if(!s.nested)expect(links.every(l=>!l.children)).toBe(true);}
  for(const options of Object.values(navigationControls(s)))expect(options?.length).toBeGreaterThan(0);
 });
 it("keeps NX04 floating under every scroll policy and exposes four meaningful treatments",()=>{
  const s=navigationStudies[3];expect(s.positions).toEqual(["floating"]);expect(s.floating?.dockStyle).toEqual(["capsule","frame","glass","segmented"]);
  for(const scroll of s.scroll)expect(updateNavigationConfig(defaultConfig(s),{scroll}).position).toBe("floating");
  expect(s.scroll).toEqual(expect.arrayContaining(["static","sticky","reveal","solidify","compact"]));
 });
 it("makes Hero-centric headers overlay, while preserving independent structural invariants",()=>{
  const s=navigationStudies[0],c=updateNavigationConfig(defaultConfig(s),{scroll:"solidify"});
  expect(c.position).toBe("overlay");expect(c.background).toBe("solid");
  expect(updateNavigationConfig(c,{position:"flow"}).scroll).toBe("sticky");
  expect(navigationStudies[1].supportedAlignments).toEqual({brand:["center"],primary:["split"],actions:["left","right"]});
  expect(navigationStudies[8].positions).toEqual(["edge"]);
 });
 it("rejects nonexistent floating styles and invalid brand alignment",()=>{
  const s=navigationStudies[3];expect(configurationIssues(s,{...defaultConfig(s),dockStyle:"orb" as "capsule"},"hero.statement")).toContain("Unsupported dockStyle.");
  const centered=navigationStudies[1];expect(configurationIssues(centered,{...defaultConfig(centered),brand:"left"},"hero.statement")).toContain("Unsupported brand.");
 });
});
