import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  handleBookings,
  bookingHash,
  type BookingDependencies,
} from "../bookings/http";
import {
  bookingManagementUrl,
  bookingSettingsSchema,
  hoursSchema,
  publicBookingSchema,
} from "../bookings/contract";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
import {
  contactFirstHtml,
  hasNativeBookingComponent,
} from "../express/booking-policy";
import { expressHtml } from "../express/export";
import { catalogEntry } from "../express/document";
import { blankExpressSite } from "../express/document";
import { makeEndingSection } from "@/design-engine/preview/ending-fixtures";
import { parseBrief, basicsSchema } from "../onboarding/brief";
import { verifyTurnstile } from "../contact/http";
import { FakeAdmin } from "./fake-admin";
import { readFileSync } from "node:fs";
const website = "ba000000-0000-4000-8000-000000000021",
  service = "ba000000-0000-4000-8000-000000000041",
  id = "ba000000-0000-4000-8000-000000000051",
  origin = "https://client.example.test";
const input = {
  sourcePage: origin + "/book?email=private#token",
  serviceId: service,
  startsAt: "2026-12-12T15:00:00Z",
  submissionId: id,
  managementToken: "a".repeat(64),
  name: "Visitor",
  email: "visitor@example.test",
  captchaToken: "challenge-token",
};
function fixture() {
  const fake = new FakeAdmin({
      website_contact_settings: [
        { website_id: website, allowed_origins: [origin] },
      ],
    }),
    client = fake.asClient();
  const rpc = vi.fn(async (name: string) => ({
    data:
      name === "rate_limit"
        ? true
        : name === "booking_public_config"
          ? { websiteId: website, timeZone: "America/New_York", services: [] }
          : { id, status: "requested", serviceId: service },
    error: null,
  }));
  client.rpc = rpc as unknown as typeof client.rpc;
  const deps: BookingDependencies = {
    admin: () => client,
    enabled: () => true,
    credentials: async () => ({
      siteKey: "live-style-sitekey",
      secret: "live-style-secret",
    }),
    verify: vi.fn(async () => true),
  };
  return { fake, client, rpc, deps };
}
function request(
  body: unknown = input,
  method = "POST",
  requestOrigin = origin,
  suffix = "",
) {
  return new Request(
    `https://www.vigilstudios.co/api/bookings/${website}${suffix}`,
    {
      method,
      headers: { Origin: requestOrigin, "Content-Type": "application/json" },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
    },
  );
}
afterEach(() => vi.unstubAllGlobals());
describe("native booking boundary", () => {
  it("requires explicit rollout and registered origin before touching booking records", async () => {
    const { deps, rpc } = fixture();
    deps.enabled = () => false;
    expect((await handleBookings(request(), website, deps)).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    deps.enabled = () => true;
    expect(
      (
        await handleBookings(
          request(input, "POST", "https://wrong.example.test"),
          website,
          deps,
        )
      ).status,
    ).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses the website registry and action-specific CAPTCHA; only hashes reach storage", async () => {
    const { deps, rpc } = fixture(),
      result = await handleBookings(request(), website, deps);
    expect(result.status).toBe(201);
    expect(deps.verify).toHaveBeenCalledWith(
      "challenge-token",
      "client.example.test",
      "unknown",
      "live-style-secret",
      "booking",
    );
    const call = rpc.mock.calls.find(
      ([name]) => name === "create_public_booking",
    ) as unknown as [string, Record<string, unknown>];
    expect(call[1]).toMatchObject({
      p_website: website,
      p_origin: origin,
      p_service: service,
      p_page: origin + "/book",
      p_guest_hash: bookingHash(input.managementToken),
    });
    expect(call[1]).not.toHaveProperty("managementToken");
    expect(call[1]).not.toHaveProperty("organization_id");
  });
  it.each([
    { ...input, organization_id: "wrong" },
    { ...input, leadId: id },
    { ...input, recipient: "other@example.test" },
    { ...input, managementToken: "short" },
    { ...input, startsAt: "tomorrow" },
    { ...input, captchaToken: "" },
  ])("rejects malformed or overreaching submission %#", async (body) => {
    const { deps, rpc } = fixture();
    expect((await handleBookings(request(body), website, deps)).status).toBe(
      422,
    );
    expect(rpc.mock.calls.some(([n]) => n === "create_public_booking")).toBe(
      false,
    );
  });
  it("fails closed when CAPTCHA, credentials or rate limits fail", async () => {
    for (const kind of ["captcha", "credentials", "limit"]) {
      const { deps, rpc } = fixture();
      if (kind === "captcha") deps.verify = async () => false;
      if (kind === "credentials")
        deps.credentials = async () => ({
          secret: "1x0000000000000000000000000000000AA",
          siteKey: "1x00000000000000000000AA",
        });
      if (kind === "limit") rpc.mockResolvedValue({ data: false, error: null });
      expect((await handleBookings(request(), website, deps)).status).toBe(
        kind === "captcha" ? 403 : kind === "limit" ? 429 : 503,
      );
      expect(rpc.mock.calls.some(([n]) => n === "create_public_booking")).toBe(
        false,
      );
    }
  });
  it("public config never exposes the verification secret", async () => {
    const { deps } = fixture(),
      response = await handleBookings(request(null, "GET"), website, deps);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(JSON.stringify(await response.json())).not.toContain(
      "live-style-secret",
    );
  });
  it("uses bounded one-day authoritative availability", async () => {
    const { deps, rpc } = fixture();
    expect(
      (
        await handleBookings(
          request(null, "GET", origin, `?service=${service}&day=2026-12-12`),
          website,
          deps,
        )
      ).status,
    ).toBe(200);
    expect(rpc).toHaveBeenCalledWith("booking_public_slots", {
      p_website: website,
      p_origin: origin,
      p_service: service,
      p_day: "2026-12-12",
    });
    expect(
      (
        await handleBookings(
          request(null, "GET", origin, `?service=${service}&day=tomorrow`),
          website,
          deps,
        )
      ).status,
    ).toBe(422);
  });
  it("guest changes require a private token and never use email as authorization", async () => {
    const { deps, rpc } = fixture();
    expect(
      (
        await handleBookings(
          request({
            bookingId: id,
            token: input.managementToken,
            action: "cancel",
          }),
          website,
          deps,
        )
      ).status,
    ).toBe(200);
    expect(rpc).toHaveBeenCalledWith("manage_guest_booking", {
      p_website: website,
      p_origin: origin,
      p_id: id,
      p_hash: bookingHash(input.managementToken),
      p_action: "cancel",
    });
    expect(deps.verify).not.toHaveBeenCalled();
    expect(
      (
        await handleBookings(
          request({ bookingId: id, email: input.email, action: "cancel" }),
          website,
          deps,
        )
      ).status,
    ).toBe(422);
  });
  it("requires booking CAPTCHA action without accepting a contact challenge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "client.example.test",
          action: "contact",
        }),
      ),
    );
    expect(
      await verifyTurnstile(
        "token",
        "client.example.test",
        "unknown",
        "secret",
        "booking",
      ),
    ).toBe(false);
  });
  it("keeps management credentials in URL fragments and rejects invalid settings", () => {
    expect(
      bookingManagementUrl(
        "https://client.example.test/book?email=private",
        id,
        input.managementToken,
      ),
    ).toBe(
      `https://client.example.test/book#vigil-booking=${id}.${input.managementToken}`,
    );
    expect(
      hoursSchema.safeParse([
        { day: 1, start: "09:00", end: "12:00" },
        { day: 1, start: "11:00", end: "13:00" },
      ]).success,
    ).toBe(false);
    expect(
      bookingSettingsSchema.safeParse({
        timeZone: "EST",
        enabled: true,
        acknowledgeAvailability: true,
        minimumNotice: 0,
        horizonDays: 90,
        changeNotice: 120,
      }).success,
    ).toBe(false);
    expect(publicBookingSchema.safeParse({ ...input, name: "" }).success).toBe(
      false,
    );
  });
  it("makes Lab preview explicit and produces no network submissions during rendering", () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const html = renderToStaticMarkup(
      createElement(BookingWidget, { preview: true }),
    );
    expect(html).toContain("Interactive example");
    expect(html).not.toContain("iframe");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe("Express booking default and onboarding continuity", () => {
  const html = readFileSync(
    "lib/vigil/__tests__/fixtures/restaurant-booking-legacy.html",
    "utf8",
  );
  it("adapts the actual restaurant to contact-only without mutating its archived source", () => {
    const contact = contactFirstHtml(html);
    expect(contact).toContain('name="message"');
    expect(contact).toContain('name="name"');
    expect(contact).not.toContain('name="date"');
    expect(contact).not.toContain('name="party"');
    expect(contact).not.toContain('name="time"');
    expect(contact).not.toContain("Book a table");
    expect(contact).toContain("Preview only. Your message has not been sent.");
    expect(html).toContain('name="party"');
    expect(
      readFileSync("public/express-templates/restaurant.html", "utf8"),
    ).not.toContain('name="party"');
    expect(contactFirstHtml(contact)).toBe(contact);
    expect(contactFirstHtml("<form>Unrelated site</form>")).toBe(
      "<form>Unrelated site</form>",
    );
  });
  it("only advertises designs with an implemented native booking adapter", () => {
    const draft = {
      kind: "html" as const,
      variant: "Restaurant",
      industry: "Restaurant",
      example: "Example",
      description: "",
      accent: "#123456",
      html,
    };
    expect(hasNativeBookingComponent(draft)).toBe(true);
    expect(catalogEntry("restaurant", draft).nativeBookings).toBe(true);
    const live = expressHtml(draft, "/runtime", false, undefined, website);
    expect(live).toContain("VigilBookings.connect");
    expect(live).toContain('data-vigil-booking-slot="v1" hidden');
    expect(live).toContain("VigilContact.mountContactForm");
    const unsupported = { ...draft, html: "<p>Unrelated restaurant</p>" };
    expect(hasNativeBookingComponent(unsupported)).toBe(false);
    const site = blankExpressSite(id, "Booking site");
    site.pages[0].sections = [makeEndingSection("contact.booking", "book")];
    expect(hasNativeBookingComponent({ ...draft, kind: "site", site })).toBe(
      true,
    );
  });
  it.each([
    "restaurant",
    "salon-spa",
    "medical",
    "auto-services",
    "home-services",
    "retail",
  ])(
    "keeps %s contact-first and gives exported inquiries a real host adapter",
    (name) => {
      const html = readFileSync(
        `public/express-templates/${name}.html`,
        "utf8",
      );
      expect(html).toContain('data-vigil-contact-default="v1"');
      expect(html).toContain('name="email"');
      expect(html).not.toContain('name="date"');
      expect(html).not.toContain('name="day"');
      expect(contactFirstHtml(html)).toBe(html);
      const live = expressHtml(
        {
          kind: "html",
          variant: name,
          industry: name,
          example: "Example",
          description: "",
          accent: "#123456",
          html,
        },
        "/runtime",
        false,
        undefined,
        website,
      );
      expect(live).toContain("VigilContact.mountContactForm");
      expect(live).not.toContain('<p class="preview-note">');
      expect(live.includes("VigilBookings.connect")).toBe(
        ["restaurant", "salon-spa"].includes(name),
      );
    },
  );
  it("preserves old brief fields and records booking needs without activation", () => {
    const old = parseBrief({ basics: { businessName: "Existing business" } });
    expect(old.basics?.businessName).toBe("Existing business");
    expect(old.basics?.booking.approach).toBeNull();
    const draft = basicsSchema.parse({
      businessName: "New business",
      booking: {
        approach: "vigil",
        mode: "both",
        timeZone: "America/New_York",
        services: "Consultations",
      },
    });
    expect(draft.booking).toMatchObject({ approach: "vigil", mode: "both" });
    expect(draft.booking).not.toHaveProperty("enabled");
    expect(draft.hours.byAppointment).toBe(false);
  });
});

describe("booking delivery handoff", () => {
  it("flags a requested booking component before rollout without querying a missing schema", async () => {
    const { bookingReadiness } = await import("../bookings/readiness");
    const db = new FakeAdmin({});
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "false");
    expect(
      await bookingReadiness(
        db.asClient(),
        "org",
        {
          brief: {
            basics: { businessName: "Example", booking: { approach: "vigil" } },
          },
        },
        { id: website },
      ),
    ).toMatchObject({
      ready: false,
      message: expect.stringContaining("contact-only"),
    });
    expect(
      await bookingReadiness(
        db.asClient(),
        "org",
        {
          brief: {
            basics: {
              businessName: "Example",
              booking: { approach: "contact" },
            },
          },
        },
        { id: website },
      ),
    ).toBeNull();
    vi.unstubAllEnvs();
  });
});
