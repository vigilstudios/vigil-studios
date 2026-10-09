"use client";
import { ControlIcon } from "@/design-engine/presentation/PresentationContext";
import { isVideoAsset } from "@/design-engine/media/source";
import { useRef, useState } from "react";
import type { SectionInstance } from "@/design-engine/composition/schemas";
import { useMotionPolicy } from "@/design-engine/motion/MotionPolicy";
import { Plate } from "@/design-engine/sections/work/shared";
import { ItemAction } from "@/design-engine/actions/SectionActions";
import {
  GalleryFrame,
  GalleryHeading,
  useGalleryInspection,
} from "./media-gallery-shared";
export function ImageGallery(section: SectionInstance<"work.image-gallery">) {
  const [selected, setSelected] = useState<string | null>(null),
    works = section.content.works;
  const rail = useRef<HTMLDivElement>(null),
    policy = useMotionPolicy();
  function center(id: string) {
    const host = rail.current;
    if (!host || host.scrollWidth <= host.clientWidth) return;
    const card = Array.from(host.children).find(
      (node) => (node as HTMLElement).dataset.record === id,
    ) as HTMLElement | undefined;
    if (card)
      host.scrollTo({
        left: card.offsetLeft - (host.clientWidth - card.clientWidth) / 2,
        behavior:
          policy.reduced || section.motion === "none" ? "instant" : "smooth",
      });
  }
  function choose(id: string) {
    setSelected(id);
    requestAnimationFrame(() => center(id));
  }
  const active = works.some((work) => work.id === selected) ? selected : null;
  const { inspect, modal } = useGalleryInspection(works);
  return (
    <GalleryFrame section={section} kind="strips">
      <GalleryHeading section={section} />
      <div
        ref={rail}
        className="vm-strips"
        role="group"
        aria-label="Expanding image gallery"
        onPointerLeave={() => setSelected(null)}
      >
        {works.map((work) => (
          <article
            key={work.id}
            className="vm-strip"
            data-record={work.id}
            onTransitionEnd={() => {
              if (active === work.id) center(work.id);
            }}
            data-active={active === work.id}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") choose(work.id);
            }}
          >
            <Plate image={work.image} />
            <button
              type="button"
              className="vm-strip-trigger"
              aria-label={`Select ${work.title}`}
              aria-pressed={active === work.id}
              onFocus={() => choose(work.id)}
              onClick={() => choose(work.id)}
            />
            <div className="vm-strip-caption">
              <h3>{work.title}</h3>
              {work.note && <p>{work.note}</p>}
              <div className="vm-card-actions">
                {section.inspection === "dialog" && (
                  <button
                    type="button"
                    className="vm-small-cta"
                    aria-label={`Inspect ${work.title}`}
                    onClick={(event) => inspect(work.id, event.currentTarget)}
                  >
                    <ControlIcon/> {isVideoAsset(work.image) ? "View video" : "View image"}
                  </button>
                )}
                <ItemAction
                  group="works"
                  itemId={work.id}
                  className="vm-small-cta"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
      {section.inspection === "dialog" && modal}
    </GalleryFrame>
  );
}
export default ImageGallery;
