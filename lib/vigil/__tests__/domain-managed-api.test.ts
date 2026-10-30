import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DomainEngineError } from "../domain-engine/errors";
import { FakeAdmin } from "./fake-admin";
const state = vi.hoisted(() => ({
  client: null as unknown,
  impersonating: false,
  role: "owner",
  bind: vi.fn(),
  prepare: vi.fn(),
  apply: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.client,
}));
vi.mock("../auth/session", () => ({
  requireOrgContextOrThrow: async () => ({
    organization: { id: "org" },
    user: { id: "owner" },
    isImpersonating: state.impersonating,
  }),
  assertOrgRole: async () => {
    if (state.role !== "owner")
      throw new DomainEngineError("owner_required", "Owner required", 403);
  },
}));
vi.mock("../rate-limit", () => ({ enforceRateLimit: async () => {} }));
vi.mock("../domain-engine/managed-connection", () => ({
  bindManagedDomain: state.bind,
  prepareManagedDns: state.prepare,
  applyManagedDns: state.apply,
}));
import { POST } from "@/app/api/domain-engine/test/connection/route";
const registrationId = "10000000-0000-4000-8000-000000000001",
  websiteId = "10000000-0000-4000-8000-000000000002";
function request(body: unknown, origin = "http://localhost:3187") {
  return new NextRequest(
    "http://localhost:3187/api/domain-engine/test/connection",
    {
      method: "POST",
      headers: {
        origin,
        host: "localhost:3187",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "namecom");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  state.impersonating = false;
  state.role = "owner";
  state.bind.mockReset().mockResolvedValue({ domainId: "domain" });
  state.prepare.mockReset().mockResolvedValue({ id: "plan" });
  state.apply.mockReset().mockResolvedValue({ applied: true });
  state.client = new FakeAdmin({domain_registrations:[{id:registrationId,organization_id:"org",environment:"test"}]}).asClient();
});
afterEach(() => vi.unstubAllEnvs());
describe("managed domain test API", () => {
  it("requires same-origin customer-owner consent and refuses staff impersonation", async () => {
    expect(
      (
        await POST(
          request(
            { action: "bind", registrationId, websiteId },
            "https://attacker.example",
          ),
        )
      ).status,
    ).toBe(403);
    state.impersonating = true;
    expect(
      (await POST(request({ action: "bind", registrationId, websiteId })))
        .status,
    ).toBe(403);
    state.impersonating = false;
    state.role = "manager";
    expect(
      (await POST(request({ action: "bind", registrationId, websiteId })))
        .status,
    ).toBe(403);
    expect(state.bind).not.toHaveBeenCalled();
  });
  it("does not expose the write route in production or with the feature disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      (await POST(request({ action: "plan", registrationId }))).status,
    ).toBe(404);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "false");
    expect(
      (await POST(request({ action: "plan", registrationId }))).status,
    ).toBe(404);
    expect(state.prepare).not.toHaveBeenCalled();
  });
  it("rejects client-supplied records, domain names and provider IDs", async () => {
    expect(
      (
        await POST(
          request({
            action: "plan",
            registrationId,
            records: [{ type: "MX", answer: "attacker.example" }],
          }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          request({
            action: "bind",
            registrationId,
            websiteId,
            siteExternalId: "real-project",
          }),
        )
      ).status,
    ).toBe(422);
    expect(state.bind).not.toHaveBeenCalled();
    expect(state.prepare).not.toHaveBeenCalled();
  });
  it("binds server-authenticated identities and requires literal approval before applying", async () => {
    expect(
      (await POST(request({ action: "bind", registrationId, websiteId })))
        .status,
    ).toBe(200);
    expect(state.bind).toHaveBeenCalledWith(
      state.client,
      registrationId,
      websiteId,
      "org",
      "owner",
    );
    expect(
      (
        await POST(
          request({ action: "apply", planId: registrationId, consent: false }),
        )
      ).status,
    ).toBe(422);
    expect(state.apply).not.toHaveBeenCalled();
    expect(
      (
        await POST(
          request({ action: "apply", planId: registrationId, consent: true }),
        )
      ).status,
    ).toBe(200);
    expect(state.apply).toHaveBeenCalledWith(
      state.client,
      registrationId,
      "org",
      "owner",
      true,
      "test",
    );
  });
  it("hides another organization's registration", async () => {
    state.client = new FakeAdmin({
      domain_registrations: [
        {
          id: registrationId,
          organization_id: "other",
          environment: "test",
          registrar: "namecom",
        },
      ],
    }).asClient();
    expect(
      (await POST(request({ action: "status", registrationId }))).status,
    ).toBe(404);
  });
});
