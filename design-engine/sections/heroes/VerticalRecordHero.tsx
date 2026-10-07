import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
import { MediaReveal } from "../../motion/MediaReveal";
import { SectionActions } from "../../actions/SectionActions";

/** H16: the image spans the context/copy rows; the authored record occupies a separate lane. */
export function VerticalRecordHero({
  id,
  content: c,
  media,
  treatment,
  motion,
}: SectionInstance<"hero.vertical-record">) {
  const image = (
    <TreatedImage image={media.image} treatment={treatment} priority />
  );
  return (
    <section
      id={id}
      className="de-production-hero de-vertical-record"
      aria-labelledby={`${id}-title`}
    >
      <header className="de-vertical-record__mast de-mono">
        <span>{c.category}</span>
        <span>{c.reference}</span>
      </header>
      <div className="de-production-copy de-vertical-record__copy">
        {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}
        <h1 id={`${id}-title`} className="de-display">
          {c.title}
        </h1>
        {c.description ? <p className="de-text">{c.description}</p> : null}
        <SectionActions primary={c.action} />
      </div>
      {motion === "media-reveal" ? (
        <MediaReveal fromX={-60} className="de-vertical-record__spine">
          {image}
        </MediaReveal>
      ) : (
        <div className="de-vertical-record__spine">{image}</div>
      )}
      <aside
        className="de-vertical-record__record"
        aria-labelledby={`${id}-record-title`}
      >
        <h2 id={`${id}-record-title`} className="de-mono">
          {c.recordLabel}
        </h2>
        <ol>
          {c.records.map((record) => (
            <li key={record.id} className="de-mono">
              <span>{record.dateLabel}</span>
              <span>{record.label}</span>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
