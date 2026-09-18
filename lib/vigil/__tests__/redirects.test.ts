import { describe, expect, it } from "vitest";
import { ProviderError, ProviderNotConfiguredError, RateLimitedError, toActionError } from "../auth/errors";
import { isPlausibleEmail, normalizeEmail, safeNextPath } from "../auth/redirects";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/dashboard/website")).toBe("/dashboard/website");
    expect(safeNextPath("/admin?tab=jobs")).toBe("/admin?tab=jobs");
  });

  it("refuses anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeNextPath("/dashboard\r\nSet-Cookie: x")).toBe("/dashboard");
  });

  it("never loops back into auth routes", () => {
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/auth/callback")).toBe("/dashboard");
  });

  it("falls back when empty", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("", "/admin")).toBe("/admin");
  });
});

describe("email helpers", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeEmail("  Owner@Example.COM ")).toBe("owner@example.com");
  });
  it("rejects obvious non-addresses", () => {
    expect(isPlausibleEmail("owner@example.com")).toBe(true);
    expect(isPlausibleEmail("owner")).toBe(false);
    expect(isPlausibleEmail("owner@localhost")).toBe(false);
  });
});

describe("toActionError audiences", () => {
  const failure = (result: ReturnType<typeof toActionError>) => (result.ok ? null : result);
  it("hides provider and configuration detail from customers", () => {
    const stripe = new ProviderError("stripe", "No such price: 'price_123'", { status: 400 });
    expect(toActionError(stripe)).toEqual({ ok: false, error: "We could not reach one of the services we depend on. Please try again in a moment.", code: "provider_error" });
    expect(failure(toActionError(new ProviderNotConfiguredError("Billing")))?.error).not.toMatch(/Billing/);
    expect(failure(toActionError(new Error("pg: relation missing")))?.error).toBe("Something went wrong. Please try again.");
  });
  it("keeps the detail for staff, and plain sentences for everyone", () => {
    const stripe = new ProviderError("stripe", "No such price: 'price_123'", { status: 400 });
    expect(failure(toActionError(stripe, "staff"))?.error).toBe("No such price: 'price_123'");
    expect(failure(toActionError(new RateLimitedError()))?.code).toBe("rate_limited");
  });
});
