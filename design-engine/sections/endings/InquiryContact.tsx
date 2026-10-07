import type { SectionInstance } from "../../composition/schemas";
import { InquiryForm } from "../../forms/InquiryForm";
import { EndingHeading, EndingReveal, DestinationList } from "./shared";
export function InquiryContact(section:SectionInstance<"contact.inquiry">) {
  const c=section.content;
  return <section id={section.id} className="de-ending de-inquiry" data-layout={section.structure} data-surface={section.surface} data-density={section.density} data-measure={section.measure} aria-labelledby={`${section.id}-title`}><EndingReveal motion={section.motion}><div className="de-ending-inner de-inquiry-layout"><div><EndingHeading id={section.id} content={c}/><DestinationList items={c.details} label="Contact options"/>{c.location&&<p className="de-text">{c.location}</p>}{c.hours&&<p className="de-text">{c.hours}</p>}<DestinationList items={c.socials} label="Social discovery"/></div>{section.structure==="split"&&c.form&&<InquiryForm config={c.form}/>}</div></EndingReveal></section>;
}
