
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, EvidenceSource } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";


export function EvidenceDesk({id,content,motion,evidenceMode}:SectionPayload<"proof.evidence-desk"> & {id:string}) {
const c = content;
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E11">
        <div className="de-proof-evidence-desk">
          <aside>
            <span className="de-proof-eyebrow">The claim</span>
            <h3>{c.claim}</h3>
            <p>{c.qualification}</p>
            <span className="de-proof-exhibit-count">
              {String(c.artifacts.length).padStart(2, "0")}
              <small>supporting exhibits</small>
            </span>
          </aside>
          <ol>
            {c.artifacts.map((a, i) => (
              <li key={i}>
                <span className="de-proof-eyebrow">
                  Exhibit {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{a.title}</h3>
                <p>{a.finding}</p>
                <details open={i === 0}>
                  <summary>Inspect exhibit {i + 1}</summary>
                  <EvidenceMediaReveal image={a.media} motion={motion} label="Supporting record" />
                  <EvidenceSource value={a.provenance} />
                </details>
              </li>
            ))}
          </ol>
        </div>
      </EvidenceShell>);
}
