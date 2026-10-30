import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: state.rpc }),
}));
import { POST } from "@/app/api/webhooks/namecom/route";
import { POST as livePOST } from "@/app/api/webhooks/namecom-live/route";
const url = "http://localhost:3187/api/webhooks/namecom",
  key = "fictional-signing-token",
  raw = '{"action":"updated","domain":"fixture.com"}';
function request(nonce = "10000000-0000-4000-8000-000000000001", body = raw) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "x-namecom-signature": `sha256=${createHmac("sha256", key).update(`${url}|${raw}`).digest("hex")},${Math.floor(Date.now() / 1000)},${nonce}`,
    },
    body,
  });
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "namecom");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("VIGIL_NAMECOM_SANDBOX_USERNAME", "fixture-test");
  vi.stubEnv("VIGIL_NAMECOM_SANDBOX_WEBHOOK_TOKEN", key);
  vi.stubEnv("VIGIL_NAMECOM_SANDBOX_WEBHOOK_URL", url);
  state.rpc.mockReset().mockResolvedValue({ data: true, error: null });
});

describe("live registrar notifications before purchasing admission", () => {
  const liveUrl = "https://www.vigilstudios.co/api/webhooks/namecom-live";
  function liveRequest(validSignature = true) {
    return new NextRequest(liveUrl, {
      method: "POST",
      headers: {
        "x-namecom-signature": `sha256=${createHmac("sha256", validSignature ? key : "wrong-key").update(`${liveUrl}|${raw}`).digest("hex")},${Math.floor(Date.now() / 1000)},10000000-0000-4000-8000-000000000001`,
      },
      body: raw,
    });
  }
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VIGIL_DOMAIN_LIVE_ENABLED", "true");
    vi.stubEnv("VIGIL_NAMECOM_USERNAME", "fixture");
    vi.stubEnv("VIGIL_NAMECOM_WEBHOOK_TOKEN", key);
    vi.stubEnv("VIGIL_NAMECOM_WEBHOOK_URL", liveUrl);
  });
  it("acknowledges a verified pre-policy signal without inventing purchase approval", async () => {
    state.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "42501", message: "Unknown registrar account" },
    });
    const response = await livePOST(liveRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, ignored: true });
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith(
      "record_managed_domain_signal",
      {
        p_account_scope: expect.stringMatching(/^namecom:live:[a-f0-9]{64}$/),
        p_payload_digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    );
  });
  it.each([
    { code: "42501", message: "Service access required" },
    { code: "08006", message: "Unknown registrar account" },
    { code: "08006", message: "Private database write failed" },
  ])("keeps other inbox failures retriable: $code / $message", async (error) => {
    state.rpc.mockResolvedValueOnce({ data: null, error });
    const response = await livePOST(liveRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Registrar notification could not be saved.",
    });
  });
  it("verifies the signature before considering the pre-policy exception", async () => {
    expect((await livePOST(liveRequest(false))).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("retains durable inbox processing after the account is admitted", async () => {
    const response = await livePOST(liveRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: false });
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("registrar notification inbox", () => {
  it("atomically records only a content digest and queues a read-only wakeup", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("record_managed_domain_signal", {
      p_account_scope: expect.stringMatching(/^namecom:test:[a-f0-9]{64}$/),
      p_payload_digest: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(JSON.stringify(state.rpc.mock.calls)).not.toContain("fixture.com");
    expect(JSON.stringify(state.rpc.mock.calls)).not.toContain(key);
  });
  it("deduplicates the signed body despite changed unsigned nonces", async () => {
    await POST(request());
    state.rpc.mockResolvedValueOnce({ data: false, error: null });
    const response = await POST(
      request("20000000-0000-4000-8000-000000000002"),
    );
    expect(await response.json()).toMatchObject({ duplicate: true });
    expect(state.rpc.mock.calls[0][1]).toEqual(state.rpc.mock.calls[1][1]);
  });
  it("rejects invalid or oversized notifications without a database write", async () => {
    expect(
      (await POST(request(undefined, raw.replace("updated", "deleted"))))
        .status,
    ).toBe(400);
    expect((await POST(request(undefined, "x".repeat(65537)))).status).toBe(
      400,
    );
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("remains unavailable in production and fails closed when signing is unconfigured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(request())).status).toBe(404);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VIGIL_NAMECOM_SANDBOX_WEBHOOK_TOKEN", "");
    expect((await POST(request())).status).toBe(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("returns a retriable failure if the durable inbox cannot be saved", async () => {
    state.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "private database payload" },
    });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private");
  });
});
