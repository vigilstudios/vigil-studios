import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeploymentProvider, DomainConfigSnapshot } from "../providers/types";
import { beginDomainVerification, verifyDomain } from "../services/domain";
import { FakeAdmin } from "./fake-admin";

const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; });

function provider(config: (hostname: string) => DomainConfigSnapshot): DeploymentProvider {
  return {
    name: "vercel",
    provisionSite: vi.fn(),
    triggerDeployment: vi.fn(),
    getDeployment: vi.fn(),
    addDomain: vi.fn(async (_site, hostname) => config(hostname)),
    removeDomain: vi.fn(),
    getDomainConfig: vi.fn(async (_site, hostname) => config(hostname)),
    deleteSite: vi.fn(),
  } as unknown as DeploymentProvider;
}

const snapshot = (hostname: string, ready: boolean): DomainConfigSnapshot => ({
  hostname,
  requiredRecords: hostname.startsWith("www.")
    ? [{ type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" }]
    : [{ type: "A", name: "@", value: "76.76.21.21" }],
  verified: ready,
  misconfigured: !ready,
  sslReady: ready,
});

describe("customer domain service", () => {
  it("holds DNS cutover until a provider site exists", async () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    const fake = new FakeAdmin({ domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending" }] });

    await beginDomainVerification(fake.asClient(), "dom_1", provider((hostname) => snapshot(hostname, false)));

    const domain = fake.rows("domains")[0];
    expect((domain.verification as { source: string }).source).toBe("platform");
    expect(domain.status).toBe("pending");
    expect(domain.status_reason).toMatch(/Keep the current DNS unchanged/);
  });

  it("attaches www plus apex, redirects the apex, and publishes the canonical URL after verification", async () => {
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending" }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    await beginDomainVerification(fake.asClient(), "dom_1", deployment);
    expect(deployment.addDomain).toHaveBeenNthCalledWith(1, "prj_1", "www.example.com", undefined);
    expect(deployment.addDomain).toHaveBeenNthCalledWith(2, "prj_1", "example.com", { redirect: "www.example.com", redirectStatusCode: 308 });

    const result = await verifyDomain(fake.asClient(), "dom_1", deployment);
    expect(result.connected).toBe(true);
    expect(fake.rows("domains")[0].status).toBe("connected");
    expect(fake.rows("websites")[0].live_url).toBe("https://www.example.com");
  });
});
