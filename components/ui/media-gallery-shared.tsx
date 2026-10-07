"use client";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { SectionInstance } from "@/design-engine/composition/schemas";
import type { PhotoRecord } from "@/design-engine/composition/collection-schemas";
import { Plate } from "@/design-engine/sections/work/shared";
import {
  ItemAction,
  SectionActions,
} from "@/design-engine/actions/SectionActions";
import { useMotionPolicy } from "@/design-engine/motion/MotionPolicy";
import "./media-galleries.css";
export type MediaGallerySection = SectionInstance<
  | "work.image-expansion"
  | "work.image-gallery"
  | "work.apple-cards"
  | "work.liquid-glass"
>;
export function GalleryFrame({
  section,
  kind,
  children,
  style,
}: {
  section: MediaGallerySection;
  kind: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const policy = useMotionPolicy();
  return (
    <section
      id={section.id}
      className={`vigil-media vm-${kind}`}
      data-skin={section.skin}
      data-align={section.alignment}
      data-density={section.density}
      data-surface={section.surface}
      data-motion={section.motion !== "none" && !policy.reduced}
      data-height={"height" in section ? section.height : undefined}
      aria-labelledby={`${section.id}-title`}
      style={
        {
          "--vm-duration": `${0.5 * policy.duration}s`,
          ...style,
        } as CSSProperties
      }
    >
      <div className="vm-inner">{children}</div>
    </section>
  );
}
export function GalleryHeading({ section }: { section: MediaGallerySection }) {
  return (
    <header className="vm-heading">
      {section.content.eyebrow && (
        <p className="vm-eyebrow">{section.content.eyebrow}</p>
      )}
      <h2 id={`${section.id}-title`}>{section.content.title}</h2>
      <p>{section.content.introduction}</p>
      <SectionActions />
    </header>
  );
}
export function StepButton({
  direction,
  onClick,
  disabled = false,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="vm-round"
      aria-label={`${direction === "next" ? "Next" : "Previous"} image`}
      onClick={onClick}
      disabled={disabled}
    >
      {direction === "next" ? (
        <ArrowRight size={16} />
      ) : (
        <ArrowLeft size={16} />
      )}
    </button>
  );
}
/** Native top-layer dialog supplies focus trapping, Escape and inert background. */
export function useGalleryInspection(works: PhotoRecord[]) {
  const uid = useId();
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const index = Math.max(
    0,
    works.findIndex((work) => work.id === selected),
  );
  const work = works[index];
  function inspect(id: string, trigger: HTMLElement) {
    opener.current = trigger;
    setSelected(id);
    dialog.current?.showModal();
  }
  const modal = (
    <dialog
      ref={dialog}
      className="vm-dialog"
      aria-labelledby={`${uid}-inspection-title`}
      onClose={() => opener.current?.focus()}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          setSelected(
            works[
              (index + (event.key === "ArrowRight" ? 1 : works.length - 1)) %
                works.length
            ].id,
          );
        }
      }}
    >
      <button
        type="button"
        autoFocus
        className="vm-round vm-close"
        aria-label="Close image inspection"
        onClick={() => dialog.current?.close()}
      >
        <X size={20} />
      </button>
      <div className="vm-dialog-content">
        <Plate image={work.image} />
        <h3 id={`${uid}-inspection-title`}>{work.title}</h3>
        {work.note && <p>{work.note}</p>}
        <ItemAction group="works" itemId={work.id} />
        <div className="vm-controls">
          <StepButton
            direction="previous"
            onClick={() =>
              setSelected(works[(index + works.length - 1) % works.length].id)
            }
          />
          <p role="status">
            {index + 1} of {works.length}
          </p>
          <StepButton
            direction="next"
            onClick={() => setSelected(works[(index + 1) % works.length].id)}
          />
        </div>
      </div>
    </dialog>
  );
  return { inspect, modal };
}
