import {describe,it,expect} from "vitest";
import {parseSection} from "../design-engine/composition/schemas";
import {makeSection} from "../design-engine/preview/composition/fixtures";
import {heroOptions} from "../design-engine/preview/collection-003b/contracts";
import {immersiveHeroIds} from "../design-engine/preview/hero-expansion/FullViewportHero";
import {designComponents} from "../design-engine/registry/components";

describe("Hero expansion boundaries",()=>{
 it("accepts old Comparison payloads and rejects unsupported context placement",()=>{
  const previous=makeSection("hero.comparison","opening");expect(()=>parseSection(previous)).not.toThrow();
  for(const contentAlignment of ["left","center","right"])expect(parseSection({...previous,contentAlignment})).toMatchObject({contentAlignment});
  expect(()=>parseSection({...previous,contentAlignment:"diagonal"})).toThrow();
 });
 it("preserves new Hero references and discovers their approved production systems",()=>{
  for(const hero of immersiveHeroIds){expect(heroOptions).toContain(hero);expect(designComponents.find(c=>String(c.id)===hero)?.status).toBe("production");}
 });
});
