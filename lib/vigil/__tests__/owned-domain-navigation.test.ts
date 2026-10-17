import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
const mocks = vi.hoisted(() => ({ client: {}, redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => false, createAdminClient: vi.fn() }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContextOrThrow: async () => ({ organization: { id: "org-a" }, user: { id: "owner-a" } }), assertOrgRole: vi.fn() }));
vi.mock("@/lib/vigil/rate-limit", () => ({ enforceRateLimit: vi.fn(), RATE_LIMITS: { domainStartOrg: {} } }));
vi.mock("@/lib/vigil/audit", () => ({ logAuditEvent: vi.fn() }));
import { startDomainConnection } from "../actions/domain";

describe("owned-domain save navigation", () => {
  beforeEach(() => vi.clearAllMocks());
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

it("resumes the same domain/site on a lost-response retry without duplicating or re-staging it",async()=>{
  const db=new FakeAdmin({websites:[{id:"site-a",organization_id:"org-a",status:"building"}],domains:[{id:"existing",hostname:"owned-example.com",organization_id:"org-a",website_id:"site-a",status:"verifying",verification:{source:"provider"}}]});mocks.client=db.asClient();const data=new FormData();data.set("hostname","owned-example.com");data.set("website_id","site-a");
  await expect(startDomainConnection(null,data)).rejects.toThrow("NEXT_REDIRECT:/dashboard/domain?flow=own&domain=existing");expect(db.rows("domains")).toHaveLength(1);expect(db.rows("domains")[0].verification).toEqual({source:"provider"});
});
it("rejects another tenant’s website before inserting the customer domain",async()=>{
  const db=new FakeAdmin({websites:[{id:"site-a",organization_id:"org-b",status:"building"}]});mocks.client=db.asClient();const data=new FormData();data.set("hostname","owned-example.com");data.set("website_id","site-a");expect(await startDomainConnection(null,data)).toMatchObject({ok:false,code:"validation"});expect(db.rows("domains")).toHaveLength(0);
});
