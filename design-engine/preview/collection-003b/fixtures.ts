import type { HeroContext, ProductionHeroContext, NavigationStudy } from "./contracts";
import { makeSection } from "../composition/fixtures";
import type { SectionInstance } from "../../composition/schemas";
export type Destination = { label: string; children?: readonly string[] };
import {navigationContexts} from "../client-navigation-contexts";
export {navigationContexts} from "../client-navigation-contexts";
export type NavigationContext = typeof navigationContexts[number];
export type BrandTreatment = "wordmark" | "symbol" | "combined" | "image" | "text";
export function destinationsFor(s:NavigationStudy,c:NavigationContext,long=false):Destination[] {
 return c.links.slice(0,s.destinations[1]).map((link,i)=>({label:long && i===0 ? `${link.label} & long-term collaborations` : link.label, children:s.nested && "children" in link ? link.children : undefined}));
}
export function heroFixture(hero: ProductionHeroContext, c: NavigationContext, id: string): SectionInstance {
 const section = makeSection(hero, id);
 if(c.id!=="architecture" && "media" in section){
  const image={src:c.id==="streetwear"?"/design-engine-study-007/fashion-campaign.webp":"/design-engine-study-003b/security-before.svg",alt:c.id==="streetwear"?"Generated streetwear campaign study":"Illustrative network topology; no measured security data",width:c.id==="streetwear"?1536:1600,height:c.id==="streetwear"?1024:900,focal:{x:50,y:45},mobileFocal:{x:50,y:45}};
  if(section.component==="hero.comparison")section.media={before:image,after:{...image,width:c.id==="streetwear"?1024:1600,height:c.id==="streetwear"?1536:900,src:c.id==="streetwear"?"/design-engine-study-007/fashion-look.webp":"/design-engine-study-003b/security-after.svg"}};
  else if(section.component==="hero.front-page"||section.component==="hero.vertical-record"||section.component==="hero.between-acts"||section.component==="hero.object-study")section.media={image};
 }
 if(section.component==="hero.vertical-record"){
  if(c.id==="architecture")section.media={image:makeSection("hero.comparison",id).media.before};
  const labels=c.id==="architecture"?["Observe the place","Develop the proposal","Care for the result"]:c.id==="streetwear"?["Shape the silhouette","Study the construction","Wear it your way"]:["Map the systems","Review the signals","Plan the response"];
  section.content={...section.content,category:c.kind,reference:"Illustrative study / 2026",recordLabel:"A working sequence",records:labels.map((label,i)=>({id:`step-${i+1}`,dateLabel:`Step 0${i+1}`,label}))};
 }
 if(section.component==="hero.open-circuit"){
  const unit=c.id==="security"?"signals":c.id==="streetwear"?"pieces":"studies";
  section.content={...section.content,readout:`18 ${unit}`};
  section.media={signal:{...section.media.signal,unit,label:`Illustrative ${unit} across a working sequence`,source:"Fictional navigation review fixture; not measured client data",samples:section.media.signal.samples.map((sample,i)=>({...sample,label:`Phase ${i+1}`}))}};
 }
 if(section.component==="hero.between-acts")section.content={...section.content,closingPhrase:c.id==="streetwear"?"Your own rhythm.":c.id==="security"?"A clearer perspective.":"A place to belong.",sideNote:"Illustrative brand study / 003B"};
 if(section.component==="hero.object-study")section.content={...section.content,category:c.kind,reference:"Illustrative brand study / 003B",materialNote:c.note,objectNumber:"01"};
 // Keep production mechanisms/media contracts; comparisons are separate views, not measured before/after claims.
 return {...section, content:{...section.content,title:c.title,description:c.note,eyebrow:c.kind,action:{label:c.cta,href:`#${id}-destinations`},...(hero === "hero.comparison" && c.id!=="architecture" ? {beforeLabel:"View A",afterLabel:"View B"} : {}),...(hero === "hero.front-page" ? {masthead:c.brand,edition:"Field edition / 2026",topic:c.kind,abstract:c.note} : {})}} as SectionInstance;
}

export const adaptationHeroes: readonly HeroContext[] = ["hero.front-page","hero.vertical-record","hero.open-circuit"];
