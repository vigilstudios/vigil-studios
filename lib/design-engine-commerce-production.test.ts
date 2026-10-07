import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync } from "node:fs";
import {
  commerceSectionIds,
  commerceContracts,
} from "../design-engine/composition/commerce-contracts";
import { commerceContentSchemas } from "../design-engine/composition/commerce-schemas";
import { makeCommerceSection } from "../design-engine/preview/commerce-fixtures";
import { makeCommerceBounds } from "../design-engine/preview/commerce-bounds";
import {
  productSchema,
  productSummarySchema,
  productIdentitySchema,
  moneySchema,
  mediaSchema,
  destinationSchema,
} from "../design-engine/commerce/types";
import {
  formatMoney,
  primaryMedia,
  resolveVariant,
} from "../design-engine/commerce/presentation";
import { parseSection } from "../design-engine/composition/schemas";
import { renderSection } from "../design-engine/composition/render";
import { validateSectionContract } from "../design-engine/composition/contract-validation";
import {
  collection007Review,
  collection004Review,
  collection005Review,
} from "../design-engine/registry/creative-review";
import type { DesignComponentDefinition } from "../design-engine/registry/types";
import { designComponents } from "../design-engine/registry/components";
import { promoteCollectionSection } from "../design-engine/registry/collection-promotion";
import { compositionFixtures } from "../design-engine/preview/composition/fixtures";
import {
  inspectComposition,
  compositionTransitionNotices,
} from "../design-engine/composition/validation";
const markup = (id: (typeof commerceSectionIds)[number]) =>
  renderToStaticMarkup(
    createElement(
      "div",
      null,
      renderSection(makeCommerceSection(id, "commerce")),
    ),
  );
