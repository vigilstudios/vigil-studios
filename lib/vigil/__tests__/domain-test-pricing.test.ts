import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { domainTestPrice } from "../domain-engine/test-pricing";
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SERVICE_FEE_MINOR", "500");
  vi.stubEnv("VIGIL_DOMAIN_TEST_MAX_TOTAL_MINOR", "3000");
});
afterEach(() => vi.unstubAllEnvs());
describe("sandbox checkout pricing", () => {
  it("keeps the quoted customer amount distinct from registrar cost", () => {
    expect(domainTestPrice(1799)).toEqual({
      serviceFeeMinor: 500,
      subtotalMinor: 2299,
      taxMinor: 0,
      totalMinor: 2299,
    });
  });
  it("refuses totals above the approved ceiling and accepts its exact boundary", () => {
    expect(() => domainTestPrice(2501)).toThrow("limit");
    expect(domainTestPrice(2500).totalMinor).toBe(3000);
  });
  it("refuses invalid fee configuration instead of constructing a payment", () => {
    for (const fee of ["-1", "NaN", "0.5", "10001"]) {
      vi.stubEnv("VIGIL_DOMAIN_TEST_SERVICE_FEE_MINOR", fee);
      expect(() => domainTestPrice(1799)).toThrow();
    }
  });
  it("cannot supply live pricing or target a hosted database", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => domainTestPrice(1799)).toThrow();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://production.example.test");
    expect(() => domainTestPrice(1799)).toThrow();
  });
});
