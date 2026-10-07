import { makeEndingSection } from "../ending-fixtures";
import { endingSectionIds, type EndingSectionId } from "../../composition/ending-schemas";
import { makeExpansionSection, expansionIds, type ExpansionId } from "../navigation-hero-fixtures";
import { navigationIds } from "../../navigation/schemas";
import { makeEvidenceSection } from "../evidence-fixtures";
import { evidenceSectionIds,evidenceDescriptors } from "../../composition/evidence-contracts";
import type { EvidenceSectionId } from "../../composition/evidence-schemas";
import { makeCommerceSection } from "../commerce-fixtures";
import { commerceSectionIds, commerceDescriptors } from "../../composition/commerce-contracts";
import type { CommerceSectionId } from "../../composition/commerce-schemas";
import { makeHeroFollowupSection, heroFollowupIds, type HeroFollowupId } from "../hero-followup-fixtures";
import { makeServiceSection } from "../service-fixtures";
import { serviceSectionIds, serviceDescriptors } from "../../composition/service-contracts";
import type { ServiceSectionId } from "../../composition/service-schemas";
import { getSectionContract } from "../../composition/catalog";
import { makeImportSection } from "../import-fixtures";
import { importSectionIds, type ImportSectionId } from "../../composition/import-schemas";
import { makeCollectionSection, productionCollectionIds } from "../production-fixtures";
import { makeStorySection } from "../collection-004/candidates";
import coast from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import night from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture-blue-hour.jpg";
import performer from "@/docs/design-engine/creative-calibration-002/assets/stage-performer.jpg";
import { parseSection, type PageComposition, type SectionId, type SectionInstance, type SiteConfiguration } from "../../composition/schemas";
import type { SectionImage } from "../../media/types";

const image = (asset: typeof coast, alt: string, width: number, height: number): SectionImage => ({ src: typeof asset === "string" ? asset : asset.src, alt, width, height, focal: { x: 50, y: 40 }, mobileFocal: { x: 42, y: 40 } });
const landscape = image(coast, "Limestone building beside a coastal horizon, generated review image", 1800, 1013);
const stage = image(performer, "Performer reaching into a beam of stage light, generated review image", 1800, 1013);
const after = image(night, "The same coastal building at blue hour, generated review image", 1800, 1013);
const action = { label: "Explore the approach", href: "#approach" };
const navContent = { brand: "Fieldwork", home: "#opening", links: [{ label: "Approach", href: "#approach" }, { label: "Contact", href: "mailto:hello@example.com" }], action: { label: "Start a conversation", href: "mailto:hello@example.com" } };
const intro = { title: "A landscape worth understanding.", description: "We turn careful observation into places with lasting purpose.", eyebrow: "A continuing practice", action };

