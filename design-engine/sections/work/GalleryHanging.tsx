import { ActionMedia } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption } from "./shared";
import { StaggerItem, StaggerReveal } from "../../motion/StaggerReveal";
/** Original hanging stays intact; paired layout gives alternating 5/7, 7/5 emphasis. */
export function GalleryHanging({id,content:c,layout,ratio,captions,density,motion}:SectionInstance<"work.gallery-hanging">) {
 const artwork=<div className={layout === "paired" ? "de-work-paired" : "de-work-hanging"} data-ratio={ratio} data-captions={captions} data-density={density}>
 {c.works.map((record,i)=>{
 const figure=<figure key={record.id} className="de-gallery-record"><ActionMedia group="works" itemId={record.id}><Plate image={record.image}/></ActionMedia><Caption record={record} index={i}/></figure>;
 return layout === "hanging" && motion === "none" ? figure : motion === "stagger" ? <StaggerItem key={record.id} className="de-gallery-cell">{figure}</StaggerItem> : <div key={record.id} className="de-gallery-cell">{figure}</div>;
 })}</div>;
 return <WorkSection id={id} code="M07" content={c}>{motion === "stagger" ? <StaggerReveal>{artwork}</StaggerReveal> : artwork}</WorkSection>;
}
