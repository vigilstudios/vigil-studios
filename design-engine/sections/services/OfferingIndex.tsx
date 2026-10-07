// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink, number } from "./shared";
export function OfferingIndex({
  id,
  content,
}: SectionInstance<"services.offering-index">) {
  const artwork = (
    <ol className="de-service-index">
      {content.entries.map((entry, i) => (
        <li key={entry.id}>
          <span className="de-service-number">{number(i)}</span>
          <div>
            <h3>{entry.title}</h3>
            <p>{entry.summary}</p>
            {<ServiceLink itemId={entry.id} destination={entry.detail} />}
          </div>
          <ul className="de-service-deliverables">
            {entry.deliverables.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
  return (
    <ServiceShell id={id} content={content} concept="c01">
      {artwork}
    </ServiceShell>
  );
}
