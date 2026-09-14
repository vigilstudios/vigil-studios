import { describe, expect, it } from "vitest";
import { Constants } from "@/types/database.types";
import { auditTone, periodProgress, projectStepIndex, projectSteps, requiredRecords, templateName } from "../presenters";

describe("projectStepIndex", () => {
  it("maps every project status onto the stepper", () => {
    for (const status of Constants.public.Enums.project_status) {
      const r = projectStepIndex(status);
      expect(r.current).toBeGreaterThanOrEqual(-1);
      expect(r.current).toBeLessThan(projectSteps.length);
    }
    expect(projectStepIndex("intake").current).toBe(1);
    expect(projectStepIndex("launched")).toEqual({ current: 5, done: true, cancelled: false });
    expect(projectStepIndex("closed").done).toBe(true);
    expect(projectStepIndex("cancelled").cancelled).toBe(true);
  });
});

describe("periodProgress", () => {
  it("measures elapsed time inside the period and clamps outside it", () => {
    const start = "2026-09-01T00:00:00Z";
    const end = "2026-10-01T00:00:00Z";
    const mid = Date.parse("2026-09-16T00:00:00Z");
    const p = periodProgress(start, end, mid);
    expect(p.total).toBeGreaterThan(0);
    expect(p.elapsed / p.total).toBeCloseTo(0.5, 2);
    expect(p.daysLeft).toBe(15);
    expect(periodProgress(start, end, Date.parse("2026-12-01T00:00:00Z")).elapsed).toBe(p.total);
  });
  it("is empty when the period is unknown", () => {
    expect(periodProgress(null, null)).toEqual({ elapsed: 0, total: 0, daysLeft: null });
    expect(periodProgress("2026-10-01T00:00:00Z", "2026-09-01T00:00:00Z").total).toBe(0);
  });
});

describe("auditTone", () => {
  it("reads the resulting status when there is one", () => {
    expect(auditTone("websites.status_changed", { status: "live" })).toBe("good");
    expect(auditTone("domains.status_changed", { status: "error" })).toBe("bad");
    expect(auditTone("subscriptions.status_changed", { status: "past_due" })).toBe("warn");
  });
  it("falls back to the verb", () => {
    expect(auditTone("member.invited", { email: "x" })).toBe("info");
    expect(auditTone("member.removed", null)).toBe("neutral");
  });
});

describe("requiredRecords / templateName", () => {
  it("tolerates malformed verification json", () => {
    expect(requiredRecords(null)).toEqual([]);
    expect(requiredRecords({ required_records: "nope" })).toEqual([]);
    expect(requiredRecords({ required_records: [{ type: "A", name: "@", value: "1.2.3.4" }] })).toHaveLength(1);
  });
  it("names known templates and passes unknown slugs through", () => {
    expect(templateName("restaurant")).toBe("Restaurant and cafe");
    expect(templateName("bespoke-thing")).toBe("bespoke-thing");
    expect(templateName(null)).toBe("Custom");
  });
});
