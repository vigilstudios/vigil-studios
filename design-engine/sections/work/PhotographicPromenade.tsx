"use client";
import { ActionMedia } from "../../actions/SectionActions";
import { useRef } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { WorkSection, Plate, Caption } from "./shared";

/** M06: independent reusable structure; content and media belong to the caller. */
export function PhotographicPromenade({
  id,
  content: c,
}: SectionInstance<"work.photographic-promenade">) {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <WorkSection id={id} code="M06" content={c}>
      <div
        ref={rail}
        className="de-work-walk"
        role="region"
        aria-label={c.title}
        tabIndex={0}
      >
        {c.scenes.map((record, i) => (
          <figure key={record.id} tabIndex={-1}>
            <ActionMedia group="scenes" itemId={record.id}><Plate image={record.image} /></ActionMedia>
            <Caption record={record} index={i} />
          </figure>
        ))}
      </div>
      <div className="de-work-pagination">
        {[-1, 1].map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => {
              const node = rail.current;
              if (!node) return;
              const children = Array.from(node.children) as HTMLElement[];
              const x = node.scrollLeft;
              const nearest = children.reduce(
                (best, el, i) =>
                  Math.abs(el.offsetLeft - x) <
                  Math.abs(children[best].offsetLeft - x)
                    ? i
                    : best,
                0,
              );
              const next =
                children[
                  Math.max(0, Math.min(children.length - 1, nearest + delta))
                ];
              node.scrollTo({ left: next.offsetLeft, behavior: "instant" });
              next.focus({ preventScroll: true });
            }}
          >
            {delta === -1 ? "← Previous scene" : "Next scene →"}
          </button>
        ))}
      </div>
    </WorkSection>
  );
}
