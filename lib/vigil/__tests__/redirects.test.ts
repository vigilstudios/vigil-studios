import { describe, expect, it } from "vitest";
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
