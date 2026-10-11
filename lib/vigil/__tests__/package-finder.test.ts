import { describe, expect, it } from "vitest";
import { budgetLimitCents, canOfferLeanLaunch, getFinderSteps, isFinderStepReady, recommendWebsitePackage, updateFinderAnswer, withPurchasePreference, type PackageAnswers, type WebsitePackage } from "../package-finder";

const simple: PackageAnswers = { stage: "established", goal: "leads", pages: "single", design: "curated", features: ["basics"], timing: "flexible", budget: "private" };
const prices = { express: 50000, professional: 200000 };
const recommend = (changes: Partial<PackageAnswers> = {}) => recommendWebsitePackage({ ...simple, ...changes }, prices);

describe("website guidance based on essential scope", () => {
  it.each<[Partial<PackageAnswers>, WebsitePackage]>([
    [{}, "express"],
    [{ pages: "multi" }, "professional"],
    [{ design: "tailored" }, "professional"],
    [{ features: ["basics", "forms"] }, "professional"],
    [{ features: ["cms"] }, "professional"],
    [{ design: "bespoke", designCheck: "original" }, "growth"],
    ...(["portal", "booking", "store", "automation"] as const).map((feature): [Partial<PackageAnswers>, WebsitePackage] => [{ features: [feature], workflowCheck: "essential" }, "growth"]),
  ])("fits the confirmed work %j to %s", (changes, expected) => {
    expect(recommend(changes).kind).toBe(expected);
  });

  it("checks whether from-scratch design means branding, even for one page", () => {
    expect(recommend({ design: "bespoke", designCheck: "branded" }).kind).toBe("express");
    expect(recommend({ design: "bespoke", designCheck: "flexible" }).kind).toBe("professional");
    expect(recommend({ design: "bespoke", designCheck: "original" }).kind).toBe("growth");
  });

  it("never buys a higher tier with a larger budget or business stage", () => {
    expect(recommend({ stage: "scaling", budget: "cap", budgetAmount: "50000" }).kind).toBe("express");
    expect(recommend({ stage: "starting", budget: "flexible" }).kind).toBe("express");
  });

  it("keeps essential custom design despite urgency and a low budget", () => {
    const result = recommend({ design: "bespoke", designCheck: "original", timing: "soon", readiness: "ready", budget: "cap", budgetAmount: "100" });
    expect(result.kind).toBe("growth");
    expect(result.action).toBe("consult");
    expect(result.budgetNote).toMatch(/written Growth quote/);
    expect(canOfferLeanLaunch({ ...simple, design: "bespoke", designCheck: "original", stage: "starting" }, prices)).toBe(false);
  });

  it("quotes extra primary pages without treating page count as original development", () => {
    const result = recommend({ pages: "large", scopeCheck: "large" });
    expect(result.kind).toBe("professional");
    expect(result.action).toBe("consult");
    expect(result.cautions.join(" ")).toMatch(/Extra pages need a written scope/);
  });

  it("distinguishes a CMS collection from many primary pages", () => {
    const result = recommend({ pages: "large", scopeCheck: "collections" });
    expect(result.kind).toBe("professional");
    expect(result.now.join(" ")).toMatch(/CMS/);
    expect(result.action).toBe("purchase");
  });

  it.each(["designCheck", "scopeCheck", "workflowCheck"] as const)("keeps uncertainty in %s out of self-serve checkout", (check) => {
    const changes: Partial<PackageAnswers> = check === "designCheck" ? { design: "unsure", designCheck: "unsure" } : check === "scopeCheck" ? { pages: "unsure", scopeCheck: "unsure" } : { features: ["booking"], workflowCheck: "unsure" };
    expect(recommend(changes).action).toBe("consult");
    expect(recommend(changes).cautions.length).toBeGreaterThan(0);
  });

  it("distinguishes existing service links, integrations and essential custom systems", () => {
    expect(recommend({ features: ["booking"], workflowCheck: "links" }).kind).toBe("express");
    expect(recommend({ features: ["booking"], workflowCheck: "integration" }).kind).toBe("professional");
    expect(recommend({ features: ["booking"], workflowCheck: "essential" }).kind).toBe("growth");
  });

  it("defers custom workflows only by explicit choice and preserves other required functions", () => {
    const result = recommend({ features: ["portal", "cms"], workflowCheck: "later" });
    expect(result.kind).toBe("professional");
    expect(result.later.join(" ")).toMatch(/custom workflows/);
    expect(result.now.join(" ")).toMatch(/CMS/);
    expect(result.now.join(" ")).not.toMatch(/essential custom/);
  });

  it("offers a lean alternative for optional page/design scope and requires consent", () => {
    const scope: PackageAnswers = { ...simple, stage: "starting", pages: "multi", design: "tailored" };
    expect(canOfferLeanLaunch(scope, prices)).toBe(true);
    expect(recommendWebsitePackage(scope, prices).kind).toBe("professional");
    const lean = recommendWebsitePackage({ ...scope, tradeoff: "lean" }, prices);
    expect(lean.kind).toBe("express");
    expect(lean.later).toHaveLength(2);
    expect(recommendWebsitePackage({ ...scope, tradeoff: "keep" }, prices).kind).toBe("professional");
    expect(recommendWebsitePackage({ ...scope, tradeoff: "discuss" }, prices).action).toBe("consult");
  });

  it("offers a cheaper viable launch when a limit covers Express but not Professional", () => {
    expect(canOfferLeanLaunch({ ...simple, pages: "multi", budget: "cap", budgetAmount: "800" }, prices)).toBe(true);
  });

  it.each(["forms", "cms", "portal"] as const)("never loses required %s through an old lean choice", (feature) => {
    const answers: PackageAnswers = { ...simple, stage: "starting", pages: "multi", features: [feature], workflowCheck: "essential", tradeoff: "lean" };
    expect(canOfferLeanLaunch(answers, prices)).toBe(false);
    expect(recommendWebsitePackage(answers, prices).kind).toBe(feature === "portal" ? "growth" : "professional");
  });

  it("keeps necessary scope when budget is insufficient, and routes to a call", () => {
    const result = recommend({ features: ["cms"], budget: "cap", budgetAmount: "800" });
    expect(result.kind).toBe("professional");
    expect(result.action).toBe("consult");
    expect(result.cautions.join(" ")).toMatch(/essential requirements have been kept/);
    expect(recommend({ budget: "cap", budgetAmount: "100" }).action).toBe("consult");
    expect(recommend({ budget: "cap", budgetAmount: "500" }).action).toBe("purchase");
  });

  it("does not offer an unaffordable lean build when the limit is below Express", () => {
    expect(canOfferLeanLaunch({ ...simple, stage: "starting", pages: "multi", budget: "cap", budgetAmount: "100" }, prices)).toBe(false);
  });

  it("requires price confirmation when a build amount is unavailable", () => {
    expect(recommendWebsitePackage({ ...simple, budget: "cap", budgetAmount: "1000" }, {}).action).toBe("consult");
  });

  it("requires capacity confirmation for every fixed date", () => {
    const result = recommend({ timing: "date", launchDate: "2026-11-01", readiness: "ready" });
    expect(result.action).toBe("consult");
    expect(result.cautions.join(" ")).toMatch(/2026-11-01/);
    expect(result.timingNote).toMatch(/first look.*Deployment follows/);
  });

  it("checks material readiness for a fast Express launch and avoids a deployment promise", () => {
    expect(recommend({ timing: "soon", readiness: "help" }).action).toBe("consult");
    expect(recommend({ timing: "soon", readiness: "ready" }).action).toBe("purchase");
    expect(recommend({ timing: "soon", readiness: "ready" }).timingNote).toMatch(/completed onboarding/);
    expect(recommend({ pages: "multi", timing: "soon", readiness: "ready", tradeoff: "keep" }).action).toBe("consult");
  });

  it("uses business stage and primary outcome to explain the launch plan", () => {
    const result = recommend({ stage: "starting", goal: "proof" });
    expect(result.reasons.join(" ")).toMatch(/proving the offer/);
    expect(result.now.join(" ")).toMatch(/testimonials/);
  });
});

