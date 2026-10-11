import { SocialIcon, socialIconFor } from "../../icons/SocialIcon";
import type { CSSProperties } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { SectionActions } from "../../actions/SectionActions";
import { VigilIcon } from "../../icons/VigilIcon";
import { StatCountUp } from "../../motion/StatCountUp";
export function SocialReach(section: SectionInstance<"proof.social-reach">) {
  const c = section.content;
  return <section id={section.id} className="de-creator de-social-reach" data-layout={section.structure} data-density={section.density} data-surface={section.surface} data-align={section.alignment} data-stats={section.statsStyle} data-links={section.linkStyle} data-stats-layout={section.statsLayout} data-stat-surface={section.statSurface} data-stat-align={section.statAlignment === "inherit" ? section.alignment : section.statAlignment} data-links-align={section.linksAlignment === "inherit" ? section.alignment : section.linksAlignment} data-link-shape={section.linkShape} aria-labelledby={`${section.id}-title`} style={{ "--de-stat-size": section.statSize ? `${section.statSize}px` : undefined, "--de-stat-gap": section.statGap !== undefined ? `${section.statGap}px` : undefined, "--de-stat-padding": section.statPadding !== undefined ? `${section.statPadding}px` : undefined, "--de-social-gap": section.linkGap !== undefined ? `${section.linkGap}px` : undefined } as CSSProperties}>
    <div className="de-creator-inner">
      <header className="de-creator-heading">{c.eyebrow && <p className="de-eyebrow">{c.eyebrow}</p>}<h2 id={`${section.id}-title`} className="de-heading">{c.title}</h2><p className="de-text">{c.introduction}</p></header>
      <dl className="de-creator-stats" style={{ "--de-stat-count": section.statsColumns ?? Math.min(c.stats.length, 4) } as CSSProperties}>{c.stats.map((stat, index) => <div key={stat.id} className="de-creator-stat" data-de-motion-piece="content"><dt>{stat.label}</dt><dd className="de-creator-stat-value"><StatCountUp value={stat.value} settings={section.numberAnimation} index={index} disabled={section.presentation?.motionMode === "none"}/></dd>{(stat.platform || stat.period || stat.source) && <dd className="de-creator-stat-details">{stat.platform && <p className="de-creator-platform">{stat.platform}</p>}{stat.period && <p className="de-mono">{stat.period}</p>}{stat.source && <a className="de-creator-source" href={stat.source} aria-label={`View source for ${stat.label}`}>View source <VigilIcon name="arrow-up-right" decorative /></a>}</dd>}</div>)}</dl>
      {c.basis && <p className="de-creator-basis de-mono" data-de-motion-piece="content">{c.basis}</p>}
      <nav aria-label="Social profiles" className="de-creator-socials">{c.socials.map(social => <a key={social.id} href={social.href} data-de-motion-piece="content" aria-label={`${social.platform}${social.handle ? ` · ${social.handle}` : ""}`}>
        {["icons","icon-label","cards"].includes(section.linkStyle) && <SocialIcon name={social.icon ?? socialIconFor(social.platform)} size={section.socialIconSize ?? 24}/>}
        {section.linkStyle !== "icons" && <span><strong>{section.linkStyle === "handles" ? social.handle ?? social.platform : social.platform}</strong>{social.handle && section.linkStyle !== "handles" && <span>{social.handle}</span>}</span>}
        {!["icons","icon-label"].includes(section.linkStyle) && <VigilIcon name="arrow-up-right" decorative />}
      </a>)}</nav>
      <SectionActions />
    </div>
  </section>;
}
