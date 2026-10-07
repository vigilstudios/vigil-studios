// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, number } from "./shared";
export function CapabilityManifesto({
  id,
  content,
}: SectionInstance<"services.capability-manifesto">) {
  const artwork = (
    <div className="de-service-manifesto">
      <p className="de-service-promise">{content.promise}</p>
      {content.principles.map((p, i) => (
        <article key={p.verb}>
          <span className="de-service-number">{number(i)}</span>
          <h3>{p.verb}</h3>
          <div>
            <p>{p.pledge}</p>
            <small>Boundary / {p.boundary}</small>
          </div>
        </article>
      ))}
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c02">
      {artwork}
    </ServiceShell>
  );
}
