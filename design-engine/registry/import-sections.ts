import type { DesignComponentDefinition,ProductionEvidence } from "./types";
import { importContracts } from "../composition/import-contracts";
import { importSectionIds } from "../composition/import-schemas";
/** User supplied this batch for productization; engineering evidence lives in external-imports. */
export const importProductionEvidence:ProductionEvidence={responsive:{desktop:true,tablet:true,mobile:true},accessibility:{semantics:true,keyboard:true,focus:true,reducedMotion:true},performanceReviewed:true,brandNeutralReviewed:true,visualDiversityReviewed:true,approvedBy:"User supplied external batch for productionization; Codex implementation QA",approvedAt:"2026-10-06T12:00:00-04:00"};
const names=["Image Marquee Hero","Process Timeline","Image Sphere"];
export const importSections=importSectionIds.map((id,i)=>{
 const composition=importContracts[id];
 const configs=[{name:"adaptation",options:["architecture","hospitality","apparel"]},{name:"contentLength",options:["standard","long"]},{name:"structure",options:composition.variants},{name:"motion",options:composition.motion},...composition.configuration];
 const defaults=Object.fromEntries(configs.map(field=>[field.name,field.options[0]]));
 return {id,name:names[i],sourceConcept:`external-${i === 0 ? "hero-3" : i === 1 ? "timeline" : "img-sphere"}`,category:composition.category,description:composition.structuralDNA,composition,styles:["neutral","editorial","technical"],pageTypes:["home","about","landing","portfolio-index","project-detail","service-detail"],supportedMotion:composition.motion,complexity:i===0?"medium":"high",mobileReady:true,accessibilityReady:true,responsiveReady:{desktop:true,tablet:true,mobile:true},status:"production",version:"1.0.0",productionEvidence:importProductionEvidence,defaultCreative:{typography:i===0?"geometric":i===1?"technical":"fashion",artDirection:i===0?"billboard":i===1?"precision":"gallery",motion:"restrained"},motionParameters:i===1?[]:["direction","speed",...(i===0?["tilt"]:[])],configurations:configs,previewVariants:[{id:"default",label:"Native mechanism / still",config:defaults},{id:"alternate",label:"Alternate composition / motion",config:{...defaults,structure:composition.variants[1],motion:composition.motion[1]}}]} as const satisfies DesignComponentDefinition;
});
