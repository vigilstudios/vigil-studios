"use client";
import { ActionMedia } from "../../actions/SectionActions";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption, Pagination } from "./shared";

/** M05: independent reusable structure; content and media belong to the caller. */
export function ScreeningRoom({
  id,
  content: c,
}: SectionInstance<"work.screening-room">) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, c.frames.length - 1);
  return (
    <WorkSection id={id} code="M05" content={c}>
      <div className="de-work-screening">
        <figure aria-live="polite">
          <ActionMedia group="frames" itemId={c.frames[active].id}><Plate image={c.frames[active].image} /></ActionMedia>
          <Caption record={c.frames[active]} index={active} />
        </figure>
        <Pagination
          active={active}
          count={c.frames.length}
          label="frame"
          onChange={setSelected}
        />
      </div>
    </WorkSection>
  );
}
