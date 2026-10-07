import { SectionActions } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";

/** A semantic transcript: questions precede speakers and their approved answers. */
export function WorkingConversation({ id, content: c, structure }: SectionInstance<"story.working-conversation">) {
  return <section id={id} className={`de-story de-working-conversation de-working-conversation--${structure}`} aria-labelledby={`${id}-title`}>
    <header className="de-story-intro"><h2 id={`${id}-title`} className="de-heading">{c.title}</h2><p className="de-text">{c.introduction}</p><p className="de-mono">{c.attribution}</p></header>
    <div className="de-working-conversation__turns">{c.exchanges.map((exchange, index) => <article className="de-working-conversation__turn" key={index}>
      <h3 className="de-heading"><span className="de-mono">0{index + 1}</span>{exchange.question}</h3>
      <div className="de-working-conversation__response"><div className="de-working-conversation__speaker"><p className="de-accent">{exchange.speaker}</p><p className="de-mono">{exchange.role}</p></div><div><p className="de-text de-text--lead">{exchange.answer}</p>{exchange.aside ? <p className="de-mono de-working-conversation__note">{exchange.aside}</p> : null}</div></div>
    </article>)}</div>
  <SectionActions/></section>;
}
