import { describe, expect, it } from "vitest";
import { buildEntitlements, FEATURES } from "../entitlements";

describe("buildEntitlements", () => {
  const rows = [
    { feature_code: "virtue.enabled", value: true, source: "plan", plan_code: "growth" },
    { feature_code: "requests.monthly_allowance", value: null, source: "default", plan_code: "growth" },
    { feature_code: "insights.level", value: "advanced", source: "override", plan_code: "growth" },
    { feature_code: "leads.enabled", value: "true", source: "plan", plan_code: "growth" },
  ];

  it("reads booleans strictly", () => {
    const e = buildEntitlements(rows);
    expect(e.enabled(FEATURES.virtue)).toBe(true);
    // A string "true" is a data error, not an entitlement.
    expect(e.enabled(FEATURES.leads)).toBe(false);
    expect(e.enabled("missing.feature")).toBe(false);
  });

  it("treats undecided limits as null, not zero", () => {
    const e = buildEntitlements(rows);
    expect(e.limit(FEATURES.requestsMonthlyAllowance)).toBeNull();
    expect(e.limit(FEATURES.virtue)).toBeNull();
  });

  it("exposes text values and the resolved plan", () => {
    const e = buildEntitlements(rows);
    expect(e.text(FEATURES.insightsLevel)).toBe("advanced");
    expect(e.byCode.get(FEATURES.insightsLevel)?.source).toBe("override");
    expect(e.planCode).toBe("growth");
  });

  it("has no plan when nothing is active", () => {
    const e = buildEntitlements([{ feature_code: "virtue.enabled", value: false, source: "default", plan_code: null }]);
    expect(e.planCode).toBeNull();
    expect(e.enabled(FEATURES.virtue)).toBe(false);
  });
});