/** Review assets and copy are imported here only, never by reusable implementations. */
export function makeSection<K extends SectionId>(component: K, id: string): SectionInstance<K> {
  if(endingSectionIds.includes(component as EndingSectionId)) return makeEndingSection(component as EndingSectionId,id) as unknown as SectionInstance<K>;
  if((importSectionIds as readonly string[]).includes(component)) return makeImportSection(component as ImportSectionId,id) as unknown as SectionInstance<K>;
  if((expansionIds as readonly string[]).includes(component)) return makeExpansionSection(component as ExpansionId,id) as SectionInstance<K>;
  if(commerceSectionIds.includes(component as CommerceSectionId)) return makeCommerceSection(component as CommerceSectionId,id) as unknown as SectionInstance<K>;
  if(heroFollowupIds.includes(component as HeroFollowupId)) return makeHeroFollowupSection(component as HeroFollowupId,id) as unknown as SectionInstance<K>;
  if(serviceSectionIds.includes(component as ServiceSectionId)) return makeServiceSection(component as ServiceSectionId,id) as SectionInstance<K>;
  if(evidenceSectionIds.includes(component as EvidenceSectionId)) return makeEvidenceSection(component as EvidenceSectionId,id) as unknown as SectionInstance<K>;
  const base = { id, component, motion: "none" };
  const fixtures: Partial<Record<SectionId, unknown>> = {
    "story.object-biography": makeStorySection("story.object-biography", id),
    "story.working-conversation": makeStorySection("story.working-conversation", id),
    "story.decision-ledger": makeStorySection("story.decision-ledger", id),
    "navigation.primary": { ...base, content: navContent, structure: "comfortable" },
    "navigation.island": { ...base, content: navContent, structure: "center", placement: "in-flow" },
    "navigation.contents": { ...base, content: { ...navContent, note: "A small practice working across culture, materials and public space.", edition: "Contents / 2026" }, structure: "numbered" },
    "hero.statement": { ...base, content: intro, structure: "start" },
    "hero.front-page": { ...base, content: { ...intro, masthead: "Fieldwork Journal", edition: "Volume 04 / September 2026", topic: "Landscape & practice", abstract: "Every project begins with an attentive reading of its place. Our field notes connect material decisions with the people who use them." }, media: { image: landscape }, treatment: { geometry: "editorial-crop", tone: "natural" }, structure: "spread" },
    "hero.open-circuit": { ...base, content: { ...intro, title: "Energy in clear view.", description: "Understand the output of one connected system, from first light to the end of the working day.", eyebrow: "System performance", readout: "18.4 kW" }, media: { signal: { label: "Output across an illustrative day", unit: "kW", source: "QA fixture; replace with measured project data", illustrative: true, samples: [{ label: "06:00", value: 2 }, { label: "08:00", value: 7 }, { label: "10:00", value: 18.4 }, { label: "12:00", value: 22 }, { label: "14:00", value: 17 }, { label: "16:00", value: 10 }, { label: "18:00", value: 3 }] } }, structure: "baseline" },
    "hero.between-acts": { ...base, content: { ...intro, title: "A movement begins.", closingPhrase: "The room remembers.", description: "New work shaped by the space between a gesture and its audience.", sideNote: "Season 04 / In rehearsal", eyebrow: "An independent ensemble", action: { label: "Discover the program", href: "#approach" } }, media: { image: stage }, treatment: { geometry: "panorama", tone: "monochrome" }, structure: "interval" },
    "hero.assembly": { ...base, content: { ...intro, title: "Built.\nFor your\nnext move.", description: "A modular work surface that adapts to the way you work.", specification: "Three replaceable parts. One lasting system.", eyebrow: "Construction / Revision 04" }, media: { assembly: { label: "Exploded assembly of a modular work surface", parts: [{ id: "A", label: "Worktop", specification: "Durable replaceable surface." }, { id: "B", label: "Support", specification: "Adjustable structural core." }, { id: "C", label: "Foot", specification: "Stable base with serviceable joints." }] } }, structure: "exploded" },
    "hero.comparison": { ...base, content: { ...intro, title: "One place, two readings.", description: "Inspect how the same architecture responds to daylight and evening. Both photographs remain registered to the same frame.", beforeLabel: "Daylight", afterLabel: "Evening" }, media: { before: landscape, after }, treatment: { geometry: "full-bleed", tone: "natural" }, structure: "balanced" },
    "content.feature-list": { ...base, content: { title: "The approach", description: "A clear process connects the opening proposition to what happens next.", items: [{ title: "Observe", body: "Begin with the people, context and material at hand." }, { title: "Develop", body: "Test useful possibilities through a deliberate sequence of decisions." }, { title: "Continue", body: "Make a result that can be cared for and adapted over time." }] }, structure: "grid" },
  };
  return parseSection(fixtures[component] ?? makeCollectionSection(component as typeof productionCollectionIds[number], id)) as SectionInstance<K>;
}

