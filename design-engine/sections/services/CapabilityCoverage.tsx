"use client";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, CapabilityMatrix } from "./shared";
export function CapabilityCoverage({
  id,
  content,
}: SectionInstance<"services.capability-coverage">) {
  const [phase, setPhase] = useState(0);
  const artwork = (
    <div className="de-service-matrix">
      <label className="de-service-mobile-only">
        Inspect delivery phase
        <select
          value={phase}
          onChange={(e) => setPhase(Number(e.target.value))}
        >
          {content.phases.map((p, i) => (
            <option key={p} value={i}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <p className="de-service-legend">
        Lead = primary responsibility · Support = contributing responsibility ·
        — = outside scope
      </p>
      <div className="de-service-desktop-only">
        <CapabilityMatrix content={content} />
      </div>
      <div className="de-service-mobile-only">
        <CapabilityMatrix content={content} phase={phase} />
      </div>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c07">
      {artwork}
    </ServiceShell>
  );
}
