
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Voice, EvidenceSource } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";


export function ChangeDossier({id,content,motion,evidenceMode}:SectionPayload<"proof.change-dossier"> & {id:string}) {
const c = content;
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E03">
        <div className="de-proof-dossier">
          <div className="de-proof-dossier-subject">
            <span className="de-proof-eyebrow">
              Transformation file / {c.subject}
            </span>
            <p>{c.result.provenance.timeframe}</p>
          </div>
          <ol className="de-proof-chapters">
            <li className="de-proof-baseline">
              <span className="de-proof-chapter-number">01</span>
              <h3>{c.baseline.title}</h3>
              <p>{c.baseline.body}</p>
              {c.baseline.media && (
                <EvidenceMediaReveal
                  image={c.baseline.media} motion={motion}
                  label="Baseline record"
                />
              )}
              <p className="de-proof-stage-value">
                {c.result.before}
                <small>{c.result.unit} · baseline</small>
              </p>
            </li>
            <li className="de-proof-intervention">
              <span className="de-proof-chapter-number">02</span>
              <h3>{c.intervention.title}</h3>
              <p>{c.intervention.body}</p>
              <p className="de-proof-eyebrow">{c.intervention.duration}</p>
              <span className="de-proof-process-arrow" aria-hidden="true">
                ↗
              </span>
            </li>
            <li className="de-proof-outcome">
              <span className="de-proof-chapter-number">03</span>
              <h3>{c.outcome.title}</h3>
              {c.outcome.media && (
                <EvidenceMediaReveal image={c.outcome.media} motion={motion} label="Outcome record" />
              )}
              <p>{c.outcome.body}</p>
              <p className="de-proof-stage-value">
                {c.result.after}
                <small>{c.result.unit} · outcome</small>
              </p>
            </li>
          </ol>
          <div className="de-proof-dossier-footer">
            <Voice voice={c.voice} />
            <div>
              <h3>What this evidence covers</h3>
              <p>{c.result.basis}</p>
              <p>{c.limitation}</p>
              <EvidenceSource value={c.result.provenance} />
            </div>
          </div>
        </div>
      </EvidenceShell>);
}
