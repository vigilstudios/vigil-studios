
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Voice, EvidenceSource, number } from "./shared";

import { EvidenceReveal } from "./EvidenceReveal";

export function OutcomeEquation({id,content,motion,evidenceMode}:SectionPayload<"proof.outcome-equation"> & {id:string}) {
const c=content;
  const m = c.result,
    max = Math.max(m.before, m.after, 1),
    delta = m.after - m.before;
  return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E02">
    <EvidenceReveal motion={motion}><div className="de-proof-equation">
      <div className="de-proof-equation-values">
        <div>
          <span>Before</span>
          <strong>{number(m.before)}</strong>
          <small>{m.unit}</small>
          <i
            aria-hidden="true"
            style={{ width: `${(m.before / max) * 100}%` }}
          />
        </div>
        <span className="de-proof-equals-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <span>After</span>
          <strong>{number(m.after)}</strong>
          <small>{m.unit}</small>
          <i
            aria-hidden="true"
            style={{ width: `${(m.after / max) * 100}%` }}
          />
        </div>
      </div>
      <div className="de-proof-equation-note">
        <h3>{m.label}</h3>
        <p className="de-proof-delta">
          {delta > 0 ? "+" : ""}
          {number(delta)} {m.unit}
          <br />
          <small>
            {m.before === 0
              ? "Relative change unavailable from a zero baseline"
              : `${number(Math.abs((delta / m.before) * 100))}% ${delta < 0 ? "decrease" : delta > 0 ? "increase" : "change"} from baseline`}
          </small>
        </p>
        <p>{c.explanation}</p>
        <p>{m.basis}</p>
        <EvidenceSource value={m.provenance} />
      </div>
      <Voice voice={c.voice} />
    </div>
</EvidenceReveal>  </EvidenceShell>);
}
