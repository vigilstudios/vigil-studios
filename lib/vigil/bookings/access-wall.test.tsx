import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { BookingAccessWall } from "@/components/vigil/BookingAccessWall";
describe("booking access", () => {
  it("offers below-Care customers an inert illustrated calendar and upgrade wall", () => {
    const html = renderToStaticMarkup(
      createElement(BookingAccessWall, { mode: "upgrade" }),
    );
    expect(html).toContain('href="/dashboard/billing"');
    expect(html).toContain("Illustrative booking preview");
    expect(html).toContain("premium-backdrop-preview");
    expect(html).toContain("inert");
    expect(html).not.toContain("Request booking setup");
  });
  it("offers included customers a request instead of another upgrade", () => {
    const html = renderToStaticMarkup(
      createElement(BookingAccessWall, {
        mode: "request",
        canRequest: true,
        websiteId: "site",
      }),
    );
    expect(html).toContain("/dashboard/requests?booking=site");
    expect(html).toContain("Request booking setup");
    expect(html).not.toContain("View upgrade options");
  });
  it("uses support when an account does not include Requests", () => {
    const html = renderToStaticMarkup(
      createElement(BookingAccessWall, { mode: "request", canRequest: false }),
    );
    expect(html).toContain("mailto:hello@vigilstudios.co");
    expect(html).not.toContain('href="/dashboard/requests');
  });
});
