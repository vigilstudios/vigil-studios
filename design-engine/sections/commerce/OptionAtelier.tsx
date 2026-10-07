"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import type { ProductVariant } from "../../commerce/types";
import {
  primaryMedia,
  resolveVariant,
  availabilityText as statusText,
} from "../../commerce/presentation";
import { CommerceShell, ProductLink, Price } from "./shared";
import { Picture } from "./ProductPicture";
export type OptionBinding = {
  selection?: Record<string, string>;
  onSelectionChange?: (
    choices: Record<string, string>,
    variant: ProductVariant | undefined,
  ) => void;
};
export function OptionAtelier({
  id,
  content,
  treatment,
  initialChoices,
  selection,
  onSelectionChange,
}: SectionInstance<"commerce.option-atelier"> & OptionBinding) {
  const [localChoices, setChoices] = useState<Record<string, string>>(
      () =>
        initialChoices ??
        Object.fromEntries(content.options.map((o) => [o.id, o.values[0].id])),
    ),
    uid = `${id}-selection`;
  const choices =
    selection ??
    Object.fromEntries(
      content.options.map((o) => [
        o.id,
        o.values.some((v) => v.id === localChoices[o.id])
          ? localChoices[o.id]
          : o.values[0].id,
      ]),
    );
  const variant = resolveVariant(content.options, content.variants, choices);
  const change = (optionId: string, valueId: string) => {
    const next = { ...choices, [optionId]: valueId };
    if (!selection) setChoices(next);
    onSelectionChange?.(
      next,
      resolveVariant(content.options, content.variants, next),
    );
  };
  const artwork = (
    <div className="de-commerce-atelier">
      <div className="de-commerce-option-object">
        <Picture treatment={treatment} media={primaryMedia(content.product)} />
        <h3>{content.product.title}</h3>
        <p>{content.product.description}</p>
      </div>
      <div className="de-commerce-option-workbook">
        {content.options.map((option) => (
          <fieldset key={option.id}>
            <legend>{option.name}</legend>
            <div>
              {option.values.map((value) => (
                <label className="de-commerce-option" key={value.id}>
                  <input
                    type="radio"
                    name={`${uid}-${option.id}`}
                    value={value.id}
                    checked={choices[option.id] === value.id}
                    onChange={() => change(option.id, value.id)}
                  />
                  <span>
                    {value.color && (
                      <i
                        aria-hidden="true"
                        style={{ background: value.color }}
                      />
                    )}
                    {value.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="de-commerce-variant-receipt" role="status">
          <small>Your selection</small>
          <p>
            {content.options
              .map(
                (o) =>
                  o.values.find((v) => v.id === choices[o.id])?.label ??
                  "Choose a value",
              )
              .join(" / ")}
          </p>
          {variant ? (
            <>
              <Price product={variant} />
              <span>{statusText[variant.availability]}</span>
            </>
          ) : (
            <strong>
              No matching variant. Choose a different combination.
            </strong>
          )}
        </div>
        <p className="de-commerce-guidance">{content.guidance}</p>
        <ProductLink
          product={{
            ...content.product,
            destination: variant?.destination ?? content.product.destination,
          }}
        />
      </div>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p12">
      {artwork}
    </CommerceShell>
  );
}
