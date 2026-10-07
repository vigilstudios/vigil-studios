import { ItemAction } from "../../actions/SectionActions";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, number } from "./shared";
export function DeliveryJourney({
  id,
  content,
}: SectionInstance<"services.delivery-journey">) {
  const artwork = (
    <ol className="de-service-journey">
      {content.stages.map((s, i) => (
        <li key={s.id}>
          <span className="de-service-station">{number(i)}</span>
          <article>
            <p className="de-service-kicker">With / {s.owner}</p>
            <h3>{s.title}</h3><ItemAction group="stages" itemId={s.id}/>
            <p>{s.work}</p>
            <dl>
              <div>
                <dt>Arrive with</dt>
                <dd>{s.input}</dd>
              </div>
              <div>
                <dt>Leave with</dt>
                <dd>{s.output}</dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ol>
  );
  return (
    <ServiceShell id={id} content={content} concept="c06">
      {artwork}
    </ServiceShell>
  );
}
