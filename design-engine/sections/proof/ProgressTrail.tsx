import type { CSSProperties } from "react";
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, EvidenceSource, number } from "./shared";
import { StaggerReveal, StaggerItem } from "../../motion/StaggerReveal";
export function ProgressTrail({id,content,motion,evidenceMode}:SectionPayload<"proof.progress-trail"> & {id:string}) {
 const list=<ol style={{"--de-proof-point-count":content.points.length} as CSSProperties}>
  {content.points.map((point,index)=>{
   const evidence=<><time dateTime={point.date}>{point.date}</time><strong>{number(point.value)}<small>{content.unit}</small></strong><p>{point.event}</p><EvidenceSource value={point.provenance}/></>;
   return <li key={point.id} style={{"--de-proof-step":index} as CSSProperties}>{motion === "stagger" ? <StaggerItem className="de-proof-point">{evidence}</StaggerItem> : <div className="de-proof-point">{evidence}</div>}</li>;
  })}
 </ol>;
 return <EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E10"><div className="de-proof-progress"><div className="de-proof-progress-method"><h3>{content.label}</h3><p>{content.basis}</p></div>{motion === "stagger" ? <StaggerReveal interval={.12}>{list}</StaggerReveal> : list}</div></EvidenceShell>;
}
