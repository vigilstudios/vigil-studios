import { describe, expect, it } from "vitest";
import { recommendWebsitePackage, withPurchasePreference, type PackageAnswers, type WebsitePackage } from "../package-finder";

const simple: PackageAnswers = { pages: "single", design: "curated", features: ["basics"] };

describe("neutral website package fit", () => {
  it.each<[Partial<PackageAnswers>, WebsitePackage]>([
    [{}, "express"],
    [{ pages: "multi" }, "professional"],
    [{ design: "tailored" }, "professional"],
    [{ features: ["basics", "forms"] }, "professional"],
    [{ features: ["cms"] }, "professional"],
    [{ pages: "unsure" }, "professional"],
    [{ design: "unsure" }, "professional"],
    [{ pages: "large" }, "growth"],
    [{ design: "bespoke" }, "growth"],
    [{ features: ["portal"] }, "growth"],
    [{ features: ["booking"] }, "growth"],
    [{ features: ["store"] }, "growth"],
    [{ features: ["automation"] }, "growth"],
    [{ pages: "multi", design: "tailored", features: ["basics", "cms", "portal"] }, "growth"],
  ])("uses project scope %j to recommend %s", (changes, expected) => {
    const result = recommendWebsitePackage({ ...simple, ...changes });
    expect(result.kind).toBe(expected);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("explains the scope uncertainty rather than promising a confirmed fit", () => {
    expect(recommendWebsitePackage({ ...simple, pages: "unsure" }).reasons.join(" ")).toMatch(/call can confirm/i);
  });

  it("carries subscriptions without changing the recommendation or destination build", () => {
    expect(withPurchasePreference("/checkout?build=professional", { plan: "growth", period: "year" })).toBe("/checkout?build=professional&plan=growth&period=year");
    expect(withPurchasePreference("/express", { plan: "basic", period: "month" })).toBe("/express?plan=basic&period=month");
    expect(withPurchasePreference("/checkout?template=creator", { plan: "care", period: "year" })).toBe("/checkout?template=creator&plan=care&period=year");
    expect(withPurchasePreference("/express", {})).toBe("/express");
    expect(recommendWebsitePackage(simple).kind).toBe("express");
  });
});
