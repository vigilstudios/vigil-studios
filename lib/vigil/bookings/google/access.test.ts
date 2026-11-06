import { beforeEach, describe, it, expect, vi } from "vitest";
const { getOrgContext, createClient } = vi.hoisted(() => ({
  getOrgContext: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@/lib/vigil/auth/session", () => ({ getOrgContext }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
import { calendarOwner } from "./access";
import { FakeAdmin } from "../../__tests__/fake-admin";
const ctx = {
  organization: { id: "org-a" },
  role: "owner",
  isImpersonating: false,
};
beforeEach(() => vi.clearAllMocks());
describe("personal calendar authorization", () => {
  it("refuses staff impersonation and read-only members before reading website records", async () => {
    getOrgContext.mockResolvedValue({ ...ctx, isImpersonating: true });
    expect(await calendarOwner("site")).toBeNull();
    getOrgContext.mockResolvedValue({ ...ctx, role: "member" });
    expect(await calendarOwner("site")).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("verifies the website belongs to the active business", async () => {
    getOrgContext.mockResolvedValue(ctx);
    const fake = new FakeAdmin({
      websites: [{ id: "site", organization_id: "org-b" }],
    });
    createClient.mockResolvedValue(fake.asClient());
    expect(await calendarOwner("site")).toBeNull();
  });
  it("allows disconnection after downgrade while refusing a new connection", async () => {
    getOrgContext.mockResolvedValue(ctx);
    const fake = new FakeAdmin({
      websites: [{ id: "site", organization_id: "org-a", name: "Studio" }],
      booking_settings: [
        { website_id: "site", organization_id: "org-a", time_zone: "UTC" },
      ],
    });
    const client = fake.asClient();
    client.rpc = vi.fn(async () => ({
      data: false,
      error: null,
    })) as unknown as typeof client.rpc;
    createClient.mockResolvedValue(client);
    expect(await calendarOwner("site")).toBeNull();
    expect((await calendarOwner("site", false))?.site.id).toBe("site");
  });
});
