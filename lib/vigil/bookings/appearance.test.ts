import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
import { bookingAccentForeground } from "./appearance";
import { bookingExperienceSchema, defaultBookingExperience } from "./contract";
describe("booking palette ownership", () => {
  it("inherits the website palette without injecting a fixed accent", () => {
    const html = renderToStaticMarkup(
      createElement(BookingWidget, { preview: true }),
    );
    expect(defaultBookingExperience.accent).toBe("site");
    expect(html).toContain('data-accent="site"');
    expect(html).not.toContain('style="--vigil-booking-accent:');
  });
  it("limits custom colors to solid hex values and selects readable text", () => {
    expect(
      bookingExperienceSchema.safeParse({
        ...defaultBookingExperience,
        accent: "#12bf60",
      }).success,
    ).toBe(true);
    for (const accent of [
      "red",
      "#fff",
      "url(https://example.test)",
      "#zzzzzz",
    ])
      expect(
        bookingExperienceSchema.safeParse({
          ...defaultBookingExperience,
          accent,
        }).success,
      ).toBe(false);
    expect(bookingAccentForeground("#12bf60")).toBe("#000000");
    expect(bookingAccentForeground("#10d45a")).toBe("#000000");
    expect(bookingAccentForeground("#2547b8")).toBe("#ffffff");
    const html = renderToStaticMarkup(
      createElement(BookingWidget, {
        preview: true,
        experience: { ...defaultBookingExperience, accent: "#12bf60" },
      }),
    );
    expect(html).toContain("--vigil-booking-accent:#12bf60");
    expect(html).toContain("--vigil-booking-foreground:#000000");
  });
});
