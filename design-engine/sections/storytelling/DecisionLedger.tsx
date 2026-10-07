import type { SectionInstance } from "../../composition/schemas";
import { VigilIcon } from "../../icons/VigilIcon";

/** Each decision owns its rationale; native disclosure remains operable without motion. */
export function DecisionLedger({ id, content: c, structure }: SectionInstance<"story.decision-ledger">) {
  return <section id={id} className={`de-story de-decision-ledger de-decision-ledger--${structure}`} aria-labelledby={`${id}-title`}>
    <header className="de-story-intro"><h2 id={`${id}-title`} className="de-heading">{c.title}</h2><p className="de-text">{c.introduction}</p></header>
    <div className="de-decision-ledger__head" aria-hidden="true">{c.columns.map((label, index) => <span className="de-mono" key={index}>{label}</span>)}</div>
    <ol className="de-decision-ledger__entries">{c.decisions.map((decision, index) => <li key={index}>
      <div className="de-decision-ledger__row"><div><span className="de-mono de-decision-ledger__mobile-label">{c.columns[0]}</span><h3 className="de-heading de-heading--subsection"><span className="de-mono">0{index + 1} / </span>{decision.belief}</h3></div><div><span className="de-mono de-decision-ledger__mobile-label">{c.columns[1]}</span><p className="de-accent">{decision.tension}</p></div><div><span className="de-mono de-decision-ledger__mobile-label">{c.columns[2]}</span><p className="de-text">{decision.practice}</p></div></div>
      {structure === "disclosure" ? <details className="de-decision-ledger__rationale"><summary><span>{c.rationaleLabel}<span className="de-visually-hidden">: {decision.belief}</span></span><VigilIcon name="plus" decorative size={18} /></summary><p className="de-text">{decision.rationale}</p></details> : <div className="de-decision-ledger__rationale"><p className="de-mono">{c.rationaleLabel}</p><p className="de-text">{decision.rationale}</p></div>}
    </li>)}</ol>
  </section>;
}
