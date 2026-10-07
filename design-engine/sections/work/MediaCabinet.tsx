"use client";
import { SectionVideoPlayer } from "../../media/VideoPlayer";
import { ItemAction } from "../../actions/SectionActions";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, number } from "./shared";

/** M11: independent reusable structure; content and media belong to the caller. */
export function MediaCabinet({
  id,
  content: c,
}: SectionInstance<"work.media-cabinet">) {
  const [selected, setSelected] = useState<string | null>(null);
  const categories = [...new Set(c.records.map((record) => record.category))];
  const filter = selected && categories.includes(selected) ? selected : null;
  const records = c.records.filter(
    (record) => filter === null || record.category === filter,
  );
  return (
    <WorkSection id={id} code="M11" content={c}>
      <div
        className="de-work-filters"
        role="group"
        aria-label="Filter media by subject"
      >
        <button
          type="button"
          aria-pressed={filter === null}
          onClick={() => setSelected(null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={filter === category}
            onClick={() => setSelected(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <p role="status" className="de-mono">
        {records.length} records / {filter ?? "All"}
      </p>
      <div className="de-work-cabinet">
        {records.map((record) => (
          <article key={record.id} data-kind={record.kind}>
            <header>
              <span className="de-display">
                {number(c.records.indexOf(record))}
              </span>
              <span className="de-mono">{record.kind}</span>
            </header>
            {record.kind === "image" ? (
              <Plate image={record.image} />
            ) : (
              <SectionVideoPlayer key={record.video.src} video={record.video}/>

            )}
            <h3 className="de-heading">{record.title}</h3><ItemAction group="records" itemId={record.id}/>
            {record.note ? <p className="de-text">{record.note}</p> : null}
            {record.kind === "video" ? (
              <details>
                <summary>Transcript: {record.title}</summary>
                <p className="de-text">{record.video.transcript}</p>
              </details>
            ) : record.image.caption ? (
              <p className="de-mono">{record.image.caption}</p>
            ) : null}
          </article>
        ))}
      </div>
    </WorkSection>
  );
}
