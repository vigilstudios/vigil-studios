import type { SectionInstance } from "../../composition/schemas";
import { Plate } from "../work/shared";
import { EndingHeading, EndingReveal } from "./shared";
export function EditorialConversion(section:SectionInstance<"cta.editorial">) {
  return <section id={section.id} className="de-ending de-conversion de-conversion--editorial" data-align={section.structure} data-surface={section.surface} data-density={section.density} data-measure={section.measure} aria-labelledby={`${section.id}-title`}><EndingReveal motion={section.motion}><div className="de-ending-inner"><EndingHeading id={section.id} content={section.content}/></div></EndingReveal></section>;
}
export function SignalConversion(section:SectionInstance<"cta.signal">) {
  return <section id={section.id} className="de-ending de-conversion de-conversion--signal" data-layout={section.structure} data-height={section.height} data-surface={section.surface} data-density={section.density} data-measure={section.measure} aria-labelledby={`${section.id}-title`}><EndingReveal motion={section.motion}><div className="de-ending-inner de-conversion-scene"><EndingHeading id={section.id} content={section.content}/>{section.content.image&&<div className="de-conversion-image"><Plate image={section.content.image}/></div>}</div></EndingReveal></section>;
}
