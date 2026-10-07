import type { SectionInstance } from "../../composition/schemas";
import { FadeReveal } from "../../motion/FadeReveal";
import { SectionActions } from "../../actions/SectionActions";

export function AssemblyHero({ id, content: c, media: { assembly }, structure, motion }: SectionInstance<"hero.assembly">) {
  const diagram = <figure className="de-assembly__diagram" aria-label={assembly.label}>
    <div className="de-assembly__planes" aria-hidden="true">{assembly.parts.map(part => <div key={part.id}><span className="de-mono">{part.id} / {part.label}</span></div>)}</div>
    <figcaption className="de-mono">{assembly.label}</figcaption>
  </figure>;
  return <section id={id} className={`de-production-hero de-assembly de-assembly--${structure}`} aria-labelledby={`${id}-title`}>
    {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}
    <div className="de-assembly__main"><div className="de-production-copy"><h1 id={`${id}-title`} className="de-display">{c.title}</h1><p className="de-text">{c.description}</p></div>
      {motion === "fade" ? <FadeReveal distance={12}>{diagram}</FadeReveal> : diagram}
    </div>
    <div className="de-assembly__joint"><p className="de-accent">{c.specification}</p><SectionActions primary={c.action} /></div>
    <dl className="de-assembly__specifications">{assembly.parts.map(part => <div key={part.id}><dt className="de-accent">{part.id} / {part.label}</dt><dd className="de-text">{part.specification}</dd></div>)}</dl>
  </section>;
}
