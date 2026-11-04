import { beforeEach, describe, expect, it, vi } from "vitest";
import { getVercelOidcToken } from "@vercel/oidc";
import { measurementConfig, searchAccessToken } from "./providers";

vi.mock("@vercel/oidc", () => ({ getVercelOidcToken: vi.fn() }));
const config = {
  googleWifAudience:
    "//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/reporting/providers/vercel",
  googleServiceAccountEmail:
    "search-reader@client-reporting.iam.gserviceaccount.com",
};
const now = new Date("2026-11-03T12:00:00Z");
const reply = (body: unknown, status = 200) => Response.json(body, { status });

beforeEach(() => {
  vi.mocked(getVercelOidcToken).mockReset();
});
describe("keyless Google search authorization", () => {
  it("exchanges the current assertion only with fixed Google endpoints and mints a short-lived read-only token", async () => {
    vi.mocked(getVercelOidcToken).mockResolvedValue("vercel-assertion");
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply({ access_token: "sts-token" }))
      .mockResolvedValueOnce(reply({ accessToken: "search-token" }));
    expect(await searchAccessToken(config, now, request)).toBe("search-token");
    expect(getVercelOidcToken).toHaveBeenCalledTimes(1);
    const [exchangeUrl, exchange] = request.mock.calls[0];
    expect(exchangeUrl).toBe("https://sts.googleapis.com/v1/token");
    const form = new URLSearchParams(String(exchange?.body));
    expect(form.get("subject_token")).toBe("vercel-assertion");
    expect(form.get("audience")).toBe(config.googleWifAudience);
    expect(form.get("scope")).toBe(
      "https://www.googleapis.com/auth/cloud-platform",
    );
    const [impersonationUrl, impersonation] = request.mock.calls[1];
    expect(impersonationUrl).toBe(
      "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/search-reader%40client-reporting.iam.gserviceaccount.com:generateAccessToken",
    );
    expect(impersonation?.headers).toMatchObject({
      Authorization: "Bearer sts-token",
    });
    expect(JSON.parse(String(impersonation?.body))).toEqual({
      scope: ["https://www.googleapis.com/auth/webmasters.readonly"],
      lifetime: "600s",
    });
    for (const [, init] of request.mock.calls) {
      expect(init?.redirect).toBe("error");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });
  it.each([
    { ...config, googleWifAudience: "https://attacker.example/token" },
    {
      ...config,
      googleWifAudience: config.googleWifAudience + "?redirect=private",
    },
    { ...config, googleServiceAccountEmail: "reader@attacker.example" },
    { ...config, googleServiceAccountEmail: undefined },
    { ...config, googleWifAudience: undefined },
  ])(
    "rejects malformed or incomplete federation config before obtaining credentials",
    async (bad) => {
      const request = vi.fn<typeof fetch>();
      await expect(searchAccessToken(bad, now, request)).rejects.toMatchObject({
        code: "configuration_required",
      });
      expect(request).not.toHaveBeenCalled();
      expect(getVercelOidcToken).not.toHaveBeenCalled();
    },
  );
  it("does not fall back to a private key when federation identity is unavailable", async () => {
    vi.mocked(getVercelOidcToken).mockRejectedValue(
      new Error("private diagnostic"),
    );
    const request = vi.fn<typeof fetch>();
    await expect(
      searchAccessToken(
        { ...config, googleServiceAccount: "private-value" },
        now,
        request,
      ),
    ).rejects.toMatchObject({ message: "configuration_required" });
    expect(request).not.toHaveBeenCalled();
  });
  it("does not forward denied upstream bodies or continue to impersonation", async () => {
    vi.mocked(getVercelOidcToken).mockResolvedValue("vercel-assertion");
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(reply({ error: "sensitive upstream detail" }, 403));
    await expect(searchAccessToken(config, now, request)).rejects.toMatchObject(
      { message: "permission_required" },
    );
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("reads only server-side federation configuration", () => {
    vi.stubEnv("GOOGLE_SEARCH_WIF_AUDIENCE", config.googleWifAudience);
    vi.stubEnv(
      "GOOGLE_SEARCH_SERVICE_ACCOUNT_EMAIL",
      config.googleServiceAccountEmail,
    );
    try {
      expect(measurementConfig()).toMatchObject(config);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
