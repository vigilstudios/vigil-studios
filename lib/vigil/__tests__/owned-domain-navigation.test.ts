import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
const mocks = vi.hoisted(() => ({ client: {}, role: "owner", isImpersonating: false, staffRole: null as "admin" | "staff" | null, redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => false, createAdminClient: vi.fn() }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContextOrThrow: async () => ({ organization: { id: "org-a" }, user: { id: "owner-a" }, role: mocks.role, isImpersonating: mocks.isImpersonating, staffRole: mocks.staffRole }), assertOrgRole: vi.fn() }));
vi.mock("@/lib/vigil/rate-limit", () => ({ enforceRateLimit: vi.fn(), RATE_LIMITS: { domainStartOrg: {} } }));
vi.mock("@/lib/vigil/audit", () => ({ logAuditEvent: vi.fn() }));
import { startDomainConnection } from "../actions/domain";

describe("owned-domain save navigation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.role = "owner"; mocks.isImpersonating = false; mocks.staffRole = null; });
  const form = (hostname = "owned-example.com") => { const data = new FormData(); data.set("hostname", hostname); data.set("website_id", "site-a"); return data; };
  it("redirects to the exact created domain after saving, without swallowing the redirect", async () => {
    const db = new FakeAdmin({ websites: [{ id: "site-a", organization_id: "org-a", status: "building" }], domains: [{ id: "old", hostname: "other-example.com", organization_id: "org-a" }] });
    mocks.client = db.asClient();
    await expect(startDomainConnection(null, form())).rejects.toThrow("NEXT_REDIRECT:/dashboard/domain?flow=own&domain=id_1");
    expect(db.rows("domains")[1]).toMatchObject({ organization_id: "org-a", website_id: "site-a", hostname: "owned-example.com", source: "customer_owned", status: "pending" });
  });
  it("keeps validation errors on the entry step", async () => {
    const db = new FakeAdmin(); mocks.client = db.asClient();
    expect(await startDomainConnection(null, form("not a domain"))).toMatchObject({ ok: false, code: "validation" });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(db.rows("domains")).toHaveLength(0);
  });
  it("does not reuse a domain attached to a different website", async () => {
    const db = new FakeAdmin({ websites: [{ id: "site-a", organization_id: "org-a", status: "building" }], domains: [{ id: "old", hostname: "owned-example.com", organization_id: "org-a" }] }); mocks.client = db.asClient();
    expect(await startDomainConnection(null, form())).toMatchObject({ ok: false, code: "validation" });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(db.rows("domains")).toHaveLength(1);
  });
});

describe("continuing a saved Vercel purchase choice", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("DOMAIN_HANDOFF_ENABLED", "true"); mocks.role = "owner"; mocks.isImpersonating = false; mocks.staffRole = null; });
  const form = () => { const data = new FormData(); for (const [key, value] of Object.entries({ hostname: "saved-example.com", website_id: "site-a", registrar: "vercel", journey: "vercel_purchase", intent_version: "2" })) data.set(key, value); return data; };
  const fixture = (intent = {}) => new FakeAdmin({ websites: [{ id: "site-a", organization_id: "org-a", status: "building" }], domain_purchase_intents: [{ id: "intent-a", organization_id: "org-a", website_id: "site-a", hostname: "saved-example.com", phase: "handoff_started", version: 2, ...intent }] });
  it("saves the exact selected domain and redirects directly to its guide", async () => {
    const db = fixture(); mocks.client = db.asClient();
    await expect(startDomainConnection(null, form())).rejects.toThrow("NEXT_REDIRECT:/dashboard/domain?flow=own&domain=id_1");
    expect(db.rows("domains")[0]).toMatchObject({ hostname: "saved-example.com", registrar: "vercel", status: "pending", website_id: "site-a", organization_id: "org-a" });
    expect(db.rows("domain_purchase_intents")[0].phase).toBe("handoff_started");
  });
  it.each([{ isImpersonating: true, role: "owner" }, { isImpersonating: false, role: "member" }])("lets a verified administrator continue the actual saved setup: %j", async actor => {
    mocks.staffRole = "admin"; mocks.isImpersonating = actor.isImpersonating; mocks.role = actor.role;
    const db = fixture(); mocks.client = db.asClient();
    await expect(startDomainConnection(null, form())).rejects.toThrow("NEXT_REDIRECT:/dashboard/domain?flow=own&domain=id_1");
    expect(db.rows("domains")[0]).toMatchObject({ status: "pending", hostname: "saved-example.com" });
  });
  it.each([{ phase: "cancelled" }, { hostname: "replacement.com" }, { version: 3 }, { organization_id: "org-b" }, { website_id: "site-b" }])("rejects a stale or unrelated saved choice before starting setup: %j", async intent => {
    const db = fixture(intent); mocks.client = db.asClient();
    expect(await startDomainConnection(null, form())).toMatchObject({ ok: false, code: "validation" });
    expect(db.rows("domains")).toHaveLength(0); expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it.each(["staff", "member"])("denies %s continuation before creating a domain", async actor => {
    mocks.isImpersonating = actor === "staff"; mocks.role = actor === "member" ? "member" : "owner";
    const db = fixture(); mocks.client = db.asClient();
    expect(await startDomainConnection(null, form())).toMatchObject({ ok: false, code: "forbidden" }); expect(db.rows("domains")).toHaveLength(0);
  });
  it("fails closed when the saved-handoff feature is disabled", async () => {
    vi.stubEnv("DOMAIN_HANDOFF_ENABLED", "false"); const db = fixture(); mocks.client = db.asClient();
    expect(await startDomainConnection(null, form())).toMatchObject({ ok: false, code: "validation" }); expect(db.rows("domains")).toHaveLength(0);
  });
});

it("resumes the same domain/site on a lost-response retry without duplicating or re-staging it",async()=>{
  const db=new FakeAdmin({websites:[{id:"site-a",organization_id:"org-a",status:"building"}],domains:[{id:"existing",hostname:"owned-example.com",organization_id:"org-a",website_id:"site-a",status:"verifying",verification:{source:"provider"}}]});mocks.client=db.asClient();const data=new FormData();data.set("hostname","owned-example.com");data.set("website_id","site-a");
  await expect(startDomainConnection(null,data)).rejects.toThrow("NEXT_REDIRECT:/dashboard/domain?flow=own&domain=existing");expect(db.rows("domains")).toHaveLength(1);expect(db.rows("domains")[0].verification).toEqual({source:"provider"});
});
it("rejects another tenant’s website before inserting the customer domain",async()=>{
  const db=new FakeAdmin({websites:[{id:"site-a",organization_id:"org-b",status:"building"}]});mocks.client=db.asClient();const data=new FormData();data.set("hostname","owned-example.com");data.set("website_id","site-a");expect(await startDomainConnection(null,data)).toMatchObject({ok:false,code:"validation"});expect(db.rows("domains")).toHaveLength(0);
});
