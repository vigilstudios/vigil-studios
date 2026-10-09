import type { CSSProperties } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { SectionActions } from "../../actions/SectionActions";
import { VigilIcon } from "../../icons/VigilIcon";
export function SocialReach(section: SectionInstance<"proof.social-reach">) {
  const c = section.content;
  return <section id={section.id} className="de-creator de-social-reach" data-layout={section.structure} data-density={section.density} data-surface={section.surface} data-align={section.alignment} data-stats={section.statsStyle} data-links={section.linkStyle} aria-labelledby={`${section.id}-title`}>
    <div className="de-creator-inner">
      <header className="de-creator-heading">{c.eyebrow && <p className="de-eyebrow">{c.eyebrow}</p>}<h2 id={`${section.id}-title`} className="de-heading">{c.title}</h2><p className="de-text">{c.introduction}</p></header>
      <dl className="de-creator-stats" style={{ "--de-stat-count": Math.min(c.stats.length, 4) } as CSSProperties}>{c.stats.map(stat => <div key={stat.id} className="de-creator-stat"><dt>{stat.label}</dt><dd className="de-creator-stat-value">{stat.value}</dd>{(stat.platform || stat.period || stat.source) && <dd className="de-creator-stat-details">{stat.platform && <p className="de-creator-platform">{stat.platform}</p>}{stat.period && <p className="de-mono">{stat.period}</p>}{stat.source && <a className="de-creator-source" href={stat.source} aria-label={`View source for ${stat.label}`}>View source <VigilIcon name="arrow-up-right" decorative /></a>}</dd>}</div>)}</dl>
      {c.basis && <p className="de-creator-basis de-mono">{c.basis}</p>}
      <nav aria-label="Social profiles" className="de-creator-socials">{c.socials.map(social => <a key={social.id} href={social.href}><span><strong>{social.platform}</strong>{social.handle && <span>{social.handle}</span>}</span><VigilIcon name="arrow-up-right" decorative /></a>)}</nav>
      <SectionActions />
    </div>
  </section>;
}
