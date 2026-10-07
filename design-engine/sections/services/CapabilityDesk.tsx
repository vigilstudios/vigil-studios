"use client";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { VigilIcon } from "../../icons/VigilIcon";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink, ServicePicture, number } from "./shared";
export function CapabilityDesk({
  id,
  content,
  initialSelectedId,
  motion,
  treatment,
}: SectionInstance<"services.capability-desk">) {
  const uid = id;
  const [selection, setSelected] = useState(
    initialSelectedId ?? content.capabilities[0].id,
  );
  const selected = Math.max(
    content.capabilities.findIndex((item) => item.id === selection),
    0,
  );
  const c = content.capabilities[selected];
  const artwork = (
    <div className="de-service-desk">
      <div
        className="de-service-directory"
        role="group"
        aria-label="Choose a capability"
      >
        {content.capabilities.map((c, i) => (
          <button
            type="button"
            key={c.id}
            aria-pressed={selected === i}
            aria-controls={`${uid}-evidence`}
            onClick={() => setSelected(c.id)}
          >
            <span className="de-service-number">{number(i)}</span>
            <span>
              {c.title}
              <small>{c.category}</small>
            </span>
            <VigilIcon name="arrow-right" decorative size={16} />
          </button>
        ))}
      </div>
      <article
        id={`${uid}-evidence`}
        className="de-service-desk-evidence"
        aria-labelledby={`${uid}-evidence-title`}
      >
        <p className="de-service-kicker" aria-live="polite">
          Selected capability / {c.title}
        </p>
        <ServicePicture
          key={c.id}
          motion={motion}
          treatment={treatment}
          image={c.image}
        />
        <div className="de-service-desk-caption">
          <div>
            <h3 id={`${uid}-evidence-title`}>{c.title}</h3>
            <p>{c.description}</p>
          </div>
          <div>
            <small>What this enables</small>
            <p>{c.outcome}</p>
            {<ServiceLink itemId={c.id} destination={c.detail} />}
          </div>
        </div>
      </article>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c03">
      {artwork}
    </ServiceShell>
  );
}
