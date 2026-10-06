import { describe, expect, it } from "vitest";
import { PLAN_FEATURE_LABELS, planBullets, planHasVirtue } from "../plan-presentation";

describe("customer plan presentation", () => {
  it("shows only enabled database features, even when a plan name implies more", () => {
    const includes = PLAN_FEATURE_LABELS.map(([code, label]) => ({ code, label, on: code === "hosting.managed" }));
    expect(planBullets(includes)).toEqual(["Managed hosting, SSL and security"]);
    expect(planHasVirtue(includes)).toBe(false);
  });

  it("distinguishes eligibility from rollout for unfinished tools", () => {
    const includes = PLAN_FEATURE_LABELS.map(([code, label]) => ({ code, label, on: true }));
    expect(planHasVirtue(includes)).toBe(true);
    for (const code of ["virtue.enabled", "leads.enabled", "insights.enabled"]) {
      expect(includes.find((feature) => feature.code === code)?.label).toContain("in development");
    }
  });
});
