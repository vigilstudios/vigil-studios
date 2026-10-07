import { makeProofModel,proofContexts } from "./collection-008/fixtures";
import type { ProofId } from "./collection-008/contracts";
import { evidenceSectionIds } from "../composition/evidence-contracts";
import { chorusDefaults } from "../composition/evidence-schemas";
import type { EvidenceSectionId } from "../composition/evidence-schemas";
import { parseSection, type SectionInstance } from "../composition/schemas";
export function makeEvidenceSection<K extends EvidenceSectionId>(component:K,id:string,adaptation="security",length="standard",motion?:string,config:Readonly<Record<string,string>>={}):SectionInstance<K> {
 const index=evidenceSectionIds.indexOf(component), context=Math.max(0,proofContexts.findIndex(c=>c.id===adaptation));
 const model=makeProofModel(`E${String(index+1).padStart(2,"0")}` as ProofId,context,length === "long"?"long-copy":"authored");
 const content=structuredClone(model.content);
 const identify=(v:unknown,path:string)=>{
  if(!v || typeof v !== "object")return;
  if("provenance" in v && ("quote" in v || "value" in v || "organization" in v || "finding" in v || "before" in v) || "client" in v && "challenge" in v) Object.assign(v,{id:path});
  if("src" in v && "alt" in v)Object.assign(v,{caption:"Illustrative study media · not a customer record"});
  Object.entries(v).forEach(([key,item])=>identify(item,`${path}-${key}`));
 };
 identify(content,"fixture");
 if(component === "proof.moving-chorus" && "voices" in content) {
  content.voices.forEach(voice=>{
   Object.assign(voice.author,{profileUrl:"#qa-sources"});
   if(voice.portrait) Object.assign(voice.author,{avatar:voice.portrait});
   const organization=voice.author.organization;
   const initials=organization.split(" ").map(word=>word[0]).join("").slice(0,3);
   Object.assign(voice.author,{logo:{src:"data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect x="1" y="1" width="238" height="78" fill="#eee" stroke="#222"/><text x="120" y="52" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#222">${initials}</text></svg>`),width:240,height:80,alt:`Fictional example organization mark for ${organization}`,caption:"Fictional Lab mark"}});
  });
 }
 const animated=["media-reveal","fade","media-reveal","media-reveal","fade","marquee","none","media-reveal","fade","stagger","media-reveal","fade"][index];
 return parseSection({id,component,structure:"authored",evidenceMode:"illustrative",content,motion:motion??animated,...(index===5?{...chorusDefaults,...Object.fromEntries(Object.keys(chorusDefaults).map(k=>[k,config[k]??chorusDefaults[k as keyof typeof chorusDefaults]]))}:{})}) as SectionInstance<K>;
}
