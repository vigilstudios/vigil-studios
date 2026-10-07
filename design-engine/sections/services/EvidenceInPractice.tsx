"use client";
import { ItemAction } from "../../actions/SectionActions";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServicePicture, number } from "./shared";
export function EvidenceInPractice({
  id,
  content,
  initialSelectedId,
  motion,
  treatment,
}: SectionInstance<"services.evidence-in-practice">) {
  const uid = id;
  const [selection, setSelected] = useState(
    initialSelectedId ?? content.cases[0].id,
  );
  const selected = Math.max(
    content.cases.findIndex((item) => item.id === selection),
    0,
  );
  const c = content.cases[selected];
  const artwork = (
    <div className="de-service-case">
      <div
        className="de-service-case-choices"
        role="group"
        aria-label="Choose a capability case"
      >
        {content.cases.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={i === selected}
            aria-controls={`${uid}-case`}
            onClick={() => setSelected(c.id)}
          >
            {number(i)} / {c.title}
          </button>
        ))}
      </div>
      <article id={`${uid}-case`} aria-labelledby={`${uid}-case-title`}>
        <h3 id={`${uid}-case-title`} aria-live="polite">
          {c.title}
        </h3>
        <div className="de-service-evidence-pair" key={c.id}>
          {[c.before, c.after].map((p, i) => (
            <figure key={i}>
              <small>{p.label}</small>
              <ServicePicture
                motion={motion}
                treatment={treatment}
                image={p.image}
              />
              <figcaption>{p.note}</figcaption>
            </figure>
          ))}
        </div>
        <div className="de-service-case-explanation">
          <p>{c.capability}</p>
          <small>{c.evidence}</small><ItemAction group="cases" itemId={c.id}/>
        </div>
      </article>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c10">
      {artwork}
    </ServiceShell>
  );
}
