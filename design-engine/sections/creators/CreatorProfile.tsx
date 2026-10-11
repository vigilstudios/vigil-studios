import type { SectionInstance } from "../../composition/schemas";
import { Plate } from "../work/shared";
import { SectionActions } from "../../actions/SectionActions";
export function CreatorProfile(section: SectionInstance<"about.creator-profile">) {
  const c = section.content;
  return <section id={section.id} className="de-creator de-creator-profile" data-layout={section.structure} data-density={section.density} data-surface={section.surface} data-align={section.alignment} data-image-side={section.imageSide} data-photo-style={section.photoStyle} data-image-shape={section.imageShape} data-interest-shape={section.interestShape} aria-labelledby={`${section.id}-title`}>
    <div className="de-creator-inner de-creator-profile-grid">
      <div className="de-creator-bio"><header className="de-creator-heading">{c.eyebrow && <p className="de-eyebrow">{c.eyebrow}</p>}<h2 id={`${section.id}-title`} className="de-heading">{c.title}</h2><p className="de-creator-byline"><strong>{c.name}</strong>{c.role && <span>{c.role}</span>}{c.location && <span className="de-mono">{c.location}</span>}</p></header>
        <div className="de-creator-biography">{c.biography.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={i} className="de-text" data-de-motion-piece="content">{paragraph}</p>)}</div>
        {!!c.interests.length && <ul className="de-creator-interests" aria-label="Interests">{c.interests.map(interest => <li key={interest.id} data-de-motion-piece="content">{interest.label}</li>)}</ul>}
        {c.signature && <p className="de-creator-signature" data-de-motion-piece="content">{c.signature}</p>}<SectionActions />
      </div>
      <div className="de-creator-photos"><figure className="de-creator-portrait"><Plate image={c.image} />{c.image.caption && <figcaption className="de-mono">{c.image.caption}</figcaption>}</figure>{c.secondaryImage && <figure className="de-creator-snapshot"><Plate image={c.secondaryImage} />{c.secondaryImage.caption && <figcaption className="de-mono">{c.secondaryImage.caption}</figcaption>}</figure>}</div>
    </div>
  </section>;
}
