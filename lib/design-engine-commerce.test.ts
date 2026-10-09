import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  commerceStudies,
  commerceProposal,
} from "../design-engine/preview/collection-007/studies";
import {
  commerceContexts,
  contextProducts,
  makeCommerceModel,
} from "../design-engine/preview/collection-007/fixtures";
import {
  commerceStudySchemas,
  formatMoney,
  moneySchema,
  productSchema,
} from "../design-engine/preview/collection-007/contracts";
import { CommerceStudyPreview } from "../design-engine/preview/collection-007/Study";
import { designComponents } from "../design-engine/registry/components";

describe("Collection 007 creative-only commerce contracts", () => {
  it("keeps original studies independent from production registrations", () => {
    expect(designComponents).toHaveLength(126);
    expect(
      designComponents.filter((c) => c.status === "production"),
    ).toHaveLength(91);
    expect(designComponents.some((c) => c.id.startsWith("commerce-study."))).toBe(
      false,
    );
    expect(commerceStudies).toHaveLength(14);
    expect(
      new Set(commerceStudies.map((s) => s.typography[0])).size,
    ).toBeGreaterThanOrEqual(8);
    commerceStudies.forEach((s, i) => {
      expect(commerceProposal(s).runtimeRegistration).toBe(false);
      if (i)
        expect(s.typography[0]).not.toBe(commerceStudies[i - 1].typography[0]);
    });
    expect(commerceStudies.filter((s) => s.shortlist)).toHaveLength(6);
  });
  for (const study of commerceStudies)
    for (const [i, context] of commerceContexts.entries()) {
      it(`${study.id} / ${context.id}: validates authored and long-copy data and renders product semantics`, () => {
        for (const stress of ["authored", "long-copy", "no-media"] as const) {
          const model = makeCommerceModel(study.id, i, stress);
          expect(
            commerceStudySchemas[study.id].safeParse(model.content).success,
          ).toBe(true);
          const html = renderToStaticMarkup(
            createElement(CommerceStudyPreview, {
              study,
              adaptation: i,
              stress,
            }),
          );
          expect(html).toContain(`data-study="${study.id}"`);
          expect(html).toContain("<h2");
          expect(html).not.toContain('autoplay=""');
          expect(html).not.toContain('href="#"');
          if (stress === "no-media") expect(html).not.toContain("<img");
        }
      });
    }
  it("rejects inconsistent sale prices and unsafe destinations", () => {
    const p = contextProducts(0)[0];
    expect(
      productSchema.safeParse({
        ...p,
        compareAtPrice: { ...p.price, amountMinor: 1 },
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...p,
        compareAtPrice: { ...p.price, amountMinor: 99999, currency: "EUR" },
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...p,
        destination: { label: "Bad link", href: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
    expect(productSchema.safeParse({ ...p, inventory: 4 }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, media: [] }).success).toBe(true);
  });
  it("formats minor units using the currency exponent and labels price modes", () => {
    expect(
      formatMoney({ amountMinor: 1234, currency: "USD", mode: "fixed" }),
    ).toBe("$12.34");
    expect(
      formatMoney({ amountMinor: 1234, currency: "JPY", mode: "fixed" }),
    ).toBe("¥1,234");
    expect(
      formatMoney({ amountMinor: 1234, currency: "KWD", mode: "fixed" }),
    ).toContain("1.234");
    expect(
      formatMoney({ amountMinor: 0, currency: "USD", mode: "starting" }),
    ).toBe("From $0.00");
    expect(
      moneySchema.safeParse({
        amountMinor: 4,
        currency: "USD",
        mode: "subscription",
      }).success,
    ).toBe(false);
  });
  it("rejects unknown option values, duplicate variants, currency mismatch and comparison misalignment", () => {
    const m = makeCommerceModel("P12", 0);
    if (m.kind !== "P12") throw Error("wrong model");
    const v = m.content.variants[0];
    expect(
      commerceStudySchemas.P12.safeParse({
        ...m.content,
        variants: [
          { ...v, optionValues: { size: "unknown", finish: "finish-0" } },
        ],
      }).success,
    ).toBe(false);
    expect(
      commerceStudySchemas.P12.safeParse({
        ...m.content,
        variants: [v, { ...v, id: "duplicate" }],
      }).success,
    ).toBe(false);
    expect(
      commerceStudySchemas.P12.safeParse({
        ...m.content,
        variants: [{ ...v, price: { ...v.price, currency: "EUR" } }],
      }).success,
    ).toBe(false);
    const comparison = makeCommerceModel("P13", 0);
    if (comparison.kind !== "P13") throw Error("wrong model");
    expect(
      commerceStudySchemas.P13.safeParse({
        ...comparison.content,
        criteria: comparison.content.criteria.map((c) => ({
          ...c,
          values: c.values.slice(0, 2),
        })),
      }).success,
    ).toBe(false);
  });
});
