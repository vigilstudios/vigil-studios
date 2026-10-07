// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, number } from "./shared";
export function SituationResponses({
  id,
  content,
}: SectionInstance<"services.situation-responses">) {
  const artwork = (
    <ol className="de-service-situations">
      {content.situations.map((s, i) => (
        <li key={s.need}>
          <div className="de-service-need">
            <small>{number(i)} / The friction</small>
            <h3>{s.need}</h3>
          </div>
          <div className="de-service-response">
            <small>The capability</small>
            <p>{s.response}</p>
          </div>
          <div className="de-service-outcome">
            <small>The possibility</small>
            <p>{s.outcome}</p>
            <small>{s.evidence}</small>
          </div>
        </li>
      ))}
    </ol>
  );
  return (
    <ServiceShell id={id} content={content} concept="c05">
      {artwork}
    </ServiceShell>
  );
}
