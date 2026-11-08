import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { sessionCookieOptions } from "./persistence";
import { checkoutReturnPath, canViewPurchase } from "./checkout-access";
import { safeNextPath } from "./redirects";
import { prospectNavigation } from "./prospect-nav";
import { accountStatus } from "../accounts/directory";
import type { Viewer } from "./session";
import { LoginForm } from "@/app/(vigil)/login/LoginForm";
import {
  emailConfirmationTarget,
  decodeEmailDestination,
} from "./email-destination";
import { GET as emailLanding } from "@/app/(vigil)/auth/confirm/[destination]/route";
import { NextRequest } from "next/server";
describe("account access boundaries", () => {
  it("carries the selected package in confirmation mail without depending on a browser cookie", async () => {
    const next = "/checkout?template=auto-services&plan=care&period=year";
    const target = emailConfirmationTarget("https://www.vigilstudios.co", next),
      encoded = target.split("/").at(-1)!;
    expect(decodeEmailDestination(encoded)).toBe(next);
    expect(
      decodeEmailDestination(
        Buffer.from("https://evil.test").toString("base64url"),
      ),
    ).toBe("/dashboard");
    const response = await emailLanding(
      new NextRequest(target + "?token_hash=fictional&type=signup"),
      { params: Promise.resolve({ destination: encoded }) },
    );
    const html = await response.text();
    expect(html).toContain("Ready to sign you in");
    expect(html).toContain(
      'name="next" value="/checkout?template=auto-services&amp;plan=care&amp;period=year"',
    );
    expect(html).not.toContain(".submit()");
  });
  it("retains the selected package through authentication without allowing an external destination", () => {
    const path = checkoutReturnPath({
      template: "home-services",
      plan: "care",
      period: "year",
      promo: "INFLUENCE",
      next: "https://evil.test",
      build: ["custom"],
    });
    expect(path).toContain("template=home-services");
    expect(path).toContain("plan=care");
    expect(path).toContain("period=year");
    expect(path).toContain("promo=INFLUENCE");
    expect(path).not.toContain("evil");
    expect(path).not.toContain("build=");
    expect(safeNextPath("/\\evil.test")).toBe("/dashboard");
    expect(safeNextPath("/signup?next=/signup")).toBe("/dashboard");
    expect(safeNextPath("/checkout?template=home-services")).toBe(
      "/checkout?template=home-services",
    );
  });
  it("uses verified IDs or existing membership, never matching email, to authorize receipts", () => {
    const viewer = {
      user: { id: "buyer", email: "same@example.test" },
      staffRole: null,
      memberships: [],
    } as unknown as Viewer;
    expect(
      canViewPurchase(viewer, {
        buyer_user_id: "other",
        organization_id: null,
      }),
    ).toBe(false);
    expect(
      canViewPurchase(viewer, {
        buyer_user_id: "buyer",
        organization_id: null,
      }),
    ).toBe(true);
    expect(
      canViewPurchase(viewer, { buyer_user_id: null, organization_id: null }),
    ).toBe(false);
  });
  it("session-only storage strips persistence while preserving Auth cookie deletion", () => {
    const original = {
      path: "/",
      sameSite: "lax" as const,
      maxAge: 400 * 86400,
      expires: new Date("2030-01-01"),
    };
    expect(sessionCookieOptions(original, "browser")).toEqual({
      path: "/",
      sameSite: "lax",
    });
    expect(sessionCookieOptions(original, "remember")).toEqual(original);
    expect(sessionCookieOptions(original)).toEqual(original);
    expect(
      sessionCookieOptions({ path: "/", maxAge: 0 }, "browser").maxAge,
    ).toBe(0);
  });
  it("prospects have Overview and Settings while business sections stay visibly locked", () => {
    const items = prospectNavigation.flatMap((g) => g.items);
    expect(items.filter((i) => !i.disabled).map((i) => i.href)).toEqual([
      "/dashboard",
      "/dashboard/settings",
    ]);
    expect(items.find((i) => i.label === "Bookings")).toMatchObject({
      premium: true,
      disabled: true,
      locked: true,
    });
  });
  it("distinguishes pending and refunded orders from a purchase", () => {
    expect(
      accountStatus({ purchase_count: 0, pending_count: 1, refunded_count: 0 }),
    ).toBe("Checkout started");
    expect(
      accountStatus({ purchase_count: 0, pending_count: 0, refunded_count: 1 }),
    ).toBe("Refunded");
    expect(
      accountStatus({ purchase_count: 1, pending_count: 1, refunded_count: 0 }),
    ).toBe("Purchased");
  });
  it("provides real browser autofill semantics and makes Google a separately configured path", () => {
    const login = renderToStaticMarkup(
      createElement(LoginForm, {
        next: "/dashboard",
        initialError: null,
        googleEnabled: true,
      }),
    );
    expect(login).toContain('autoComplete="username"');
    expect(login).toContain('autoComplete="current-password"');
    expect(login).toContain("Continue with Google");
    expect(login).toContain("Keep me signed in");
    const signup = renderToStaticMarkup(
      createElement(LoginForm, {
        next: "/dashboard",
        initialError: null,
        signup: true,
      }),
    );
    expect(signup).toContain('autoComplete="new-password"');
    expect(signup).toContain("Create account");
    expect(signup).toContain("No purchase or payment details required");
    expect(signup).not.toContain("Continue with Google");
  });
});
