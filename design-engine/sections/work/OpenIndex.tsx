import { ActionMedia, ItemAction } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, number } from "./shared";

/** M01: independent reusable structure; content and media belong to the caller. */
export function OpenIndex({
  id,
  content: c,
}: SectionInstance<"work.open-index">) {
  return (
    <WorkSection id={id} code="M01" content={c}>
      <div className="de-work-index">
        {c.projects.map((record, i) => (
          <details key={record.id} open={i === 0}>
            <summary>
              <span className="de-mono">{number(i)}</span>
              <h3 className="de-heading">{record.title}</h3>
              <span className="de-accent">{record.category}</span>
              <span className="de-work-index-sign" aria-hidden="true">
                ↗
              </span>
            </summary>
            <div className="de-work-index-record">
              <ActionMedia group="projects" itemId={record.id}><Plate image={record.image} /></ActionMedia>
              <div>
                <ItemAction group="projects" itemId={record.id}/>
                {record.note ? <p className="de-text">{record.note}</p> : null}
                {record.image.caption ? (
                  <p className="de-mono">{record.image.caption}</p>
                ) : null}
              </div>
            </div>
          </details>
        ))}
      </div>
    </WorkSection>
  );
}
