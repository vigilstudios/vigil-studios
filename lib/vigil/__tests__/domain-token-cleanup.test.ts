import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ rpc: vi.fn(), jobs: vi.fn(), orders: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => true, createAdminClient: () => ({ rpc: state.rpc }) }));
vi.mock("../jobs", () => ({ runDueJobs: state.jobs }));
vi.mock("../contact/provision", () => ({ reconcileContactSetup: vi.fn(async () => ({})) }));
vi.mock("../services/reconcile", () => ({ reconcileOrders: state.orders }));
import { POST } from "@/app/api/jobs/run/route";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VIGIL_JOBS_SECRET", "fixture-only");
  vi.stubEnv("CRON_SECRET", "");
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "false");
  vi.stubEnv("VIGIL_DOMAIN_CLOUDFLARE_ENABLED", "false");
  state.rpc.mockResolvedValue({ data: 1, error: null });
  state.jobs.mockResolvedValue([]);
  state.orders.mockResolvedValue({});
});
afterEach(() => vi.unstubAllEnvs());
describe("DNS credential expiry after disabling admission", () => {
  it("keeps removing expired tokens when both domain flags are off", async () => {
    const response = await POST(new NextRequest("https://vigil.example.test/api/jobs/run?reconcile=0", { method: "POST", headers: { authorization: "Bearer fixture-only" } }));
    expect(response.status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("expire_external_dns_tokens");
    expect(state.jobs).toHaveBeenCalledTimes(1);
  });
  it("still denies unauthenticated callers before touching stored credentials", async () => {
    expect((await POST(new NextRequest("https://vigil.example.test/api/jobs/run", { method: "POST" }))).status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.jobs).not.toHaveBeenCalled();
  });
});
