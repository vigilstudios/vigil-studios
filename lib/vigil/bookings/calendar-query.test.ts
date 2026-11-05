import { afterEach, describe, it, expect, vi } from "vitest";
const { createClient, requireOrgContext } = vi.hoisted(() => ({
  createClient: vi.fn(),
  requireOrgContext: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("../auth/session", () => ({ requireOrgContext }));
import { getBookings } from "../queries/bookings";
const org = "tenant-a",
  site = "site-a";
function database() {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const records = Array.from({ length: 30 }, (_, i) => ({
    id: `appointment-${i}`,
    starts_at: "2026-11-04T15:00:00Z",
    ends_at: "2026-11-04T15:30:00Z",
    status: "confirmed",
  }));
  const data: Record<string, unknown> = {
    websites: [{ id: site, name: "Studio", project_id: null, status: "live" }],
    booking_settings: { time_zone: "America/New_York" },
    appointments: records,
  };
  function from(table: string) {
    const response = {
      data: data[table] ?? [],
      error: null,
      count: table === "appointments" ? 30 : null,
    };
    const query = new Proxy(
      {},
      {
        get(_target, method: string) {
          if (method === "then")
            return Promise.resolve(response).then.bind(
              Promise.resolve(response),
            );
          return (...args: unknown[]) => {
            calls.push({ table, method, args });
            if (
              table === "booking_settings" &&
              method === "select" &&
              args[0] === "website_id"
            )
              response.data = [{ website_id: site }];
            return query;
          };
        },
      },
    );
    return query;
  }
  return {
    client: { from, rpc: vi.fn(async () => ({ data: true, error: null })) },
    calls,
  };
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("calendar appointment query", () => {
  it("loads the full bounded period under tenant scope and only the selected event history", async () => {
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "true");
    requireOrgContext.mockResolvedValue({ organization: { id: org } });
    const { client, calls } = database();
    createClient.mockResolvedValue(client);
    const result = await getBookings(site, "upcoming", 9, undefined, {
      mode: "month",
      date: "2026-11-04",
      appointment: "appointment-29",
    });
    expect(result.enabled && result.appointments).toHaveLength(30);
    expect(result.enabled && result.calendar?.selected).toBe("appointment-29");
    for (const table of [
      "appointments",
      "booking_blocks",
      "appointment_events",
    ]) {
      expect(calls).toContainEqual({
        table,
        method: "eq",
        args: ["organization_id", org],
      });
    }
    expect(calls).toContainEqual({
      table: "appointments",
      method: "range",
      args: [0, 499],
    });
    expect(calls).toContainEqual({
      table: "appointments",
      method: "lt",
      args: ["starts_at", "2026-12-13T05:00:00.000Z"],
    });
    expect(calls).toContainEqual({
      table: "appointments",
      method: "gt",
      args: ["ends_at", "2026-11-01T04:00:00.000Z"],
    });
    expect(calls).toContainEqual({
      table: "appointment_events",
      method: "in",
      args: ["appointment_id", ["appointment-29"]],
    });
  });
  it("does not query booking tables when rollout is disabled", async () => {
    vi.stubEnv("VIGIL_BOOKINGS_ENABLED", "false");
    requireOrgContext.mockResolvedValue({ organization: { id: org } });
    const { client, calls } = database();
    createClient.mockResolvedValue(client);
    expect((await getBookings(site)).enabled).toBe(false);
    expect(calls.every((c) => c.table === "websites")).toBe(true);
  });
});
