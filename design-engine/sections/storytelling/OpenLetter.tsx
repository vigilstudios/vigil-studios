import { SectionActions } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
export function OpenLetter({
  id,
  content: c,
}: SectionInstance<"story.open-letter">) {
  return (
    <section
      id={id}
      className="de-story de-open-letter"
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="de-display">
        {c.salutation}
      </h2>
      <div className="de-open-letter__body">
        {c.paragraphs.map((paragraph, i) => (
          <p key={i} className="de-text">
            {paragraph}
          </p>
        ))}
        <p className="de-accent">
          {c.signoff}
          <br />
          {c.signature}
        </p>
      </div>
      {c.postscript ? (
        <aside className="de-open-letter__postscript" aria-label="Postscript">
          <span className="de-mono">P.S.</span>
          <p className="de-heading">{c.postscript}</p>
        </aside>
      ) : null}
    <SectionActions/></section>
  );
}
