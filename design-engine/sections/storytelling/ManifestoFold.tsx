import type { SectionInstance } from "../../composition/schemas";
export function ManifestoFold({
  id,
  content: c,
}: SectionInstance<"story.manifesto-fold">) {
  return (
    <section
      id={id}
      className="de-story de-manifesto-fold"
      aria-labelledby={`${id}-title`}
    >
      <header className="de-manifesto-fold__preface">
        <h2 id={`${id}-title`} className="de-accent">
          {c.title}
        </h2>
        <p className="de-text">{c.introduction}</p>
      </header>
      <ol>
        {c.principles.map((principle, i) => (
          <li key={i}>
            <span className="de-mono">0{i + 1}</span>
            <h3 className="de-display">{principle.statement}</h3>
            <p className="de-text">{principle.explanation}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
