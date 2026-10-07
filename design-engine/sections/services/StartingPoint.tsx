"use client";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink } from "./shared";
export function StartingPoint({
  id,
  content,
  initialSelectedId,
}: SectionInstance<"services.starting-point">) {
  const uid = id;
  const [selection, setSelected] = useState(
    initialSelectedId ?? content.paths[0].id,
  );
  const selected = Math.max(
    content.paths.findIndex((item) => item.id === selection),
    0,
  );
  const p = content.paths[selected];
  const artwork = (
    <div className="de-service-path">
      <h3>{content.question}</h3>
      <div
        className="de-service-path-choices"
        role="group"
        aria-label="Choose your starting need"
      >
        {content.paths.map((p, i) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={i === selected}
            aria-controls={`${uid}-recommendation`}
            onClick={() => setSelected(p.id)}
          >
            {p.need}
          </button>
        ))}
      </div>
      <div
        id={`${uid}-recommendation`}
        className="de-service-recommendation"
        aria-live="polite"
        aria-atomic="true"
      >
        <small>A possible starting point</small>
        <h4>{p.recommendation}</h4>
        <p>{p.reason}</p>
        <p className="de-service-alternative">{p.alternative}</p>
        {<ServiceLink itemId={p.id} destination={p.detail} />}
      </div>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c11">
      {artwork}
    </ServiceShell>
  );
}
