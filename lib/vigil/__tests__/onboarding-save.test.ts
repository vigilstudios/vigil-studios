import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import type { OrgContext } from "../auth/session";

const mocks = vi.hoisted(() => ({ client: {}, context: {} as OrgContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => false, createAdminClient: vi.fn() }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContextOrThrow: async () => mocks.context, assertOrgRole: vi.fn() }));
vi.mock("@/lib/vigil/rate-limit", () => ({ enforceRateLimit: vi.fn(), RATE_LIMITS: { autosaveUser: {} } }));

import { saveBriefSection } from "../actions/onboarding";

describe("onboarding saves from stale tabs", () => {
  let db: FakeAdmin;
  const offerings = { noun: "products", sections: [{ id: "group", name: "Products", items: [{ id: "item", name: "Customer product", description: "Customer context", price: "", imageAssetIds: [] }] }], notes: "Keep this context" };
  beforeEach(() => {
    mocks.context = { user: { id: "user" }, organization: { id: "org" }, role: "owner" } as OrgContext;
    db = new FakeAdmin({ projects: [{ id: "project", organization_id: "org", status: "in_progress", intake_completed_at: "2026-10-28T02:30:00Z", brief: { offerings: { noun: "products", sections: [], notes: "Submitted version" } } }] });
    mocks.client = db.asClient();
  });
  it.each([false, true])("returns a distinct submission conflict and preserves the submitted brief (completed=%s)", async completed => {
    expect(await saveBriefSection("project", "offerings", offerings, completed)).toMatchObject({ ok: false, code: "intake_submitted", error: expect.stringContaining("already been submitted") });
    expect(db.rows("projects")[0].brief).toMatchObject({ offerings: { sections: [], notes: "Submitted version" } });
  });
  it("saves the customer's context after an authorized reopening", async () => {
    Object.assign(db.rows("projects")[0], { intake_completed_at: null, status: "intake" });
    expect(await saveBriefSection("project", "offerings", offerings)).toMatchObject({ ok: true });
    expect(db.rows("projects")[0].brief).toMatchObject({ offerings });
  });
  it("still rejects a project from another workspace", async () => {
    mocks.context = { ...mocks.context, organization: { id: "other" } } as OrgContext;
    expect(await saveBriefSection("project", "offerings", offerings)).toMatchObject({ ok: false, code: "not_found" });
  });
});
