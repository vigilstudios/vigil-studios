import type {
  Money,
  ProductSummary,
  ProductOption,
  ProductVariant,
  ProductMedia,
} from "./types";
export const availabilityText = {
  available: "Available",
  unavailable: "Unavailable",
  preorder: "Pre-order",
  unknown: "Availability not supplied",
};
export function formatMoney(price: Money, locale = "en-US") {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
  });
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return `${price.mode === "starting" ? "From " : ""}${formatter.format(price.amountMinor / 10 ** exponent)}${price.interval ? ` / ${price.interval}` : ""}`;
}
export function primaryMedia(
  product: Pick<ProductSummary, "media">,
): ProductMedia | undefined {
  return product.media.find((m) => m.role === "primary") ?? product.media[0];
}
export function resolveVariant(
  options: readonly ProductOption[],
  variants: readonly ProductVariant[],
  choices: Readonly<Record<string, string>>,
) {
  return variants.find((v) =>
    options.every((o) => v.optionValues[o.id] === choices[o.id]),
  );
}
