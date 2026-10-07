import { makeCollectionSection } from "./production-fixtures";
import { parseSection,type SectionInstance } from "../composition/schemas";
import type { ImportSectionId } from "../composition/import-schemas";
/** Authored Lab examples are illustrative and stay outside reusable component code. */
export function makeImportSection<K extends ImportSectionId>(component:K,id:string,config:Readonly<Record<string,string>>={}):SectionInstance<K> {
 const source=makeCollectionSection("work.gallery-hanging",id,config.adaptation??"architecture",config.contentLength??"standard");
 if(source.component!=="work.gallery-hanging")throw new Error("Gallery fixture required");
 const records=component === "work.image-sphere" ? ["architecture","apparel","hospitality"].flatMap(context=>{
  const collection=makeCollectionSection("work.gallery-hanging",id,context,config.contentLength??"standard");
  if(collection.component!=="work.gallery-hanging")return [];
  return collection.content.works.map(record=>({...record,id:`${context}-${record.id}`,thumbnail:{...record.image,width:600,height:400}}));
 }) : source.content.works;
 const common={id,component,content:{title:source.content.title,introduction:source.content.introduction,eyebrow:"An evolving practice",images:records},motion:"none",surface:"transparent"};
 const payload=component === "hero.image-marquee" ? {...common,structure:"center",direction:"left",speed:"slow",tilt:"alternating",ratio:"portrait"} : component === "work.image-sphere" ? {...common,structure:"center",speed:"slow",direction:"right",shape:"circle"} : {...common,structure:"alternating",density:"open",content:{title:"From the first conversation to the finished work.",introduction:"A clear sequence connects your starting point to a result you can use and maintain.",eyebrow:"How it works",period:"Brief → Delivery",image:records[0].image,steps:[{id:"understand",label:"01 / Discover",title:"Understand the context",body:"Share your goals, audience and constraints. Agree on what matters most."},{id:"plan",label:"02 / Define",title:"Shape a useful plan",body:"Set the scope, responsibilities and review points before work begins."},{id:"develop",label:"03 / Explore",title:"Test the possibilities",body:"Compare early options against the agreed goals and refine the direction."},{id:"review",label:"04 / Review",title:"Resolve the details",body:"Review the complete work and check its behavior in real conditions."},{id:"deliver",label:"05 / Launch",title:"Put the work into use",body:"Deliver the result with clear guidance for continued care and improvement."}]}};
 const valid=Object.fromEntries(Object.entries(config).filter(([name])=>name in payload && !["id","component","content"].includes(name)));
 return parseSection({...payload,...valid}) as unknown as SectionInstance<K>;
}
