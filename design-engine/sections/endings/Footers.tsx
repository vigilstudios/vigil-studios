import type { SectionInstance } from "../../composition/schemas";
import { SectionActions } from "../../actions/SectionActions";
import { BrandMark } from "../navigation/BrandMark";
import { InquiryForm } from "../../forms/InquiryForm";
import { DestinationList, EndingReveal } from "./shared";
type FooterSection=SectionInstance<"footer.sitemap"|"footer.compact"|"footer.split"|"footer.banner">;
function FooterBrand({section,actions=true}:{section:FooterSection;actions?:boolean}) {
  return <div className="de-footer-brand"><div className="de-navigation-brand de-heading"><BrandMark brand={section.content.brand} logo={section.content.logo}/></div><p className="de-text">{section.content.statement}</p>{actions&&<SectionActions/>}<DestinationList items={section.content.socials} label={`${section.content.brand} social links`}/></div>;
}
function FooterMap({section}:{section:FooterSection}) {
  return <div className="de-footer-map" role="group" aria-label={section.content.navigationLabel}>{section.content.groups.map(group=><div key={group.id}><h3 className="de-heading">{group.title}</h3><DestinationList items={group.links} label={`${section.content.brand} · ${group.title}`}/></div>)}</div>;
}
function FooterClose({section}:{section:FooterSection}) {
  return <div className="de-footer-close"><p className="de-text de-text--small">{section.content.copyright.replaceAll("{year}",String(new Date().getFullYear()))}</p><DestinationList items={section.content.legal} label={`${section.content.brand} legal links`}/></div>;
}
function FooterShell({section,children}:{section:FooterSection;children:React.ReactNode}) {
  return <footer id={section.id} aria-label={`${section.content.brand} footer`} className={`de-ending de-footer de-footer--${section.component.split(".")[1]}`} data-layout={section.structure} data-surface={section.surface} data-density={section.density} data-measure={section.measure}><EndingReveal motion={section.motion}><div className="de-ending-inner">{children}<FooterClose section={section}/></div></EndingReveal></footer>;
}
export function SitemapFooter(section:SectionInstance<"footer.sitemap">) {
  return <FooterShell section={section}><div className="de-footer-columns"><FooterBrand section={section}/><FooterMap section={section}/></div></FooterShell>;
}
export function CompactFooter(section:SectionInstance<"footer.compact">) {
  return <FooterShell section={section}><div className="de-footer-compact"><FooterBrand section={section}/><DestinationList items={section.content.groups.flatMap(group=>group.links)} label={section.content.navigationLabel}/></div></FooterShell>;
}
export function SplitFooter(section:SectionInstance<"footer.split">) {
  return <FooterShell section={section}><div className="de-footer-cards"><div className="de-footer-brand-card"><FooterBrand section={section}/><h2 className="de-display">{section.content.title}</h2></div><div className="de-footer-directory-card"><FooterMap section={section}/>{section.content.newsletter&&<InquiryForm config={section.content.newsletter}/>}</div></div></FooterShell>;
}
export function BannerFooter(section:SectionInstance<"footer.banner">) {
  return <FooterShell section={section}><div className="de-footer-banner"><h2 className="de-display">{section.content.title}</h2><SectionActions/></div><div className="de-footer-columns"><div><FooterBrand section={section} actions={false}/>{section.content.newsletter&&<InquiryForm config={section.content.newsletter}/>}</div><FooterMap section={section}/></div></FooterShell>;
}
