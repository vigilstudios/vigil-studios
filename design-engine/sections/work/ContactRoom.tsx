"use client";
import { ActionMedia } from "../../actions/SectionActions";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption, number } from "./shared";

/** M04: independent reusable structure; content and media belong to the caller. */
export function ContactRoom({
  id,
  content: c,
}: SectionInstance<"work.contact-room">) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, c.frames.length - 1);
  return (
    <WorkSection id={id} code="M04" content={c}>
      <div className="de-work-contact">
        <figure className="de-work-contact-selected" aria-live="polite">
          <ActionMedia group="frames" itemId={c.frames[active].id}><Plate image={c.frames[active].image} /></ActionMedia>
          <Caption record={c.frames[active]} index={active} />
        </figure>
        <div className="de-work-proof">
          <div
            className="de-work-selectors"
            role="group"
            aria-label="Select a frame"
          >
            {c.frames.map((record, i) => (
              <button
                key={record.id}
                type="button"
                aria-pressed={active === i}
                aria-label={`View ${number(i)}: ${record.title}`}
                aria-controls={`${id}-selection`}
                onClick={() => setSelected(i)}
              >
                <Plate image={record.thumbnail ?? record.image} thumbnail />
                <span className="de-mono">{number(i)}</span>
              </button>
            ))}
          </div>
          <p id={`${id}-selection`} className="de-mono" role="status">
            Selected frame {number(active)}: {c.frames[active].title}
          </p>
        </div>
      </div>
    </WorkSection>
  );
}
