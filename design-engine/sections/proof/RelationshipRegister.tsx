import { ItemAction } from "../../actions/SectionActions";

import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, EvidenceSource } from "./shared";

import { EvidenceMediaReveal } from "./EvidenceMediaReveal";
import { EvidenceReveal } from "./EvidenceReveal";

export function RelationshipRegister({id,content,motion,evidenceMode}:SectionPayload<"proof.relationship-register"> & {id:string}) {
const c = content,
        min = Math.min(...c.relationships.map((r) => r.since)),
        max = Math.max(...c.relationships.map((r) => r.through)),
        span = Math.max(max - min, 1);
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E09">
        <div className="de-proof-relationships">
          <div className="de-proof-relationship-axis" aria-hidden="true">
            <span>Organization / relationship</span>
            <div>
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <span>Scope of relationship</span>
          </div>
          {c.relationships.map((r) => (
            <EvidenceReveal key={r.id} motion={motion}><article>
              <div>
                {r.logo && <EvidenceMediaReveal image={r.logo} label="Organization mark"/>}<h3>{r.organization}</h3>
                <p>{r.role}</p>
              </div>
              <div className="de-proof-tenure">
                <span>
                  {r.since}–{r.through}
                </span>
                <i
                  aria-hidden="true"
                  style={{
                    marginLeft: `${Math.min(((r.since - min) / span) * 100, 99)}%`,
                    width: `${Math.max(((r.through - r.since) / span) * 100, 1)}%`,
                  }}
                />
              </div>
              <div>
                <p>{r.outcome}</p><ItemAction group="relationships" itemId={r.id}/>
                <EvidenceSource value={r.provenance} />
              </div>
            </article></EvidenceReveal>
          ))}
        </div>
      </EvidenceShell>);
}
