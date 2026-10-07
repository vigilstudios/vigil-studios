
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Voice, Result, EvidenceSource, CaseDestination } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";


export function CaseCrossSection({id,content,motion,evidenceMode}:SectionPayload<"proof.case-cross-section"> & {id:string}) {
const c = content.case;
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E04">
        <div className="de-proof-cross-section">
          <figure className="de-proof-case-panorama">
            <EvidenceMediaReveal image={c.media} motion={motion} label="Project context" />
            <figcaption>
              <span className="de-proof-eyebrow">{c.client}</span>
              <Result value={c.result} />
            </figcaption>
          </figure>
          <div className="de-proof-case-footer">
            <dl className="de-proof-case-facts">
              <div>
                <dt>Challenge</dt>
                <dd>{c.challenge}</dd>
              </div>
              <div>
                <dt>Intervention</dt>
                <dd>{c.intervention}</dd>
              </div>
              <div>
                <dt>Measurement basis</dt>
                <dd>{c.result.basis}</dd>
              </div>
            </dl>
            <Voice voice={c.voice} />
          </div>
          <EvidenceSource value={c.result.provenance} />
          <CaseDestination value={c} />
        </div>
      </EvidenceShell>);
}