const site = (typography: SiteConfiguration["typography"], artDirection: SiteConfiguration["artDirection"], theme: SiteConfiguration["brand"]["theme"], colors?: SiteConfiguration["brand"]["colors"]): SiteConfiguration => ({ typography, artDirection, brand: { theme, colors }, icons: { id: "core", strokeWidth: 1.5 }, motion: "none" });
export function makeBlankComposition(): PageComposition {
  return { id: "blank-canvas", label: "Untitled composition", site: site("editorial", "publication", "neutral"), sections: [] };
}
export const compositionFixtures: PageComposition[] = [
  { id: "composition-a", label: "Architecture · Editorial introduction", site: site("editorial", "publication", "editorial"), sections: [makeSection("navigation.contents", "navigation"), makeSection("hero.front-page", "opening"), makeSection("content.feature-list", "approach")] },
  { id: "composition-b", label: "Energy platform · Live system overview", site: site("technical", "precision", "technical"), sections: [{ ...makeSection("navigation.primary", "navigation"), content: { ...navContent, brand: "Signal Works" } }, makeSection("hero.open-circuit", "opening"), { ...makeSection("content.feature-list", "approach"), structure: "list" }] },
  { id: "composition-c", label: "Performance ensemble · Season introduction", site: site("fashion", "gallery", "neutral", { accent: "#63344b", accentForeground: "#ffffff" }), sections: [{ ...makeSection("navigation.island", "navigation"), content: { ...navContent, brand: "Room Ensemble" }, structure: "end" }, makeSection("hero.between-acts", "opening"), makeSection("content.feature-list", "approach")] },
  { id: "composition-d", label: "Modular furniture · Product construction", site: site("poster", "billboard", "neutral", { background: "#e8ec7b", surface: "#f6f7d9", foreground: "#25271e", muted: "#404237", accent: "#25271e", accentForeground: "#f6f7d9", border: "#686b4b" }), sections: [{ ...makeSection("navigation.island", "navigation"), content: { ...navContent, brand: "Joint Works" }, structure: "center" }, makeSection("hero.assembly", "opening"), makeSection("content.feature-list", "approach")] },
  { id: "composition-e", label: "Architecture · Daylight and evening comparison", site: site("humanist", "salon", "neutral"), sections: [{ ...makeSection("navigation.island", "navigation"), placement: "overlay" }, makeSection("hero.comparison", "opening"), makeSection("content.feature-list", "approach")] },
];


// Six unlike internal QA combinations, not recipes or production inventory.
const storyPairs = [
  { id: "story-a", label: "Workshop story · Object biography with editorial hero", base: 0, candidate: "story.object-biography", adaptation: "workshop" },
  { id: "story-b", label: "Research story · Object biography with system hero", base: 1, candidate: "story.object-biography", adaptation: "research" },
  { id: "story-c", label: "Community story · Conversation with performance hero", base: 2, candidate: "story.working-conversation", adaptation: "community" },
  { id: "story-d", label: "Workshop story · Conversation with comparison hero", base: 4, candidate: "story.working-conversation", adaptation: "workshop" },
  { id: "story-e", label: "Workshop principles · Decision ledger with assembly hero", base: 3, candidate: "story.decision-ledger", adaptation: "workshop" },
  { id: "story-f", label: "Research principles · Decision ledger with editorial hero", base: 0, candidate: "story.decision-ledger", adaptation: "research" },
] as const;
for (const pair of storyPairs) {
  const base = structuredClone(compositionFixtures[pair.base]);
  const body = makeStorySection(pair.candidate, "story", pair.adaptation);
  if (pair.id === "story-f") { body.overrides = { typography: "technical", artDirection: "precision" }; if (body.component === "story.decision-ledger") body.structure = "disclosure"; }
  if (pair.id === "story-b" && body.component === "story.object-biography") body.structure = "reading-room";
  if (pair.id === "story-d" && body.component === "story.working-conversation") body.structure = "roundtable";
  compositionFixtures.push({ ...base, id: pair.id, label: pair.label, sections: [...base.sections.slice(0, 2), body, ...base.sections.slice(2)] });
}

