import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FakeAdmin } from "./fake-admin";
const state = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}));
vi.mock("../auth/session", () => ({
  requireOrgContextOrThrow: async () => ({
    organization: { id: "org" },
    user: { id: "owner" },
    role: "owner",
    isImpersonating: false,
  }),
  assertOrgRole: async () => {},
  getSessionUser: async () => ({ id: "owner" }),
}));
vi.mock("../rate-limit", () => ({ enforceRateLimit: async () => {} }));
vi.mock("../services/dns", () => ({
  detectRegistrar: async () => ({ registrar: "other" }),
}));
import { POST } from "@/app/api/domain-engine/route";
const project = "10000000-0000-4000-8000-000000000001";
let admin: FakeAdmin;
function request(body: unknown, origin = "https://vigil.example.com") {
  return new NextRequest("https://vigil.example.com/api/domain-engine", {
    method: "POST",
    headers: {
      host: "vigil.example.com",
      origin,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  admin = new FakeAdmin({
    projects: [{ id: project, organization_id: "org" }],
    websites: [{ id: "website", project_id: project, organization_id: "org" }],
  });
  vi.spyOn(admin, "rpc").mockImplementation(async () => ({
    data: null,
    error: null,
  }));
  state.client = admin.asClient();
});
afterEach(() => vi.unstubAllEnvs());
describe("domain dashboard API boundaries", () => {
  it("rejects cross-site requests before saving a claim", async () => {
    expect(
      (
        await POST(
          request(
            { action: "existing", fqdn: "fixture.com" },
            "https://attacker.com",
          ),
        )
      ).status,
    ).toBe(403);
    expect(admin.rows("domains")).toHaveLength(0);
  });
  it("keeps production purchases and DNS writes disabled", async () => {
    for (const action of ["purchase", "renewal", "authorize_dns"])
      expect((await POST(request({ action }))).status).toBe(403);
    expect(admin.rows("provider_links")).toHaveLength(0);
  });
  it("refuses a project from another tenant", async () => {
    admin.rows("projects")[0].organization_id = "another-org";
    expect(
      (
        await POST(
          request({
            action: "existing",
            fqdn: "fixture.com",
            projectId: project,
          }),
        )
      ).status,
    ).toBe(403);
    expect(admin.rows("domains")).toHaveLength(0);
  });
  it("links assisted setup to the intended existing website without attaching or changing DNS", async () => {
    const response = await POST(
      request({ action: "existing", fqdn: "FIXTURE.COM", projectId: project }),
    );
    expect(response.status).toBe(200);
    expect(admin.rows("domains")[0]).toMatchObject({
      hostname: "fixture.com",
      organization_id: "org",
      website_id: "website",
      status: "pending",
    });
    expect(admin.rpc).toHaveBeenCalledWith("request_domain_assistance", {
      p_domain_id: admin.rows("domains")[0].id,
    });
    expect((await response.json()).existing.status).toBe("assistance_required");
    expect(admin.rows("provider_links")).toHaveLength(0);
  });
  it("refuses to move an existing domain off another website", async () => {
    admin.rows("domains").push({
      id: "domain",
      organization_id: "org",
      hostname: "fixture.com",
      website_id: "another-website",
    });
    expect(
      (
        await POST(
          request({
            action: "existing",
            fqdn: "fixture.com",
            projectId: project,
          }),
        )
      ).status,
    ).toBe(409);
    expect(admin.rows("domains")[0].website_id).toBe("another-website");
  });
});
