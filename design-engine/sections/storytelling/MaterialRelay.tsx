import { SectionActions } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
export function MaterialRelay({
  id,
  content: c,
}: SectionInstance<"story.material-relay">) {
  return (
    <section
      id={id}
      className="de-story de-material-relay"
      aria-labelledby={`${id}-title`}
    >
      <header className="de-story-intro">
        <h2 id={`${id}-title`} className="de-heading">
          {c.title}
        </h2>
        <p className="de-text">{c.introduction}</p>
      </header>
      <ol>
        {c.stages.map((stage, i) => (
          <li key={i}>
            <TreatedImage
              image={stage.image}
              treatment={{ geometry: "portrait-emphasis", tone: "natural" }}
            />
            <h3 className="de-display">
              {stage.verb}
              <span aria-hidden="true">↗</span>
            </h3>
            <p className="de-accent">
              0{i + 1} / {stage.title}
            </p>
            <p className="de-text">{stage.responsibility}</p>
          </li>
        ))}
      </ol>
    <SectionActions/></section>
  );
}
