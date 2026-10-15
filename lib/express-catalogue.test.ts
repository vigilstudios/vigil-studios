import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";
import { CREATOR_CAMPAIGN } from "@/lib/creator-campaign";
import type { ExpressTemplate } from "@/lib/vigil/express/document";

const template = (industry: string, slug: string): ExpressTemplate => ({ industry, slug, variant: "First", example: `${industry} example`, accent: "#324b42", description: "", status: "available" });
const templates = [template("Restaurant", "restaurant"), template("Creator", "creator")];

describe("Express catalogue creator offer", () => {
  it("promotes Creator without mutating the published catalogue and redeems the displayed deal", () => {
    const html = renderToStaticMarkup(createElement(ExpressCatalogue, { templates, amountCents: 59900, preference: { plan: "care", period: "year" } }));
    expect(html.indexOf('<span>Creator</span>')).toBeLessThan(html.indexOf('<span>Restaurant</span>'));
    expect(templates[0].industry).toBe("Restaurant");
    expect(html).toContain(`${CREATOR_CAMPAIGN.promotion.percentOff}% off`);
    expect(html).toContain('Buy · $509.15');
    expect(html).toContain('template=creator');
    expect(html).toContain('promo=INFLUENCE');
    expect(html).toContain('plan=care');
    expect(html).toContain('period=year');
  });

  it("keeps ordinary designs at base price unless a valid promotion was supplied", () => {
    const regular = [templates[0]];
    for (const promoCode of [undefined, "OTHER"]) {
      const html = renderToStaticMarkup(createElement(ExpressCatalogue, { templates: regular, amountCents: 59900, promoCode }));
      expect(html).toContain('Buy · $599');
      expect(html).not.toContain('promo=INFLUENCE');
    }
    const html = renderToStaticMarkup(createElement(ExpressCatalogue, { templates: regular, amountCents: 59900, promoCode: "INFLUENCE" }));
    expect(html).toContain('Buy · $509.15');
    expect(html).toContain('promo=INFLUENCE');
  });

  it("does not invent a deal price when the catalogue amount is unavailable", () => {
    const html = renderToStaticMarkup(createElement(ExpressCatalogue, { templates }));
    expect(html).not.toContain('Buy · $');
  });
});
