import { importProductionEvidence } from "./import-sections";
import { promoteCollectionSection } from "./collection-promotion";
import type { DesignComponentDefinition,ProductionEvidence } from "./types";
import { evidenceContracts,evidenceDescriptors,evidenceSectionIds } from "../composition/evidence-contracts";
import { chorusConfiguration,chorusDefaults } from "../composition/evidence-schemas";
/** Recorded checks: docs/design-engine/productionization-008/VERIFICATION.md. */
export const evidenceProductionEvidence:ProductionEvidence = {
 responsive:{desktop:true,tablet:true,mobile:true}, accessibility:{semantics:true,keyboard:true,focus:true,reducedMotion:true}, performanceReviewed:true,brandNeutralReviewed:true,visualDiversityReviewed:true,
 approvedBy:"User: entire Collection 008 approved; Codex: Pass 008 engineering and browser QA",approvedAt:"2026-10-05T18:17:18Z"
};
export const evidenceSections=evidenceSectionIds.map((id,index)=>{
 const d=evidenceDescriptors[index],composition=evidenceContracts[id];
 const common=[{name:"adaptation",options:["security","strength","furniture"]},{name:"contentLength",options:["standard","long"]},{name:"motion",options:composition.motion}];
 const defaults={adaptation:"security",contentLength:"standard",motion:composition.motion[composition.motion.length-1],...(index===5?chorusDefaults:{})};
 const entry = promoteCollectionSection({
 id,name:`${d.name} / ${d.id}`,sourceConcept:d.id,category:"proof",description:composition.structuralDNA,composition,styles:["neutral","editorial","technical"],pageTypes:["home","about","services","landing",...([0,5,6,7].includes(index)?["testimonials"] as const:index===4?["recognition"] as const:[3,11].includes(index)?["case-studies","customer-stories"] as const:["results"] as const)],supportedMotion:composition.motion,complexity:[5,6,11].includes(index)?"high":"medium",mobileReady:true,accessibilityReady:true,responsiveReady:{desktop:true,tablet:true,mobile:true},status:"experimental",version:"0.8.0",
 defaultCreative:{typography:d.typography[0],artDirection:composition.artDirections[0],motion:composition.motion.length>1?"restrained":"none"},
 configurations:[...common,...(index===5?chorusConfiguration:[])],motionParameters:index===5?["direction","speed","intensity","pauseOnHover","pauseOnFocus","edgeFade","gap"]:[],
 previewVariants:[{id:"default",label:"Approved mechanism / illustrative evidence",config:defaults},{id:"alternate",label:"Different context / long evidence",config:{...defaults,adaptation:"furniture",contentLength:"long",...(index===5?{visualStyle:"editorial",quoteScale:"display",alignment:"left",direction:"right"}:{})}}]
 } as const satisfies DesignComponentDefinition,evidenceProductionEvidence);
 return index === 5 ? {...entry,version:"1.1.0",productionEvidence:importProductionEvidence} : entry;
});
