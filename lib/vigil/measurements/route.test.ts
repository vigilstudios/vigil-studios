import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  configured: vi.fn(() => true),
  run: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.create,
  hasAdminClient: mocks.configured,
}));
vi.mock("./service", () => ({ runMeasurementBatch: mocks.run }));
import { GET } from "@/app/api/jobs/analytics/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("analytics job boundary", () => {
  it("requires a real secret even when the collection flag is off", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("VIGIL_JOBS_SECRET", "");
    const response = await GET(
      new NextRequest("https://app.example.com/api/jobs/analytics"),
    );
    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps the disabled release inert after valid cron authentication", async () => {
    vi.stubEnv("CRON_SECRET", "private");
    vi.stubEnv("VIGIL_MEASUREMENTS_ENABLED", "false");
    const response = await GET(
      new NextRequest("https://app.example.com/api/jobs/analytics", {
        headers: { authorization: "Bearer private" },
      }),
    );
    expect(await response.json()).toEqual({ enabled: false });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
