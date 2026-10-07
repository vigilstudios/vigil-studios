"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { primaryMedia } from "../../commerce/presentation";
import { CommerceShell, ProductLink, num } from "./shared";
import { Picture } from "./ProductPicture";
export function MaterialAnatomy({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.material-anatomy">) {
  const [selected, setSelected] = useState(0),
    uid = `${id}-selection`;
  const detail =
    content.materials[Math.min(selected, content.materials.length - 1)];
  const artwork = (
    <div className="de-commerce-anatomy">
      <aside>
        <Picture treatment={treatment} media={primaryMedia(content.product)} />
        <small>Object reference / {content.product.title}</small>
        <ProductLink product={content.product} />
      </aside>
      <div className="de-commerce-inspection">
        <div
          className="de-commerce-choice-line"
          role="group"
          aria-label="Inspect a material"
        >
          {content.materials.map((m, i) => (
            <button
              type="button"
              key={m.id}
              aria-pressed={i === selected}
              aria-controls={uid}
              onClick={() => setSelected(i)}
            >
              {num(i)} / {m.name}
            </button>
          ))}
        </div>
        <div id={uid}>
          <Picture treatment={treatment} key={detail.id} media={detail.media} />
          <div className="de-commerce-material-copy">
            <h3 aria-live="polite">{detail.name}</h3>
            <p>{detail.detail}</p>
            <small>{detail.evidence}</small>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p08">
      {artwork}
    </CommerceShell>
  );
}
