"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { VigilIcon } from "../../icons/VigilIcon";
import { CommerceShell, ProductRecord, num } from "./shared";
import { Picture } from "./ProductPicture";
export function LookObjects({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.look-objects">) {
  const [lookIndex, setLook] = useState(0),
    [item, setItem] = useState(0),
    uid = `${id}-selection`;
  const look = content.looks[Math.min(lookIndex, content.looks.length - 1)],
    selectedItem = look.items[Math.min(item, look.items.length - 1)],
    product = content.products.find(
      (p) => p.productId === selectedItem.productId,
    )!;
  const artwork = (
    <div className="de-commerce-look">
      <div
        className="de-commerce-choice-line"
        role="group"
        aria-label="Choose a look"
      >
        {content.looks.map((l, i) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={i === lookIndex}
            onClick={() => {
              setLook(i);
              setItem(0);
            }}
          >
            {num(i)} / {l.title}
          </button>
        ))}
      </div>
      <figure className="de-commerce-look-scene">
        <Picture
          treatment={treatment}
          key={look.id}
          media={look.campaignMedia}
        />
        <figcaption>{look.caption}</figcaption>
      </figure>
      <div className="de-commerce-look-legend">
        <p className="de-commerce-kicker">The objects in this edit</p>
        <div
          className="de-commerce-look-choices"
          role="group"
          aria-label="Explore the look’s products"
        >
          {look.items.map((entry, i) => (
            <button
              key={entry.productId}
              type="button"
              aria-pressed={item === i}
              aria-controls={uid}
              onClick={() => setItem(i)}
            >
              <span>{num(i)}</span>
              <span>
                {
                  content.products.find((p) => p.productId === entry.productId)!
                    .title
                }
                <small>{entry.role}</small>
              </span>
              <VigilIcon decorative name="arrow-right" size={18} />
            </button>
          ))}
        </div>
        <div id={uid} className="de-commerce-look-selected">
          <p className="de-commerce-kicker" role="status">
            Selected / {product.title}
          </p>
          <p>{selectedItem.role}</p>
          <ProductRecord product={product} description />
        </div>
      </div>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p06">
      {artwork}
    </CommerceShell>
  );
}
