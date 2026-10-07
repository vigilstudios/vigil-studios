"use client";
import { ActionMedia, ItemAction } from "../../actions/SectionActions";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Pagination, number } from "./shared";

/** M08: independent reusable structure; content and media belong to the caller. */
export function CampaignFolio({
  id,
  content: c,
}: SectionInstance<"work.campaign-folio">) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, c.spreads.length - 1);
  const spread = c.spreads[active];
  return (
    <WorkSection id={id} code="M08" content={c}>
      <div className="de-work-book" aria-live="polite">
        <figure className="de-work-book-left">
          <ActionMedia group="spreads" itemId={spread.id}><Plate image={spread.principal.image} /></ActionMedia>
          <figcaption className="de-mono">
            {number(active)} / {spread.principal.title}
            {spread.principal.image.caption
              ? ` · ${spread.principal.image.caption}`
              : ""}
          </figcaption>
        </figure>
        <div className="de-work-book-right">
          <h3 className="de-display">{spread.title}</h3>
          <p className="de-text">{spread.essay}</p><ItemAction group="spreads" itemId={spread.id}/>
          {spread.facing ? (
            <figure>
              <Plate image={spread.facing.image} />
              <figcaption className="de-mono">
                {spread.facing.title}
                {spread.facing.image.caption
                  ? ` · ${spread.facing.image.caption}`
                  : ""}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>
      <Pagination
        active={active}
        count={c.spreads.length}
        label="spread"
        onChange={setSelected}
      />
    </WorkSection>
  );
}
