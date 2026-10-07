import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
import { SectionActions } from "../../actions/SectionActions";

/** H09: context and material copy flank a rounded object plate, with its reference outside. */
export function ObjectStudyHero({
  id,
  content: c,
  media,
  treatment,
}: SectionInstance<"hero.object-study">) {
  return (
    <section
      id={id}
      className="de-production-hero de-object-study"
      aria-labelledby={`${id}-title`}
    >
      <header className="de-object-study__mast de-mono">
        <span>{c.category}</span>
        <span>{c.reference}</span>
      </header>
      <div className="de-production-copy de-object-study__copy">
        {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}
        <h1 id={`${id}-title`} className="de-display">
          {c.title}
        </h1>
        {c.description ? <p className="de-text">{c.description}</p> : null}
        <p className="de-text de-object-study__material">{c.materialNote}</p>
        <SectionActions primary={c.action} />
      </div>
      <TreatedImage
        image={media.image}
        treatment={treatment}
        priority
        className="de-object-study__plate"
      />
      {c.objectNumber ? (
        <p className="de-mono de-object-study__number">{c.objectNumber}</p>
      ) : null}
    </section>
  );
}
