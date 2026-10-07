import { ActionMedia, ItemAction } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, number } from "./shared";

/** M10: independent reusable structure; content and media belong to the caller. */
export function CampaignScore({
  id,
  content: c,
}: SectionInstance<"work.campaign-score">) {
  return (
    <WorkSection id={id} code="M10" content={c}>
      <div className="de-work-score">
        {c.chapters.map((chapter, i) => (
          <article key={chapter.id}>
            <h3 className="de-display">{chapter.phrase}</h3>
            <div className="de-work-score-band" data-fit={chapter.fit}>
              <ActionMedia group="chapters" itemId={chapter.id}><Plate image={chapter.image} /></ActionMedia>
              <span className="de-mono">{number(i)}</span>
            </div>
            <div className="de-work-score-foot">
              <div><p className="de-text">{chapter.narrative}</p><ItemAction group="chapters" itemId={chapter.id}/></div>
              <figure>
                <Plate image={chapter.counterImage ?? chapter.image} />
                {(chapter.counterImage ?? chapter.image).caption ? (
                  <figcaption className="de-mono">
                    {(chapter.counterImage ?? chapter.image).caption}
                  </figcaption>
                ) : null}
              </figure>
            </div>
          </article>
        ))}
      </div>
    </WorkSection>
  );
}
