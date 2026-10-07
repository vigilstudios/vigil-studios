// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink, number } from "./shared";
import { VigilIcon } from "../../icons/VigilIcon";
export function ExpandableOfferings({
  id,
  content,
}: SectionInstance<"services.expandable-offerings">) {
  const artwork = (
    <div className="de-service-disclosures">
      {content.services.map((s, i) => (
        <details key={s.id}>
          <summary>
            <span className="de-service-number">{number(i)}</span>
            <span>
              <strong>{s.title}</strong>
              <span className="de-service-row-summary">{s.summary}</span>
            </span>
            <VigilIcon name="chevron-down" decorative />
          </summary>
          <div className="de-service-disclosure-body">
            <div>
              <h3>Within the scope</h3>
              <ul>
                {s.included.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Outside the scope</h3>
              <p>{s.boundary}</p>
              {<ServiceLink itemId={s.id} destination={s.detail} />}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c04">
      {artwork}
    </ServiceShell>
  );
}
