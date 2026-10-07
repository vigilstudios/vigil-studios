"use client";
import { useState } from "react";



import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, EvidenceSource } from "./shared";

import { EvidenceMediaReveal } from "./EvidenceMediaReveal";
import { EvidenceReveal } from "./EvidenceReveal";
export function CredentialLibrary({id,content,motion,evidenceMode}:SectionPayload<"proof.credential-library"> & {id:string}) {
const c=content;
  const [active, setActive] = useState(0),
    selected = Math.min(active,c.records.length-1),
    record = c.records[selected];
  return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E05">
    <div className="de-proof-credentials">
      <div className="de-proof-credential-index" aria-label="Recognition records">
        {c.records.map((r, i) => (
          <button
            key={`${r.title}-${i}`}
            aria-pressed={i === selected}
            onClick={() => setActive(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{r.organization}</strong>
            <small>
              {r.kind} · {r.year}
            </small>
          </button>
        ))}
      </div>
      <EvidenceReveal key={record.id} motion={motion}><article className="de-proof-accession">
        <p className="de-proof-eyebrow" aria-live="polite">
          Accession {String(selected + 1).padStart(2, "0")} · {record.kind}
        </p>
        {record.logo && <EvidenceMediaReveal image={record.logo} label="Issuer mark"/>}<span className="de-proof-accession-year">{record.year}</span>
        <h3>{record.title}</h3>
        <p>{record.scope}</p>
        <p>
          Issued by {record.organization}
          {record.expires
            ? ` · expires ${record.expires}`
            : " · no expiry supplied"}
        </p>
        <EvidenceSource value={record.provenance} />
      </article></EvidenceReveal>
      <details className="de-proof-all-records">
        <summary>Read all recognition records</summary>
        {c.records.map((r, i) => (
          <article key={i}>
            <h3>
              {r.organization} · {r.title}
            </h3>
            <p>
              {r.kind} · {r.year}
              {r.expires ? ` · expires ${r.expires}` : ""}
            </p>
            <p>{r.scope}</p>
            <EvidenceSource value={r.provenance} />
          </article>
        ))}
      </details>
    </div>
  </EvidenceShell>);
}