describe("Pass 007 commerce production boundaries", () => {
  it("preserves every human disposition and independent merchandising identity", () => {
    expect(
      Object.values(collection007Review).every((r) => r.status === "Approved"),
    ).toBe(true);
    expect(collection004Review.S04.status).toBe(
      "Promising / Revision Required",
    );
    expect(collection004Review.S05.status).toBe("Rejected");
    expect(collection005Review.M03.status).toBe("Revision required");
    expect(commerceSectionIds).toHaveLength(14);
    expect(new Set(commerceSectionIds).size).toBe(14);
    for (const id of commerceSectionIds) {
      const entry = designComponents.find(
        (c) => c.id === id,
      )! as DesignComponentDefinition;
      expect(entry.status).toBe("production");
      expect(entry.version).toBe("1.0.0");
      expect(entry.sourceConcept).toMatch(/^P\d{2}$/);
      expect(entry.composition).toBe(commerceContracts[id]);
      expect(validateSectionContract(commerceContracts[id])).toEqual([]);
      expect(entry.composition?.commerce?.providerBoundary).toBe(
        "normalized-presentation",
      );
    }
    const entry = designComponents.find((c) => c.id === commerceSectionIds[0])!;
    expect(() =>
      promoteCollectionSection({ ...entry, status: "experimental" }),
    ).toThrow(/current-pass/);
  });
  for (const id of commerceSectionIds)
    for (const adaptation of ["apparel", "beauty", "audio"])
      it(`${id} / ${adaptation} accepts finite extremes and changes media`, () => {
        for (const stress of [
          "authored",
          "minimum",
          "maximum",
          "no-media",
          "portrait",
          "landscape",
        ]) {
          const section = makeCommerceBounds(
            id,
            "commerce",
            adaptation,
            "long",
            stress,
          );
          expect(() => parseSection(section)).not.toThrow();
          const html = renderToStaticMarkup(
            createElement("div", null, renderSection(section)),
          );
          expect(html).toContain('id="commerce"');
          expect(html).toContain("<h2");
          expect(html).not.toMatch(
            /autoplay|Lab destination preview|Shopify|Add to cart/,
          );
        }
      });
  it("uses narrower contracts and normalized price/media semantics", () => {
    const s = makeCommerceSection("commerce.object-pedestal", "object");
    const p = s.content.product;
    expect(productSummarySchema.safeParse(p).success).toBe(true);
    expect(
      productSchema.safeParse({
        ...p,
        specifications: s.content.specifications,
        inventory: 12,
      }).success,
    ).toBe(false);
    expect(
      productIdentitySchema.safeParse({
        productId: p.productId,
        title: p.title,
        destination: p.destination,
        media: [],
      }).success,
    ).toBe(true);
    expect(
      productSummarySchema.safeParse({
        ...p,
        compareAtPrice: { ...p.price, amountMinor: 0 },
      }).success,
    ).toBe(false);
    for (const currency of ["CAD", "AUD", "CHF", "INR", "JPY", "KWD"]) {
      expect(moneySchema.safeParse({ ...p.price, currency }).success).toBe(
        true,
      );
    }
    expect(
      formatMoney({ amountMinor: 1234, currency: "JPY", mode: "fixed" }),
    ).toBe("¥1,234");
    expect(
      formatMoney({ amountMinor: 1234, currency: "KWD", mode: "fixed" }),
    ).toContain("1.234");
    expect(
      moneySchema.safeParse({
        amountMinor: 1,
        currency: "USD",
        mode: "subscription",
      }).success,
    ).toBe(false);
    expect(
      moneySchema.safeParse({ amountMinor: 1, currency: "ZZZ", mode: "fixed" })
        .success,
    ).toBe(false);
    for (const href of [
      "javascript:alert(1)",
      "//bad.test",
      "/\\evil.test",
      "https://example.com/\n",
    ])
      expect(destinationSchema.safeParse({ label: "View", href }).success).toBe(
        false,
      );
    expect(
      primaryMedia({
        ...p,
        media: [
          { ...p.media[0], id: "secondary", role: "secondary" },
          { ...p.media[0], id: "main", role: "primary" },
        ],
      })?.id,
    ).toBe("main");
    expect(
      productSummarySchema.safeParse({
        ...p,
        media: [
          { ...p.media[0], id: "one", role: "primary" },
          { ...p.media[0], id: "two", role: "primary" },
        ],
      }).success,
    ).toBe(false);
    expect(
      mediaSchema.safeParse({
        ...p.media[0],
        image: { src: "/object.webp", alt: "", width: 100, height: 100 },
      }).success,
    ).toBe(false);
  });
  it("rejects orphaned looks, drifted comparison values and invalid option combinations", () => {
    const look = makeCommerceSection("commerce.look-objects", "look");
    look.content.looks[0].items[0].productId = "missing";
    expect(() => parseSection(look)).toThrow(/reference/);
    const comparison = makeCommerceSection(
      "commerce.comparison-bench",
      "bench",
    );
    comparison.content.criteria[0].values = { missing: "Unknown" };
    expect(() => parseSection(comparison)).toThrow(/aligned/);
    const options = makeCommerceSection("commerce.option-atelier", "options");
    const { content } = options;
    expect(
      resolveVariant(content.options, content.variants, {
        size: "size-2",
        finish: "finish-1",
      }),
    ).toBeUndefined();
    expect(
      resolveVariant(content.options, content.variants, {
        size: "size-1",
        finish: "finish-1",
      })?.availability,
    ).toBe("unavailable");
    expect(() =>
      parseSection({ ...options, initialChoices: { size: "missing" } }),
    ).toThrow(/Initial choices/);
    expect(
      commerceContentSchemas[options.component].safeParse({
        ...content,
        variants: [
          content.variants[0],
          { ...content.variants[0], id: "duplicate" },
        ],
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...content.product,
        options: content.options,
        variants: [
          { ...content.variants[0], optionValues: { bogus: "bogus" } },
        ],
      }).success,
    ).toBe(false);
  });
  it("keeps catalog results and controls independent of a provider", () => {
    const ledger = makeCommerceSection("commerce.catalog-ledger", "ledger");
    expect(() =>
      parseSection({
        ...ledger,
        content: {
          ...ledger.content,
          products: [],
          catalog: {
            ...ledger.content.catalog,
            scope: "host-results",
            resultCount: 0,
          },
        },
      }),
    ).not.toThrow();
    expect(() =>
      parseSection({
        ...ledger,
        content: {
          ...ledger.content,
          catalog: {
            ...ledger.content.catalog,
            selected: { filters: { unknown: ["unknown"] }, sort: "unknown" },
          },
        },
      }),
    ).toThrow(/declared/);
    const foreign = {
      ...ledger.content.products[0],
      productId: "foreign",
      price: { ...ledger.content.products[0].price, currency: "JPY" },
    };
    expect(() =>
      parseSection({
        ...ledger,
        content: {
          ...ledger.content,
          products: [...ledger.content.products, foreign],
          catalog: {
            ...ledger.content.catalog,
            sorts: [{ id: "ascending", label: "Price" }],
            selected: { filters: {}, sort: "ascending" },
          },
        },
      }),
    ).toThrow(/shared price/);
  });
  it("retains accessible media controls, native links, radios and stable comparison semantics", () => {
    expect(markup("commerce.inspection-desk")).toContain(
      'aria-controls="commerce-selection"',
    );
    expect(markup("commerce.inspection-desk")).toContain('aria-pressed="true"');
    expect(markup("commerce.look-objects")).toContain('role="status"');
    expect(markup("commerce.option-atelier")).toContain('type="radio"');
    expect(markup("commerce.comparison-bench")).toContain('scope="row"');
    expect(markup("commerce.merchant-edit")).toContain(
      'href="https://example.com/',
    );
    expect(markup("commerce.collection-atlas")).not.toContain('href="#');
  });
  it("adds mixed cross-collection QA compositions and capability-derived seams", () => {
    const pages = compositionFixtures.filter((p) =>
      p.id.startsWith("commerce-"),
    );
    expect(pages).toHaveLength(28);
    for (const page of pages) {
      expect(inspectComposition(page).issues).toEqual([]);
      expect(page.sections.some((s) => s.component.startsWith("story."))).toBe(
        true,
      );
    }
    const section = makeCommerceSection("commerce.catalog-ledger", "catalog");
    const comparison = makeCommerceSection(
      "commerce.comparison-bench",
      "bench",
    );
    expect(
      compositionTransitionNotices({
        ...pages[0],
        sections: [section, comparison],
      }).some((n) => n.code === "density-transition"),
    ).toBe(true);
  });
  it("keeps runtime implementations free of fixtures, providers and client identity", () => {
    for (const file of readdirSync("design-engine/sections/commerce").filter(
      (f) => f.endsWith(".tsx"),
    )) {
      const source = readFileSync(
        `design-engine/sections/commerce/${file}`,
        "utf8",
      );
      expect(source).not.toMatch(
        /from ["'].*preview|design-engine-study|Shopify|supabase|stripe|Collection \/ 007/,
      );
    }
  });
});
