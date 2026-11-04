import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import {
  collectTraffic,
  collectQuality,
  collectField,
  collectRepository,
  collectSearch,
  safePageLabel,
  securityFromHeaders,
} from "./providers";
import {
  providerJson,
  publicAddress,
  publicHeaders,
  publicOrigin,
} from "./http";

const now = new Date("2026-11-02T12:00:00.000Z"),
  target = { origin: "https://client.example.com" };
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const requestWith = (data: unknown, status = 200) =>
  vi.fn<typeof fetch>().mockImplementation(async () => reply(data, status));
describe("traffic source", () => {
  it("uses provider period totals, production scope, bounded ranks and UTC daily buckets", async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("count"))
        return reply({ data: { visitors: 14, pageviews: 30 } });
      if (url.searchParams.get("by") === "day")
        return reply({
          data: [
            {
              timestamp: url.searchParams.get("until"),
              visitors: 7,
              pageviews: 9,
            },
          ],
        });
      if (url.searchParams.get("by") === "requestPath")
        return reply({
          data: [
            {
              requestPath: "/offer?email=private#token",
              visitors: 3,
              pageviews: 4,
            },
          ],
        });
      return reply({
        data: [
          { referrerHostname: "search.example.com", visitors: 4, pageviews: 5 },
        ],
      });
    });
    const result = await collectTraffic(
      { ...target, projectId: "prj_client" },
      { vercelToken: "private", vercelTeamId: "team_client" },
      now,
      request,
    );
    expect(request).toHaveBeenCalledTimes(13);
    expect(result.ranges["30"].visitors).toBe(14);
    expect(
      result.ranges["30"].series.reduce((sum, p) => sum + p.value, 0),
    ).toBe(7);
    expect(result.ranges["30"].series).toHaveLength(1);
    expect(result.ranges["30"].pages[0].label).toBe("/offer");
    for (const [input, init] of request.mock.calls) {
      const url = new URL(String(input));
      expect(url.searchParams.get("projectId")).toBe("prj_client");
      expect(url.searchParams.get("filter")).toBe(
        "environment eq 'production'",
      );
      expect(init?.redirect).toBe("error");
      expect(init?.cache).toBe("no-store");
    }
  });
  it("collects a 90-day daily trend within the provider's date cap without double-counting boundaries or summing period visitors", async () => {
    const spans: [string, string][] = [];
    const request = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("count"))
        return reply({ data: { visitors: 42, pageviews: 90 } });
      if (url.searchParams.get("by") !== "day") return reply({ data: [] });
      const since = url.searchParams.get("since")!,
        until = url.searchParams.get("until")!;
      if (Date.parse(until) - Date.parse(since) > 61 * 86_400_000)
        return reply({ error: { code: "invalid_group_by" } }, 400);
      spans.push([since, until]);
      return reply({ data: [{ timestamp: since, visitors: 2, pageviews: 3 }] });
    });
    const result = await collectTraffic(
      { ...target, projectId: "prj_client" },
      { vercelToken: "private" },
      now,
      request,
    );
    const ninety = spans.slice(2);
    expect(ninety).toHaveLength(2);
    expect(Date.parse(ninety[1][0]) - Date.parse(ninety[0][1])).toBe(
      86_400_000,
    );
    expect(result.ranges["90"].series).toHaveLength(2);
    expect(result.ranges["90"].visitors).toBe(42);
    expect(
      result.ranges["90"].series.reduce((sum, point) => sum + point.value, 0),
    ).toBe(4);
  });
  it("does not turn disabled collection or missing totals into zero visitors", async () => {
    await expect(
      collectTraffic(
        { ...target, projectId: "prj_client" },
        { vercelToken: "private" },
        now,
        requestWith({ error: { code: "web_analytics_not_enabled" } }, 400),
      ),
    ).rejects.toMatchObject({ code: "collection_not_enabled" });
    await expect(
      collectTraffic(
        { ...target, projectId: "prj_client" },
        { vercelToken: "private" },
        now,
        requestWith({ data: {} }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
  it("includes today's counts and omits provider-filled zero buckets when collection history is unknown", async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("count")) {
        expect(url.searchParams.get("until")).toBe("2026-11-03T00:00:00.000Z");
        return reply({ data: { visitors: 1, pageviews: 2 } });
      }
      if (url.searchParams.get("by") === "day")
        return reply({
          data: [
            {
              timestamp: url.searchParams.get("since"),
              visitors: 0,
              pageviews: 0,
            },
          ],
        });
      return reply({ data: [] });
    });
    const result = await collectTraffic(
      { ...target, projectId: "prj_client" },
      { vercelToken: "private" },
      now,
      request,
    );
    expect(result.ranges["7"]).toMatchObject({
      visitors: 1,
      pageViews: 2,
      series: [],
    });
  });
  it("limits queries to verified tracking history and retains genuine zero days within it", async () => {
    const started = "2026-11-01T09:00:00.000Z";
    const request = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("since")).toBe(started);
      if (url.pathname.endsWith("count"))
        return reply({ data: { visitors: 0, pageviews: 0 } });
      return reply({
        data:
          url.searchParams.get("by") === "day"
            ? [{ timestamp: started, visitors: 0, pageviews: 0 }]
            : [],
      });
    });
    const result = await collectTraffic(
      {
        ...target,
        projectId: "prj_client",
        trafficCollectionStartedAt: started,
      },
      { vercelToken: "private" },
      now,
      request,
    );
    expect(result.collectionStartedAt).toBe(started);
    expect(result.ranges["90"].periodStart).toBe(started);
    expect(result.ranges["90"].series).toHaveLength(1);
  });
  it("strips URL credentials, query strings and fragments from path labels", () => {
    expect(
      safePageLabel(
        "https://user:secret@client.example.com/path?token=secret#email",
      ),
    ).toBe("/path");
    expect(safePageLabel("//private.example.com/path")).toBe("Other pages");
  });
});
describe("quality and real-user evidence", () => {
  const lighthouse = {
    finalUrl: target.origin,
    fetchTime: now.toISOString(),
    lighthouseVersion: "13.0",
    categories: { performance: { score: 0.87 }, seo: { score: null } },
    audits: {
      "largest-contentful-paint": { numericValue: 1234 },
      "robots-txt": { score: 0, title: "Check robots.txt" },
    },
  };
  it("separates lab scores from missing scores and requests every audit category", async () => {
    const request = requestWith({ lighthouseResult: lighthouse });
    const result = await collectQuality(target, "mobile", {}, request);
    expect(result).toMatchObject({
      kind: "quality",
      device: "mobile",
      performance: 87,
      seo: null,
      lcpMs: 1234,
    });
    expect(
      new URL(String(request.mock.calls[0][0])).searchParams.getAll("category"),
    ).toEqual(["performance", "seo", "accessibility", "best-practices"]);
  });
  it("rejects a canonical redirect to another business and failed audits", async () => {
    await expect(
      collectQuality(
        target,
        "desktop",
        {},
        requestWith({
          lighthouseResult: {
            ...lighthouse,
            finalUrl: "https://other.example.com",
          },
        }),
      ),
    ).rejects.toMatchObject({ code: "target_redirected" });
    await expect(
      collectQuality(
        target,
        "mobile",
        {},
        requestWith({
          lighthouseResult: { ...lighthouse, runtimeError: { code: "FAILED" } },
        }),
      ),
    ).rejects.toMatchObject({ code: "audit_failed" });
  });
  it("does not invent zero Core Web Vitals for a small website", async () => {
    const result = await collectField(
      target,
      { cruxKey: "private" },
      requestWith({ error: { status: "NOT_FOUND" } }, 404),
    );
    expect(result).toMatchObject({
      sufficient: false,
      lcpMs: null,
      inpMs: null,
      cls: null,
    });
  });
  it("handles partial field metrics without conflating them with a lab audit", async () => {
    const result = await collectField(
      target,
      { cruxKey: "private" },
      requestWith({
        record: {
          key: { origin: target.origin, formFactor: "PHONE" },
          metrics: {
            cumulative_layout_shift: { percentiles: { p75: "0.04" } },
          },
          collectionPeriod: {
            firstDate: { year: 2026, month: 10, day: 1 },
            lastDate: { year: 2026, month: 10, day: 28 },
          },
        },
      }),
    );
    expect(result).toMatchObject({
      kind: "field",
      sufficient: true,
      cls: 0.04,
      lcpMs: null,
      inpMs: null,
    });
  });
});
describe("security observations", () => {
  it("measures response headers without asserting a firewall or malware scan", () => {
    const result = securityFromHeaders({
      status: 200,
      headers: {
        "strict-transport-security": "max-age=0",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'self'",
      },
    });
    expect(result.checks.find((c) => c.id === "hsts")?.status).toBe(
      "attention",
    );
    expect(result.checks.find((c) => c.id === "content_type")?.status).toBe(
      "passed",
    );
    expect(result.checks.map((c) => c.id)).not.toContain("firewall");
  });
  it("preserves a bounded dependency result and obscures external alert identifiers", async () => {
    const request = requestWith([
      {
        number: 12,
        state: "open",
        created_at: now.toISOString(),
        security_advisory: { summary: "Update dependency", severity: "high" },
      },
    ]);
    const result = await collectRepository(
      { ...target, repository: "org/client" },
      { githubToken: "private" },
      request,
    );
    expect(result).toMatchObject({ complete: true, openCount: 1 });
    expect(result.findings[0].reference).toMatch(/^[a-f0-9]{64}$/);
    expect(String(request.mock.calls[0][0])).toContain("state=open");
    expect(
      new URL(String(request.mock.calls[0][0])).searchParams.has("page"),
    ).toBe(false);
  });
  it("follows bounded same-repository cursor pagination and preserves completeness", async () => {
    const alert = (number: number) => ({
      number,
      state: "open",
      created_at: now.toISOString(),
      security_advisory: { summary: "Update dependency", severity: "high" },
    });
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json([alert(1)], {
          headers: {
            link: '<https://api.github.com/repos/org/client/dependabot/alerts?state=open&per_page=100&after=opaque-cursor>; rel="next"',
          },
        }),
      )
      .mockResolvedValueOnce(Response.json([alert(2)]));
    const result = await collectRepository(
      { ...target, repository: "org/client" },
      { githubToken: "private" },
      request,
    );
    expect(result).toMatchObject({ complete: true, openCount: 2 });
    const url = new URL(String(request.mock.calls[1][0]));
    expect(url.searchParams.get("after")).toBe("opaque-cursor");
    expect(url.searchParams.has("page")).toBe(false);
  });
  it("accepts GitHub's canonical numeric repository cursor link only for the stored binding", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json([], {
          headers: {
            link: '<https://api.github.com/repositories/12345/dependabot/alerts?after=cursor>; rel="next"',
          },
        }),
      )
      .mockResolvedValueOnce(Response.json([]));
    expect(
      await collectRepository(
        { ...target, repository: "org/client", repositoryId: "12345" },
        { githubToken: "private" },
        request,
      ),
    ).toMatchObject({ complete: true });
    expect(new URL(String(request.mock.calls[1][0])).pathname).toBe(
      "/repos/org/client/dependabot/alerts",
    );
    const foreign = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json([], {
        headers: {
          link: '<https://api.github.com/repositories/99999/dependabot/alerts?after=cursor>; rel="next"',
        },
      }),
    );
    await expect(
      collectRepository(
        { ...target, repository: "org/client", repositoryId: "12345" },
        { githubToken: "private" },
        foreign,
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
    expect(foreign).toHaveBeenCalledTimes(1);
  });
  it("resolves a name-only binding before accepting GitHub's canonical numeric cursor link", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json([], {
          headers: {
            link: '<https://api.github.com/repositories/12345/dependabot/alerts?after=cursor>; rel="next"',
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: 12345, full_name: "org/client" }),
      )
      .mockResolvedValueOnce(Response.json([]));
    expect(
      await collectRepository(
        { ...target, repository: "org/client" },
        { githubToken: "private" },
        request,
      ),
    ).toMatchObject({ complete: true });
    expect(String(request.mock.calls[1][0])).toBe(
      "https://api.github.com/repos/org/client",
    );
    expect(new URL(String(request.mock.calls[2][0])).pathname).toBe(
      "/repos/org/client/dependabot/alerts",
    );
  });
  it.each([
    "https://attacker.example/repos/org/client/dependabot/alerts?after=secret",
    "https://api.github.com/repos/other/client/dependabot/alerts?after=secret",
  ])(
    "refuses a pagination link outside the bound repository: %s",
    async (next) => {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json([], { headers: { link: `<${next}>; rel="next"` } }),
        );
      await expect(
        collectRepository(
          { ...target, repository: "org/client" },
          { githubToken: "private" },
          request,
        ),
      ).rejects.toMatchObject({ code: "invalid_response" });
      expect(request).toHaveBeenCalledTimes(1);
    },
  );
  it("keeps a capped result partial when another cursor remains", async () => {
    let page = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async () =>
      Response.json([], {
        headers: {
          link: `<https://api.github.com/repos/org/client/dependabot/alerts?after=cursor-${++page}>; rel="next"`,
        },
      }),
    );
    expect(
      await collectRepository(
        { ...target, repository: "org/client" },
        { githubToken: "private" },
        request,
      ),
    ).toMatchObject({ complete: false, openCount: 0 });
    expect(request).toHaveBeenCalledTimes(5);
  });
  it("does not treat missing repository permission as a clean security report", async () => {
    await expect(
      collectRepository(
        { ...target, repository: "org/client" },
        { githubToken: "private" },
        requestWith({ message: "private upstream body" }, 403),
      ),
    ).rejects.toMatchObject({
      code: "permission_required",
      message: "permission_required",
    });
  });
});
describe("public network boundary", () => {
  it.each([
    "http://example.com",
    "https://127.0.0.1",
    "https://[::1]",
    "https://metadata.internal",
    "https://localhost",
    "https://user:secret@example.com",
    "https://example.com:8443",
  ])("rejects unsafe origin %s", (value) =>
    expect(() => publicOrigin(value)).toThrow("invalid_target"),
  );
  it.each([
    "127.0.0.1",
    "10.1.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "192.168.1.1",
    "::1",
    "::ffff:127.0.0.1",
    "fd00::1",
    "2001:db8::1",
  ])("rejects non-public DNS result %s", (address) =>
    expect(publicAddress(address)).toBe(false),
  );
  it("rejects mixed public/private DNS answers before opening a connection", async () => {
    const resolve = vi.fn().mockResolvedValue([
      { address: "1.1.1.1", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    await expect(publicHeaders(target.origin, resolve)).rejects.toMatchObject({
      code: "private_target",
    });
  });
  it("sanitizes fetch errors and refuses oversized responses", async () => {
    await expect(
      providerJson(
        "https://provider.example.com/?key=secret",
        {},
        vi.fn().mockRejectedValue(new Error("secret")),
      ),
    ).rejects.toMatchObject({ message: "provider_unavailable" });
    await expect(
      providerJson(
        "https://provider.example.com",
        {},
        requestWith("x".repeat(4_194_304)),
      ),
    ).rejects.toMatchObject({ code: "response_too_large" });
  });
});
describe("Search Console", () => {
  it("keeps absent search history unknown instead of inventing zero clicks", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        String(input).includes("oauth2")
          ? reply({ access_token: "private-oauth" })
          : reply({}),
      );
    const result = await collectSearch(
      { ...target, searchProperty: target.origin + "/" },
      {
        googleServiceAccount: JSON.stringify({
          client_email: "reader@client.iam.gserviceaccount.com",
          private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
        }),
      },
      now,
      request,
    );
    expect(result).toMatchObject({
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
      queries: [],
    });
  });
  it("uses read-only OAuth, finalized dates, exact origin filtering and independent totals", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const config = {
      googleServiceAccount: JSON.stringify({
        client_email: "reporting@example.iam.gserviceaccount.com",
        private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      }),
    };
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input, init) => {
        if (String(input).includes("oauth2")) {
          const assertion = new URLSearchParams(String(init?.body)).get(
            "assertion",
          )!;
          expect(
            JSON.parse(
              Buffer.from(assertion.split(".")[1], "base64url").toString(),
            ).scope,
          ).toBe("https://www.googleapis.com/auth/webmasters.readonly");
          return reply({ access_token: "private-oauth" });
        }
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({
          dataState: "final",
          startDate: "2026-10-03",
          endDate: "2026-10-30",
        });
        expect(body.dimensionFilterGroups[0].filters[0].expression).toBe(
          "^https://client\\.example\\.com/",
        );
        return reply({
          rows: [
            {
              keys: body.dimensions.length ? ["client service"] : [],
              clicks: body.dimensions.length ? 2 : 10,
              impressions: 100,
              ctr: 0.1,
              position: 4,
            },
          ],
        });
      });
    const result = await collectSearch(
      { ...target, searchProperty: target.origin + "/" },
      config,
      now,
      request,
    );
    expect(result.clicks).toBe(10);
    expect(result.queries[0].clicks).toBe(2);
    expect(request).toHaveBeenCalledTimes(3);
  });
  it("refuses an unrelated property without requesting a token", async () => {
    const request = requestWith({});
    await expect(
      collectSearch(
        { ...target, searchProperty: "sc-domain:other.example.com" },
        {},
        now,
        request,
      ),
    ).rejects.toMatchObject({ code: "configuration_required" });
    expect(request).not.toHaveBeenCalled();
  });
});
