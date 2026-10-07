"use client";
import { ItemAction } from "../../actions/SectionActions";

import { useEffect, useId, useRef, useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { Plate, number } from "./shared";

type Piece =
  SectionInstance<"work.viewport-gallery">["content"]["pieces"][number];

function GalleryPiece({ piece, index }: { piece: Piece; index: number }) {
  const uid = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && (hovered || focused || pinned);

  return (
    <article
      className="de-viewport-piece"
      data-fit={piece.fit}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setHovered(true);
          setDismissed(false);
        }
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (
          event.target !== button.current ||
          event.target.matches(":focus-visible")
        ) {
          setFocused(true);
          setDismissed(false);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          setPinned(false);
          setDismissed(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (event.target !== button.current) button.current?.focus();
          setPinned(false);
          setDismissed(true);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className="de-viewport-image-button"
        aria-label={`Details for ${piece.title}`}
        aria-expanded={visible}
        aria-controls={`${uid}-panel`}
        onClick={() => {
          setPinned(!pinned);
          setDismissed(pinned);
        }}
      >
        <Plate image={piece.image} loading={index < 2 ? "eager" : "lazy"} />
        <span className="de-viewport-number de-mono" aria-hidden="true">
          {number(index)} / {piece.category}
        </span>
        <span className="de-viewport-toggle" aria-hidden="true">
          {visible ? "−" : "+"}
        </span>
      </button>
      <div
        id={`${uid}-panel`}
        className="de-viewport-detail"
        role="region"
        aria-labelledby={`${uid}-title`}
        tabIndex={0}
        hidden={!visible}
      >
        <p className="de-mono">
          {piece.category} / {number(index)}
        </p>
        <h3 id={`${uid}-title`} className="de-heading">
          {piece.title}
        </h3>
        <p className="de-text">{piece.detail}</p><ItemAction group="pieces" itemId={piece.id}/>
        {piece.image.caption ? (
          <p className="de-mono">{piece.image.caption}</p>
        ) : null}
      </div>
    </article>
  );
}

/** M13 owns its gallery tools, never the host's primary navigation or routes. */
export function ViewportGallery({
  id,
  content,
}: SectionInstance<"work.viewport-gallery">) {
  const [selection, setSelection] = useState<string | null>(null);
  const categories = [
    ...new Set(content.pieces.map((piece) => piece.category)),
  ];
  const filter = selection && categories.includes(selection) ? selection : null;
  const pieces = content.pieces.filter(
    (piece) => filter === null || piece.category === filter,
  );
  const section = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  // Reserve the real bar height after fonts/category wrapping, including inside a scaled Lab.
  useEffect(() => {
    const bar = toolbar.current,
      host = section.current;
    if (!bar || !host) return;
    const measure = () =>
      host.style.setProperty(
        "--de-gallery-toolbar-height",
        `${bar.offsetHeight}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      id={id}
      className="de-viewport-gallery"
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="de-visually-hidden">
        {content.title}
      </h2>
      <div ref={toolbar} className="de-viewport-toolbar">
        <span className="de-accent de-viewport-label">{content.label}</span>
        <div
          role="group"
          aria-label="Gallery categories"
          className="de-viewport-filters"
        >
          <button
            type="button"
            aria-pressed={filter === null}
            onClick={() => setSelection(null)}
          >
            All pieces
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-label={`Filter category: ${category}`}
              aria-pressed={filter === category}
              onClick={() => setSelection(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <span
          className="de-mono de-viewport-count"
          role="status"
          aria-live="polite"
        >
          {String(pieces.length).padStart(2, "0")} pieces
        </span>
      </div>
      <div className="de-viewport-grid">
        {pieces.map((piece, index) => (
          <GalleryPiece key={piece.id} piece={piece} index={index} />
        ))}
      </div>
    </section>
  );
}