describe("adaptive question flow", () => {
  it("has seven core questions without unnecessary follow-ups", () => {
    expect(getFinderSteps(simple, prices)).toEqual(["stage", "goal", "pages", "design", "features", "timing", "budget"]);
  });

  it("adds the relevant clarification and timing questions", () => {
    expect(getFinderSteps({ ...simple, pages: "large", design: "bespoke", features: ["portal"], timing: "date" }, prices)).toEqual(["stage", "goal", "pages", "scopeCheck", "design", "designCheck", "features", "workflowCheck", "timing", "readiness", "budget"]);
  });

  it("does not remove the tradeoff step when its answer is selected", () => {
    const answers = { ...simple, pages: "multi" as const, stage: "starting" as const };
    expect(getFinderSteps(answers, prices)).toContain("tradeoff");
    expect(getFinderSteps({ ...answers, tradeoff: "lean" }, prices)).toContain("tradeoff");
  });

  it("invalidates dependent answers when a visitor revises scope", () => {
    const answers: PackageAnswers = { ...simple, pages: "large", scopeCheck: "single", design: "bespoke", designCheck: "branded", features: ["booking"], workflowCheck: "links", timing: "date", launchDate: "2026-11-01", readiness: "ready", tradeoff: "lean" };
    expect(updateFinderAnswer(answers, "pages", "multi").scopeCheck).toBeUndefined();
    expect(updateFinderAnswer(answers, "design", "curated").designCheck).toBeUndefined();
    expect(updateFinderAnswer(answers, "features", ["portal"]).workflowCheck).toBeUndefined();
    expect(updateFinderAnswer(answers, "timing", "flexible").readiness).toBeUndefined();
    expect(updateFinderAnswer(answers, "timing", "flexible").launchDate).toBeUndefined();
    expect(updateFinderAnswer(answers, "budget", "private").budgetAmount).toBeUndefined();
    expect(updateFinderAnswer(answers, "stage", "scaling").tradeoff).toBeUndefined();
    expect(updateFinderAnswer(answers, "tradeoff", "lean").tradeoff).toBe("lean");
  });

  it("ignores stale branch answers that no longer apply", () => {
    const result = recommend({ scopeCheck: "large", designCheck: "original", workflowCheck: "essential", launchDate: "2026-11-01", readiness: "shaping" });
    expect(result.kind).toBe("express");
    expect(result.action).toBe("purchase");
  });

  it("gates empty answers, invalid budgets and dates", () => {
    expect(isFinderStepReady("stage", {}, "2026-10-11")).toBe(false);
    expect(isFinderStepReady("features", { features: [] }, "2026-10-11")).toBe(false);
    expect(isFinderStepReady("budget", { budget: "private" }, "2026-10-11")).toBe(true);
    expect(isFinderStepReady("budget", { budget: "cap", budgetAmount: "" }, "2026-10-11")).toBe(false);
    expect(isFinderStepReady("timing", { timing: "date", launchDate: "2026-10-10" }, "2026-10-11")).toBe(false);
    expect(isFinderStepReady("timing", { timing: "date", launchDate: "2026-11-01" }, "2026-10-11")).toBe(true);
    expect(isFinderStepReady("timing", { timing: "date", launchDate: "2026-02-30" }, "2026-01-01")).toBe(false);
  });

  it.each(["-1", "1e4", "NaN", "Infinity", "1.234", "", "999999999999999999"])("rejects invalid money %s", (budgetAmount) => {
    expect(budgetLimitCents({ budget: "cap", budgetAmount })).toBeNull();
  });
  it.each([["0", 0], [" 500.50 ", 50050], ["1000", 100000]] as const)("converts amount %s into cents", (budgetAmount, expected) => {
    expect(budgetLimitCents({ budget: "cap", budgetAmount })).toBe(expected);
  });
});

describe("purchase preference", () => {
  it("carries subscriptions without changing destination build or fit", () => {
    expect(withPurchasePreference("/checkout?build=professional", { plan: "growth", period: "year" })).toBe("/checkout?build=professional&plan=growth&period=year");
    expect(withPurchasePreference("/express", { plan: "basic", period: "month" })).toBe("/express?plan=basic&period=month");
    expect(withPurchasePreference("/checkout?template=creator", { plan: "care", period: "year" })).toBe("/checkout?template=creator&plan=care&period=year");
    expect(withPurchasePreference("/express", {})).toBe("/express");
    expect(recommend().kind).toBe("express");
  });
});
