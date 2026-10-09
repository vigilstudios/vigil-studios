import type { CSSProperties } from "react";
import { Plate } from "../work/shared";
import type { SectionInstance } from "../../composition/schemas";
import { InquiryForm } from "../../forms/InquiryForm";
import { EndingHeading, EndingReveal, DestinationList } from "./shared";
export function InquiryContact(section:SectionInstance<"contact.inquiry">) {
  const c=section.content;
  return <section id={section.id} className="de-ending de-inquiry" data-layout={section.structure} data-image-placement={c.image ? section.imagePlacement ?? "right" : "none"} data-align={section.alignment ?? "left"} data-appearance={section.appearance ?? "minimal"} data-surface={section.surface} data-density={section.density} data-measure={section.measure} aria-labelledby={`${section.id}-title`} style={{ "--de-contact-overlay": section.imageOverlay ?? .65 } as CSSProperties}>{c.image && section.imagePlacement === "background" && <div className="de-inquiry-background"><Plate image={c.image}/></div>}<EndingReveal motion={section.motion}><div className="de-ending-inner de-inquiry-layout"><div className="de-inquiry-copy"><EndingHeading id={section.id} content={c}/><DestinationList items={c.details} label="Contact options"/>{c.location&&<p className="de-text">{c.location}</p>}{c.hours&&<p className="de-text">{c.hours}</p>}<DestinationList items={c.socials} label="Social discovery"/></div>{c.image && section.imagePlacement !== "none" && section.imagePlacement !== "background" && <div className="de-inquiry-media"><Plate image={c.image}/></div>}{section.structure==="split"&&c.form&&<InquiryForm config={c.form} appearance={section.formAppearance}/>}</div></EndingReveal></section>;
}
