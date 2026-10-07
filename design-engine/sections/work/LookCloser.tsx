"use client";
import { ItemAction } from "../../actions/SectionActions";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption, number } from "./shared";

/** M09: independent reusable structure; content and media belong to the caller. */
export function LookCloser({
  id,
  content: c,
}: SectionInstance<"work.look-closer">) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, c.pairs.length - 1);
  const pair = c.pairs[active];
  return (
    <WorkSection id={id} code="M09" content={c}>
      <div className="de-work-look" aria-live="polite">
        <figure className="de-work-look-main">
          <Plate image={pair.overview.image} />
          <Caption record={pair.overview} index={active} />
        </figure>
        <div className="de-work-look-side">
          <p className="de-display">{number(active)}</p>
          <p className="de-accent">{pair.relationship}</p><ItemAction group="pairs" itemId={pair.id}/>
          <figure>
            <Plate image={pair.companion.image} />
            <Caption record={pair.companion} index={active} />
          </figure>
        </div>
      </div>
      <div
        className="de-work-pairs"
        role="group"
        aria-label="Authored image pairs"
      >
        {c.pairs.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={active === i}
            onClick={() => setSelected(i)}
          >
            {number(i)} / {p.overview.title}
          </button>
        ))}
      </div>
      <p className="de-mono" role="status">
        Selected pair {number(active)}: {pair.relationship}
      </p>
    </WorkSection>
  );
}
