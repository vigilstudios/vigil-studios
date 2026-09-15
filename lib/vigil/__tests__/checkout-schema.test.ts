import { describe, expect, it } from "vitest";
import { checkoutIssues, checkoutSchema } from "../checkout-schema";

const good = { email: "Owner@Example.com", business_name: "Marlow & Fen", plan_code: "care", agree: "on" };

describe("checkoutSchema", () => {
  it("accepts a minimal self-serve form and fills the defaults", () => {
    const parsed = checkoutSchema.parse(good);
    expect(parsed).toMatchObject({ email: "Owner@Example.com", business_name: "Marlow & Fen", plan_code: "care", billing_period: "month", project_kind: "express" });
  });

  it("names every bad field the way the form shows it", () => {
    const res = checkoutSchema.safeParse({ email: "not-an-email", business_name: "M", plan_code: "", billing_period: "weekly", order_id: "nope" });
    expect(res.success).toBe(false);
    if (res.success) return;
    const issues = checkoutIssues(res.error);
    expect(Object.keys(issues).sort()).toEqual(["billing_period", "business_name", "email", "order_id", "plan_code"]);
    expect(issues.email[0]).toMatch(/email/i);
    expect(issues.plan_code[0]).toBe("Choose a plan.");
  });

  it("only knows the three periods and the three builds", () => {
    expect(checkoutSchema.safeParse({ ...good, billing_period: "year3", project_kind: "custom" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...good, project_kind: "enterprise" }).success).toBe(false);
  });

  it("treats the agreement checkbox as data, so the action can insist on it", () => {
    // The schema lets an unticked box through; beginCheckout refuses it with a field message.
    const parsed = checkoutSchema.parse({ ...good, agree: undefined });
    expect(parsed.agree).toBeUndefined();
  });
});
