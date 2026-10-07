import { ActionMedia } from "../../actions/SectionActions";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink, ServicePicture, number } from "./shared";
export function ServiceFieldAtlas({
  id,
  content,
  motion,
  treatment,
}: SectionInstance<"services.service-field-atlas">) {
  const artwork = (
    <div className="de-service-atlas">
      {content.plates.map((p, i) => (
        <figure key={p.id}>
          <div className="de-service-plate-head">
            <span className="de-service-number">{number(i)}</span>
            <h3>{p.title}</h3>
          </div>
          <ActionMedia group="plates" itemId={p.id}><ServicePicture
            motion={motion}
            treatment={treatment}
            image={p.image}
          /></ActionMedia>
          <figcaption>
            <p>{p.caption}</p>
            <small>{p.application}</small>
            {<ServiceLink itemId={p.id} destination={p.detail} />}
          </figcaption>
        </figure>
      ))}
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c09">
      {artwork}
    </ServiceShell>
  );
}
