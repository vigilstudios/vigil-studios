import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "../__tests__/fake-admin";
import { bookingWorkspaceSites } from "./workspace";
const sites = [
  { id: "contact", project_id: "p-contact" },
  { id: "requested", project_id: "p-requested" },
  { id: "paused", project_id: null },
  { id: "external", project_id: "p-external" },
];
const projects = [
  {
    id: "p-contact",
    brief: {
      basics: {
        businessName: "Contact site",
        booking: { approach: "contact" },
      },
    },
  },
  {
    id: "p-requested",
    brief: {
      basics: { businessName: "Booking site", booking: { approach: "vigil" } },
    },
  },
  {
    id: "p-external",
    brief: {
      basics: {
        businessName: "External scheduler",
        booking: { approach: "existing" },
      },
    },
  },
];
afterEach(() => vi.unstubAllEnvs());
describe("optional booking workspace", () => {
  it("hides contact-only and external sites while keeping requested and paused setups", async () => {
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "true");
    const db = new FakeAdmin({
      booking_settings: [
        { organization_id: "org", website_id: "paused", enabled: false },
        { organization_id: "other", website_id: "contact", enabled: true },
      ],
    });
    expect(
      (await bookingWorkspaceSites(db.asClient(), "org", sites, projects)).map(
        (s) => s.id,
      ),
    ).toEqual(["requested", "paused"]);
  });
  it("leaves a contact-only business without booking navigation or setup requirements", async () => {
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "true");
    const db = new FakeAdmin({
      projects: projects.map((p) => ({ ...p, organization_id: "org" })),
    });
    expect(
      await bookingWorkspaceSites(db.asClient(), "org", [sites[0]]),
    ).toEqual([]);
  });
  it("does not read booking tables before rollout", async () => {
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "false");
    const db = new FakeAdmin();
    expect(
      await bookingWorkspaceSites(db.asClient(), "org", sites, projects),
    ).toEqual([]);
    expect(db.tables.size).toBe(0);
  });
});
