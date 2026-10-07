import { ActionMedia, ItemAction } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, number } from "./shared";

/** M02: independent reusable structure; content and media belong to the caller. */
export function ProjectChapters({
  id,
  content: c,
}: SectionInstance<"work.project-chapters">) {
  return (
    <WorkSection id={id} code="M02" content={c}>
      <div className="de-work-chapters">
        {c.chapters.map((chapter, i) => (
          <article key={chapter.id}>
            <header>
              <span className="de-display">{number(i)}</span>
              <h3 className="de-heading">{chapter.title}</h3>
            </header>
            <div className="de-work-chapter-scene" data-fit={chapter.fit}>
              <ActionMedia group="chapters" itemId={chapter.id}><Plate image={chapter.scene} /></ActionMedia>
            </div>
            <div className="de-work-chapter-foot">
              <div><p className="de-text">{chapter.narrative}</p><ItemAction group="chapters" itemId={chapter.id}/></div>
              {chapter.evidence ? (
                <figure>
                  <Plate image={chapter.evidence.image} />
                  <figcaption className="de-mono">
                    {chapter.evidence.caption}
                  </figcaption>
                </figure>
              ) : null}
            </div>
            {chapter.scene.caption ? (
              <p className="de-mono">{chapter.scene.caption}</p>
            ) : null}
          </article>
        ))}
      </div>
    </WorkSection>
  );
}