// Two unlike site contexts per approved implementation, with alternating story/media sequences.
const stories = ["story.object-biography","story.manifesto-fold","story.working-conversation","story.decision-ledger","story.open-letter","story.material-relay"] as const;
const works = productionCollectionIds.filter(id=>id.startsWith("work."));
for (let i=0;i<works.length;i++) for (let context=0;context<2;context++) {
 const base = structuredClone(compositionFixtures[context===0 ? i%5 : (i+2)%5]);
 const story = makeSection(stories[(i+context)%stories.length],"story-first");
 const media = makeCollectionSection(works[i],"work-first",context===0 ? "apparel" : "hospitality");
 const secondStory = makeSection(stories[(i+context+3)%stories.length],"story-second");
 const secondMedia = makeCollectionSection(works[(i+3)%works.length],"work-second",context===0 ? "architecture" : "apparel");
 for(const section of [story,media,secondStory,secondMedia]) {
  const contract = getSectionContract(section.component);
  if(!contract.artDirections.includes(base.site.artDirection)) section.overrides = {artDirection:contract.artDirections[context % contract.artDirections.length]};
 }
 compositionFixtures.push({...base,id:`production-${i}-${context}`,label:`${works[i].replace("work.","").split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ")} · ${context===0 ? "Apparel" : "Hospitality"} · ${base.site.typography.replace("neo-grotesk","Neo-Grotesk").replace(/^./,letter=>letter.toUpperCase())} composition`,sections:[...base.sections.slice(0,2),story,media,secondStory,secondMedia]});
}

// Pass 006 compatibility fixtures. Ordered sequences are QA evidence, never page recipes.
for (let i=0;i<serviceSectionIds.length;i++) for(let context=0;context<2;context++) {
 const base=structuredClone(compositionFixtures[context===0?i%5:(i+2)%5]);
 const offering=makeServiceSection(serviceSectionIds[i],"offerings",context===0?"professional":"platform",context===0?"standard":"long");
 const neighbor=makeServiceSection(serviceSectionIds[(i+5)%serviceSectionIds.length],"capabilities","program");
 const story=makeSection(stories[(i+context)%stories.length],"story");
 const work=makeCollectionSection(works[(i+context)%works.length],"work",context===0?"architecture":"hospitality");
 const sections=context===0?[...base.sections.slice(0,2),story,offering,work]:[...base.sections.slice(0,2),offering,neighbor,makeSection("content.feature-list","ending")];
 for(const section of sections) {
 const contract=getSectionContract(section.component);
 if(!contract.artDirections.includes(base.site.artDirection)) section.overrides={artDirection:contract.artDirections[context%contract.artDirections.length]};
 }
 compositionFixtures.push({...base,id:`services-${i}-${context}`,label:`${serviceDescriptors[i].name.replace(/^./,letter=>letter.toUpperCase())} · ${context===0?"Story / offerings / work":"Offerings / capabilities / ending"} · ${base.site.typography}`,sections});
}

// Approved H09/H16 follow-up: unlike site contexts and neighboring collections, not templates.
for (const [i, heroId] of heroFollowupIds.entries()) for (let context = 0; context < 2; context++) {
 const base = structuredClone(compositionFixtures[context === 0 ? 0 : 2]);
 const opening = makeHeroFollowupSection(heroId, "opening", context === 0 ? "professional" : "program", context === 0 ? "standard" : "long", i === 1 ? "media-reveal" : "none");
 const story = makeSection(context === 0 ? "story.object-biography" : "story.working-conversation", "story");
 const offering = makeServiceSection(context === 0 ? "services.capability-desk" : "services.evidence-in-practice", "approach", context === 0 ? "professional" : "program");
 const work = makeCollectionSection(context === 0 ? "work.open-index" : "work.gallery-hanging", "work", context === 0 ? "architecture" : "hospitality");
 base.site.typography = i === 0 ? (context === 0 ? "luxury" : "technical") : (context === 0 ? "fashion" : "humanist");
 base.site.artDirection = i === 0 ? (context === 0 ? "gallery" : "precision") : (context === 0 ? "runway" : "publication");
 base.site.motion = "restrained";
 const sections = [base.sections[0], opening, story, offering, work];
 for (const section of sections) {
  const contract = getSectionContract(section.component);
  if (!contract.artDirections.includes(base.site.artDirection)) section.overrides = { artDirection: contract.artDirections[context % contract.artDirections.length] };
 }
 compositionFixtures.push({ ...base, id: `hero-followup-${i}-${context}`, label: `${i === 0 ? "Object Study" : "The Vertical Record"} · ${context === 0 ? "Editorial practice" : "Learning program"} · ${base.site.typography}`, sections });
}

