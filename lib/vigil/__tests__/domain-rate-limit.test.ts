import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ configured: true, rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => mocks.configured, createAdminClient: () => ({ rpc: mocks.rpc }) }));
import { enforceRateLimit, RATE_LIMITS } from "../rate-limit";
describe("domain discovery and handoff rate limits", () => {
  beforeEach(() => { mocks.configured = true; mocks.rpc.mockReset(); });
  it("fails closed when service-side limiting is unavailable", async () => {
    mocks.configured = false;
    await expect(enforceRateLimit("domain-search:org:a", RATE_LIMITS.domainSearchOrg, true)).rejects.toMatchObject({ code: "provider_not_configured" });
  });
  it("fails closed without logging a raw database error", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "secret=private" }, data: null });
    await expect(enforceRateLimit("domain-search:org:a", RATE_LIMITS.domainSearchOrg, true)).rejects.toThrow("Rate limiting unavailable");
  });
  it("rejects the exhausted shared window", async () => {
    mocks.rpc.mockResolvedValue({ error: null, data: false });
    await expect(enforceRateLimit("domain-handoff:org:a", RATE_LIMITS.domainHandoffOrg, true)).rejects.toMatchObject({ code: "rate_limited" });
    expect(mocks.rpc).toHaveBeenCalledWith("rate_limit", { p_key: "domain-handoff:org:a", p_limit: 30, p_window_seconds: 600 });
  });
});
