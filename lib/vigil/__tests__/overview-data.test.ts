import { describe, expect, it } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { getOverviewLeads } from "../queries/overview";
const asOf = "2026-10-26T18:30:00Z";
function database(seed: ConstructorParameters<typeof FakeAdmin>[0]) {
  const fake = new FakeAdmin(seed),
    base = fake.from.bind(fake);
  let pages = 0;
  fake.from = (table: string) => {
    const query = base(table);
    let limit = Infinity;
    Object.assign(query, {
      range: async (start: number, end: number) => {
        pages++;
        const result = query.run();
        return { ...result, data: result.data?.slice(start, end + 1) };
      },
      limit: (n: number) => {
        limit = n;
        return query;
      },
      then: <T>(resolve: (v: ReturnType<typeof query.run>) => T) => {
        const result = query.run();
        return Promise.resolve(
          resolve({ ...result, data: result.data?.slice(0, limit) ?? null }),
        );
      },
    });
    return query;
  };
  return { client: fake.asClient(), pages: () => pages };
}
describe("overview tenant and website isolation", () => {
  it("scopes history, backlog, unread and capture settings to the selected customer website", async () => {
    const lead = {
      received_at: "2026-10-26T12:00:00Z",
      status: "new",
      read_at: null,
      source: "contact",
    };
    const db = database({
      leads: [
        {
          ...lead,
          id: "correct",
          organization_id: "org-a",
          website_id: "site-a",
        },
        {
          ...lead,
          id: "other-site",
          organization_id: "org-a",
          website_id: "site-b",
        },
        {
          ...lead,
          id: "other-org",
          organization_id: "org-b",
          website_id: "site-a",
        },
      ],
      website_contact_settings: [
        { organization_id: "org-b", website_id: "site-a", enabled: true },
      ],
    });
    const result = await getOverviewLeads(db.client, "org-a", "site-a", asOf);
    expect(result.reports[30].total).toBe(1);
    expect(result.awaiting).toBe(1);
    expect(result.unread).toBe(1);
    expect(result.queue.map((r) => r.id)).toEqual(["correct"]);
    expect(result.recent.map((r) => r.id)).toEqual(["correct"]);
    expect(result.captureEnabled).toBe(false);
    expect(result.completeHistory).toBe(true);
  });
  it("reads beyond the Supabase first-page limit before computing totals", async () => {
    const db = database({
      leads: Array.from({ length: 1002 }, (_, i) => ({
        id: String(i),
        organization_id: "org-a",
        website_id: "site-a",
        received_at: "2026-10-26T12:00:00Z",
        status: "new",
        read_at: null,
        source: "contact",
      })),
    });
    const result = await getOverviewLeads(db.client, "org-a", "site-a", asOf);
    expect(db.pages()).toBe(2);
    expect(result.reports[30].total).toBe(1002);
    expect(result.completeHistory).toBe(true);
    expect(result.queue).toHaveLength(5);
  });
  it("marks capped chart history as incomplete while retaining exact all-time inbox counts", async () => {
    const db = database({
      leads: Array.from({ length: 10001 }, (_, i) => ({
        id: String(i),
        organization_id: "org-a",
        website_id: "site-a",
        received_at: "2026-10-26T12:00:00Z",
        status: "new",
        read_at: null,
        source: "contact",
      })),
    });
    const result = await getOverviewLeads(db.client, "org-a", "site-a", asOf);
    expect(result.completeHistory).toBe(false);
    expect(result.historyCount).toBe(10001);
    expect(result.reports[30].total).toBe(10000);
    expect(result.awaiting).toBe(10001);
    expect(db.pages()).toBe(10);
  });
});
