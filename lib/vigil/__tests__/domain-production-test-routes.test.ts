import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ auth: vi.fn(), admin: vi.fn() }));
vi.mock("../auth/session", () => ({ requireOrgContextOrThrow: state.auth, assertOrgRole: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: state.admin }));
import { POST as testCheckout } from "@/app/api/domain-engine/test/route";
import { POST as demo } from "@/app/api/domain-engine/demo/route";
import { POST as testWebhook } from "@/app/api/webhooks/domain-stripe/route";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_MOCK_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "mock");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
});
afterEach(() => vi.unstubAllEnvs());
describe("production conceals all domain test transaction endpoints", () => {
  it.each([["production", "preview"], ["development", "production"]])("blocks forged test approval flags in NODE_ENV=%s / VERCEL_ENV=%s", async (nodeEnv, vercelEnv) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    for (const handler of [testCheckout, demo, testWebhook]) {
      const request = new NextRequest("https://vigil.example.test/api/test", { method: "POST", body: "{}" });
      const response = await handler(request);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Not found" });
      expect(request.bodyUsed).toBe(false);
    }
    expect(state.auth).not.toHaveBeenCalled();
    expect(state.admin).not.toHaveBeenCalled();
  });
});
