import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
import { MediaReveal } from "../../motion/MediaReveal";
import { SectionActions } from "../../actions/SectionActions";

/** H17's publication hierarchy is fixed; creative layers change its voice. */
export function FrontPageHero({ id, content: c, media, structure, treatment, motion }: SectionInstance<"hero.front-page">) {
  const scene = <TreatedImage image={media.image} treatment={treatment} priority />;
  return <section id={id} className={`de-production-hero de-front-page de-front-page--${structure}`} aria-labelledby={`${id}-title`}>
    <header className="de-front-page__folio"><span className="de-mono">{c.edition}</span><span className="de-accent">{c.topic}</span></header>
    <div className="de-display de-front-page__masthead">{c.masthead}</div>
    <div className="de-front-page__spread">
      <div className="de-production-copy">{c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}
        <h1 id={`${id}-title`} className="de-display">{c.title}</h1><p className="de-text">{c.description}</p>
        <SectionActions primary={c.action} />
      </div>
      {motion === "media-reveal" ? <MediaReveal className="de-front-page__scene">{scene}</MediaReveal> : <div className="de-front-page__scene">{scene}</div>}
      <aside className="de-text de-front-page__abstract">{c.abstract}</aside>
    </div>
  </section>;
}
