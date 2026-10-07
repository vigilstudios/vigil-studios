import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
import { MediaReveal } from "../../motion/MediaReveal";
import { SectionActions } from "../../actions/SectionActions";

export function BetweenActsHero({ id, content: c, media, structure, treatment, motion }: SectionInstance<"hero.between-acts">) {
  const image = <TreatedImage image={media.image} treatment={treatment} priority />;
  return <section id={id} className={`de-production-hero de-between-acts de-between-acts--${structure}`} aria-labelledby={`${id}-title`}>
    {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}
    <h1 id={`${id}-title`} className="de-display">{c.title}</h1>
    <div className="de-between-acts__interval"><p className="de-mono">{c.sideNote}</p>
      {motion === "media-reveal" ? <MediaReveal>{image}</MediaReveal> : image}
    </div>
    <div className="de-between-acts__closing"><p className="de-display">{c.closingPhrase}</p><p className="de-text">{c.description}</p></div>
    <SectionActions primary={c.action} />
  </section>;
}