// Pass 007 mixed compatibility checks: two unlike merchandising sequences, never page templates.
for (const [i,commerceId] of commerceSectionIds.entries()) for(let context=0;context<2;context++) {
 const base=structuredClone(compositionFixtures[context===0?i%5:(i+2)%5]);
 const merchandising=makeCommerceSection(commerceId,"merchandising",context===0?"apparel":i%2?"beauty":"audio",context===0?"standard":"long");
 const collection=makeCommerceSection(context===0?"commerce.merchant-edit":"commerce.collection-atlas","product-collection",context===0?"apparel":"audio");
 const story=makeSection(stories[(i+context)%stories.length],"story");
 const work=makeCollectionSection(works[(i+context)%works.length],"campaign",context===0?"apparel":"hospitality");
 const service=makeServiceSection(serviceSectionIds[(i+context)%serviceSectionIds.length],"capabilities",context===0?"professional":"platform");
 const ending=makeSection("content.feature-list","approach");
 const sections=context===0?[...base.sections.slice(0,2),story,merchandising,work,collection,ending]:[...base.sections.slice(0,2),merchandising,story,service,collection,ending];
 for(const section of sections){const contract=getSectionContract(section.component);if(!contract.artDirections.includes(base.site.artDirection))section.overrides={artDirection:contract.artDirections[context%contract.artDirections.length]};}
 compositionFixtures.push({...base,id:`commerce-${i}-${context}`,label:`${commerceDescriptors[i].name} · ${context===0?"Apparel / campaign":"Beauty and audio / capabilities"} · ${base.site.typography}`,sections});
}

// Navigation/Hero productionization QA compositions: structural capabilities, not page recipes.
for(const [i,navId] of navigationIds.entries()){
 const base=structuredClone(compositionFixtures[i%5]);
 const heroId=["hero.full-scene","hero.scene-poster","hero.comparison","hero.front-page"][i%4] as SectionId;
 const sections=[makeSection(navId,"navigation"),makeSection(heroId,"opening"),...base.sections.slice(2)];
 for(const section of sections){const c=getSectionContract(section.component);if(!c.artDirections.includes(base.site.artDirection))section.overrides={artDirection:c.artDirections[0]};}
 compositionFixtures.push({...base,id:`navigation-hero-${i}`,label:`${getSectionContract(navId).variants[0]} · ${heroId} · production`,sections});
}

// Pass 008 mixed QA sequences only. Two contexts per system, E06 in services and commerce.
for(const [i,component] of evidenceSectionIds.entries()) for(let context=0;context<2;context++) {
 const base=structuredClone(compositionFixtures.find(p=>p.id===`navigation-hero-${i}`)!);base.site.motion="restrained";
 if(context===1)base.sections[1]=makeSection("hero.assembly","opening");
 const evidence=makeEvidenceSection(component,"evidence",context===0?"security":"furniture",context===0?"standard":"long");
 const service=makeServiceSection(serviceSectionIds[i%serviceSectionIds.length],"services");
 const story=makeSection(stories[i%stories.length],"story");
 const work=makeCollectionSection(works[i%works.length],"work");
 const product=makeCommerceSection(context===0?"commerce.merchant-edit":"commerce.collection-atlas","product-collection");
 const ending=makeSection("content.feature-list","approach");
 const sections=context===0?[...base.sections.slice(0,2),story,service,evidence,work,ending]:[...base.sections.slice(0,2),makeCommerceSection("commerce.origin-receipt","product-story"),evidence,product,ending];
 for(const section of sections){const contract=getSectionContract(section.component);if(!contract.artDirections.includes(base.site.artDirection))section.overrides={...section.overrides,artDirection:contract.artDirections[0]};}
 compositionFixtures.push({...base,id:`evidence-${i}-${context}`,label:`${evidenceDescriptors[i].name} · ${context===0?"Services / human evidence / work":"Product story / evidence / collection"}`,sections});
}

