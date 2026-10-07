"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption, number } from "./shared";

/** M12: independent reusable structure; content and media belong to the caller. */
export function LightTable({
  id,
  content: c,
}: SectionInstance<"work.light-table">) {
  const [well, setWell] = useState(0);
  const [pins, setPins] = useState([0, 1]);
  const activePins = pins.map((pin) => Math.min(pin, c.images.length - 1));
  return (
    <WorkSection id={id} code="M12" content={c}>
      <div className="de-work-wells">
        {activePins.map((pin, i) => (
          <div key={i}>
            <button
              type="button"
              aria-pressed={well === i}
              onClick={() => setWell(i)}
              className="de-work-well-button"
            >
              {i === 0 ? "A / Left well" : "B / Right well"}
            </button>
            <figure>
              <Plate image={c.images[pin].image} />
              <Caption record={c.images[pin]} index={pin} />
            </figure>
          </div>
        ))}
      </div>
      <p className="de-text" role="status">
        Choose an image for the {well === 0 ? "left" : "right"} well. Left:{" "}
        {c.images[activePins[0]].title}. Right: {c.images[activePins[1]].title}.
      </p>
      <div className="de-work-tray" role="group" aria-label="Media source tray">
        {c.images.map((record, i) => (
          <button
            key={record.id}
            type="button"
            aria-label={`Place ${record.title} in ${well === 0 ? "left" : "right"} well`}
            aria-pressed={activePins[well] === i}
            onClick={() =>
              setPins((previous) =>
                previous.map((value, index) => (index === well ? i : value)),
              )
            }
          >
            <Plate image={record.thumbnail ?? record.image} thumbnail />
            <span className="de-mono">
              {number(i)} / {record.title}
            </span>
          </button>
        ))}
      </div>
    </WorkSection>
  );
}
