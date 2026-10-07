import { ItemAction } from "../../actions/SectionActions";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { VigilIcon } from "../../icons/VigilIcon";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, number } from "./shared";
export function ConnectedCapabilities({
  id,
  content,
}: SectionInstance<"services.connected-capabilities">) {
  const artwork = (
    <div className="de-service-system">
      <div className="de-service-terminal">
        <small>Input</small>
        <p>{content.input}</p>
      </div>
      <ol>
        {content.layers.map((layer, i) => (
          <li key={layer.id}>
            <div className="de-service-layer">
              <span className="de-service-number">{number(i)}</span>
              <div>
                <h3>{layer.title}</h3>
                <p>{layer.responsibility}</p><ItemAction group="layers" itemId={layer.id}/>
              </div>
              <ul>
                {layer.components.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <p className="de-service-handoff">
              <span className="de-service-handoff-direction">
                <VigilIcon name="arrow-right" decorative />
              </span>{" "}
              {layer.handoff}
            </p>
          </li>
        ))}
      </ol>
      <div className="de-service-terminal">
        <small>Output</small>
        <p>{content.output}</p>
      </div>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c08">
      {artwork}
    </ServiceShell>
  );
}