// External import QA contexts; independent sections, never Page Recipes.
for (const component of importSectionIds) for (let context=0;context<2;context++) {
 const base=structuredClone(compositionFixtures[context === 0 ? 0 : 3]);
 const section=makeImportSection(component,component.startsWith("hero.") ? "opening" : "imported",{adaptation:context===0?"architecture":"hospitality",...(context===1?{motion:component==="hero.image-marquee"?"marquee":component==="story.process-timeline"?"horizontal-scroll":"depth-shift"}:{})});
 base.site.artDirection=context===0?"gallery":"precision";base.site.motion="restrained";
 compositionFixtures.push({...base,id:`external-${component.replaceAll(".","-")}-${context}`,label:`${component} · ${context===0?"Architecture":"Hospitality"}`,sections:component.startsWith("hero.")?[base.sections[0],section,...base.sections.slice(2)]:[...base.sections.slice(0,2),section,...base.sections.slice(2)]});
}

for (const component of ["work.gallery-hanging","proof.moving-chorus"] as const) for(let context=0;context<2;context++){
 const base=structuredClone(compositionFixtures[context===0?0:3]);
 const section=parseSection({...makeSection(component,"imported"),...(component === "work.gallery-hanging" ? {layout:"paired",ratio:context===0?"landscape":"square",captions:context===0?"below":"overlay",motion:"stagger"} : {layout:context===0?"columns":"perspective",columns:"three",motion:"marquee"})});
 base.site.artDirection=context===0?"gallery":"precision";base.site.motion="restrained";
 if(context===1 && section.component === "work.gallery-hanging")section.overrides={artDirection:"runway"};
 compositionFixtures.push({...base,id:`external-${component.replaceAll(".","-")}-${context}`,label:`${component} · imported ${context===0?"layout":"alternative"}`,sections:[...base.sections.slice(0,2),section,...base.sections.slice(2)]});
}

// Readiness QA endings, not stored Express variants or page recipes.
for(const [index,footer] of (["footer.sitemap","footer.compact","footer.split","footer.banner"] as const).entries()) {
 const base=structuredClone(compositionFixtures[index%3]);
 const cta=makeEndingSection(index===0?"cta.editorial":"cta.signal","conversion",{structure:index===0?"left":index===1?"poster":"split",surface:index===0?"transparent":"brand",height:index===1?"viewport":"section"});
 const contact=makeEndingSection("contact.inquiry","inquiry",{structure:index===0?"information":index===2?"social":"split",adaptation:"creator"});
 compositionFixtures.push({...base,id:`readiness-ending-${index}`,label:`Readiness · ${index===0?"Editorial / compact contact":index===1?"Full scene / booking inquiry":index===2?"Bold / social discovery":"Banner / inquiry"}`,sections:[...base.sections.slice(0,2),{...makeSection("proof.outcome-equation","evidence"),overrides:{artDirection:"precision"}},cta,contact,makeEndingSection(footer,"footer")]});
}
for(const component of endingSectionIds.filter(id=>id.startsWith("work."))) {
 const base=structuredClone(compositionFixtures[0]);
 compositionFixtures.push({...base,id:`readiness-${component.replaceAll(".","-")}`,label:`Readiness · ${component}`,sections:[...base.sections.slice(0,2),makeEndingSection(component,"gallery"),makeEndingSection("footer.compact","footer")]});
}
