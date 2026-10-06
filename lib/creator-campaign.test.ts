import { describe, expect, it } from "vitest";
import { campaignAttribution, campaignHref } from "./campaign-attribution";
import { CREATOR_CAMPAIGN, creatorBuildOffer, creatorCodeOffer, creatorCampaignSchema, creatorPromoHref } from "./creator-campaign";

describe("creator campaign routing and attribution", () => {
  const attribution = campaignAttribution("?utm_source=creator&utm_campaign=launch&ref=muse&email=private@example.com&gclid=private", "creators");
  it("retains approved attribution keys and excludes unrelated/personal query parameters", () => {
    expect(attribution).toEqual({ campaign: "creators", utm_source: "creator", utm_campaign: "launch", ref: "muse" });
    expect(campaignAttribution(`?utm_term=${"x".repeat(150)}`, "creators").utm_term?.length).toBe(100);
  });
  it("keeps Express template and Professional build selectors through attribution", () => {
    expect(campaignHref("/checkout?template=restaurant", attribution)).toContain("template=restaurant&vigil_campaign=creators");
    expect(campaignHref("/checkout?build=professional", attribution)).toContain("build=professional&vigil_campaign=creators");
  });
  it("preserves offer anchors and explicit destination UTMs", () => {
    const href = campaignHref("/creators?utm_source=explicit#choose-your-site", attribution);
    expect(href).toContain("utm_source=explicit");
    expect(href).toMatch(/#choose-your-site$/);
    expect(campaignHref(href, attribution)).toBe(href);
  });
  it("does not attach our campaign data to external client sites or normal visits", () => {
    expect(campaignHref("https://creator.example/work", attribution)).toBe("https://creator.example/work");
    expect(campaignHref("//other.example", attribution)).toBe("//other.example");
    expect(campaignHref("/checkout?build=professional", null)).toBe("/checkout?build=professional");
  });
  it("routes only to existing package entry points with the authorized creator promotion", () => {
    expect(CREATOR_CAMPAIGN.actions.express.href).toBe("/express");
    expect(CREATOR_CAMPAIGN.actions.professional.href).toBe("/professional");
    expect(CREATOR_CAMPAIGN.promotion).toMatchObject({ enabled: true, percentOff: 15, code: "INFLUENCE" });
    expect(CREATOR_CAMPAIGN.showcase).toBeNull();
  });
  it("carries the published code from promotion CTAs through both package flows", () => {
    expect(creatorPromoHref("/express", "", "creators")).toBe("/express?promo=INFLUENCE");
    expect(creatorPromoHref("/professional", "", "creators")).toBe("/professional?promo=INFLUENCE");
    expect(creatorPromoHref("/checkout?template=restaurant#details", "?promo=INFLUENCE")).toBe("/checkout?template=restaurant&promo=INFLUENCE#details");
    expect(creatorPromoHref("/checkout?build=professional", "?promo=influence&plan=basic")).toBe("/checkout?build=professional&promo=INFLUENCE");
  });
  it("does not turn attribution, unrelated links or staff orders into promo entry points", () => {
    for (const search of ["", "?vigil_campaign=creators", "?utm_campaign=creators", "?promo=WRONG"]) {
      expect(creatorPromoHref("/checkout?build=professional", search)).toBe("/checkout?build=professional");
    }
    for (const href of ["/checkout/trusted-token", "/pricing", "/creators#choose-your-site", "https://other.example/checkout", "//other.example/checkout"]) {
      expect(creatorPromoHref(href, "?promo=INFLUENCE", "creators")).toBe(href);
    }
    expect(creatorPromoHref("/checkout?build=professional&promo=OTHER", "?promo=INFLUENCE")).toBe("/checkout?build=professional&promo=OTHER");
  });
  it("rejects unsafe/dead configured CTA destinations and invalid showcase links", () => {
    for (const href of ["#", "", "javascript:alert(1)", "//evil.example", "http://insecure.example"]) {
      expect(creatorCampaignSchema.safeParse({ ...CREATOR_CAMPAIGN, actions: { ...CREATOR_CAMPAIGN.actions, express: { ...CREATOR_CAMPAIGN.actions.express, href } } }).success).toBe(false);
    }
    expect(creatorCampaignSchema.safeParse({ ...CREATOR_CAMPAIGN, showcase: { name: "Creator", description: "The work", image: "/creators/project.webp", imageAlt: "Creator homepage", siteUrl: "https://creator.example" } }).success).toBe(true);
  });
});

describe("creator build promotion", () => {
  it("requires explicit valid redemption instead of automatically discounting a purchase", () => {
    for (const code of [undefined, null, "", "creators", "WRONG"]) {
      expect(creatorCodeOffer("express", 59900, code)).toMatchObject({ amountCents: 59900, discountCents: 0, percentOff: null });
    }
    expect(creatorCodeOffer("express", 59900, " influence ").amountCents).toBe(50915);
    expect(creatorCodeOffer("professional", 149900, "INFLUENCE").amountCents).toBe(127415);
    expect(creatorCodeOffer("custom", 350000, "INFLUENCE").amountCents).toBe(350000);
    expect(creatorCodeOffer("basic", 2900, "INFLUENCE").amountCents).toBe(2900);
  });

  it("discounts only Express and Professional in integer cents", () => {
    expect(creatorBuildOffer("express", 59900)).toMatchObject({ amountCents: 50915, originalAmountCents: 59900, discountCents: 8985, percentOff: 15 });
    expect(creatorBuildOffer("professional", 149900).amountCents).toBe(127415);
    expect(creatorBuildOffer("express", 143).amountCents).toBe(122);
    expect(creatorBuildOffer("custom", 350000).amountCents).toBe(350000);
    expect(creatorBuildOffer("basic", 2900).amountCents).toBe(2900);
    expect(creatorBuildOffer("express", null).amountCents).toBeNull();
  });
  it("restores canonical prices when the promotion is disabled", () => {
    expect(creatorBuildOffer("express", 59900, { ...CREATOR_CAMPAIGN.promotion, enabled: false })).toMatchObject({ amountCents: 59900, discountCents: 0, percentOff: null });
  });
  it("rejects invalid monetary input and invalid configured percentages", () => {
    for (const amount of [-1, 1.5, NaN, Number.MAX_SAFE_INTEGER]) expect(() => creatorBuildOffer("express", amount)).toThrow(RangeError);
    for (const percentOff of [0, -15, 101, 15.5]) expect(creatorCampaignSchema.safeParse({ ...CREATOR_CAMPAIGN, promotion: { ...CREATOR_CAMPAIGN.promotion, percentOff } }).success).toBe(false);
  });
});
