"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { CommerceShell, ProductLink, Price, num } from "./shared";
import { Picture } from "./ProductPicture";
export function InspectionDesk({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.inspection-desk">) {
  const [selected, setSelected] = useState(0),
    uid = `${id}-selection`;
  const plate = content.gallery[Math.min(selected, content.gallery.length - 1)];
  const artwork = (
    <div className="de-commerce-desk">
      <figure id={uid} className="de-commerce-primary-media">
        <Picture treatment={treatment} key={plate.id} media={plate.media} />
        <figcaption aria-live="polite">
          <span>
            {num(selected)} / {plate.media.label}
          </span>
          {plate.caption}
        </figcaption>
      </figure>
      <div
        className="de-commerce-contact-sheet"
        role="group"
        aria-label="Choose product media"
      >
        {content.gallery.map((p, i) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={selected === i}
            aria-controls={uid}
            onClick={() => setSelected(i)}
          >
            <Picture treatment={treatment} media={p.media} compact />
            <span>
              {num(i)} /{" "}
              {p.media.kind === "image"
                ? "Still"
                : p.media.kind === "video"
                  ? "Film"
                  : "360° concept"}
            </span>
            <small>{p.media.label}</small>
          </button>
        ))}
      </div>
      <div className="de-commerce-desk-record">
        <h3>{content.product.title}</h3>
        <Price product={content.product} />
        <ProductLink product={content.product} />
      </div>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p10">
      {artwork}
    </CommerceShell>
  );
}
