import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeploymentProvider, DomainConfigSnapshot } from "../providers/types";
import type { DnsRecord } from "../services/dns";
import { activateDomainVerification, beginDomainVerification, verifyDomain } from "../services/domain";
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

const dnsChecks = (ok: boolean) => ({
  checkDns: vi.fn(async (_hostname: string, records: DnsRecord[]) => records.map((record) => ({ record, found: ok ? [record.value] : [], ok }))),
  checkHttps: vi.fn(async () => ok),
});

describe("customer domain service", () => {
  it("holds DNS cutover until a provider site exists", async () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    const fake = new FakeAdmin({ domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending" }] });

    await beginDomainVerification(fake.asClient(), "dom_1", provider((hostname) => snapshot(hostname, false)));

    const domain = fake.rows("domains")[0];
    expect((domain.verification as { source: string }).source).toBe("platform");
    expect(domain.status).toBe("pending");
    expect(domain.status_reason).toMatch(/Add the DNS record/);
  });

  it("attaches www plus apex only at launch, redirects the apex, and publishes the canonical URL after verification", async () => {
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending" }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    await activateDomainVerification(fake.asClient(), "dom_1", deployment, dnsChecks(false));
    expect(deployment.addDomain).toHaveBeenNthCalledWith(1, "prj_1", "www.example.com", undefined);
    expect(deployment.addDomain).toHaveBeenNthCalledWith(2, "prj_1", "example.com", { redirect: "www.example.com", redirectStatusCode: 308 });
    expect(fake.rows("domains")[0].status).toBe("pending");
    expect(fake.rows("domains")[0].dns_ok).toBe(false);

    const result = await verifyDomain(fake.asClient(), "dom_1", deployment, dnsChecks(true));
    expect(result.connected).toBe(true);
    expect(fake.rows("domains")[0].status).toBe("connected");
    expect(fake.rows("websites")[0].live_url).toBe("https://preview.vercel.app");
  });

  it("does not trust provider verification when the public DNS record is absent", async () => {
    process.env.VIGIL_DNS_CNAME_TARGET = "cname.vercel-dns.com";
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "drytest.vigilstudios.co", kind: "subdomain", website_id: "web_1", status: "pending" }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app", preview_url: "https://preview.vercel.app" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    await beginDomainVerification(fake.asClient(), "dom_1", deployment, dnsChecks(false));

    expect(fake.rows("domains")[0]).toMatchObject({ status: "pending", dns_ok: false });
    expect(fake.rows("domains")[0].status_reason).toMatch(/Add the DNS record/);
    expect(deployment.addDomain).not.toHaveBeenCalled();
  });

  it("removes an early provider association so preview DNS cannot expose the site", async () => {
    process.env.VIGIL_DNS_CNAME_TARGET = "cname.vercel-dns.com";
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "preview.example.com", kind: "subdomain", website_id: "web_1", status: "pending", verification: { source: "provider" } }],
      websites: [{ id: "web_1", status: "building", live_url: "https://preview.example.com", preview_url: "https://preview.vercel.app", primary_domain_id: "dom_1" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, false));

    await beginDomainVerification(fake.asClient(), "dom_1", deployment, dnsChecks(false));

    expect(deployment.removeDomain).toHaveBeenCalledWith("prj_1", "preview.example.com");
    expect(fake.rows("domains")[0].verification).toMatchObject({ source: "platform", launch_ready: false });
    expect(fake.rows("websites")[0]).toMatchObject({ status: "building", live_url: null, primary_domain_id: null });
  });

  it("keeps the provider address until the custom domain answers over HTTPS", async () => {
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "verifying", verification: { source: "provider" } }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app", preview_url: "https://preview.vercel.app", primary_domain_id: null }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));
    const result = await verifyDomain(fake.asClient(), "dom_1", deployment, {
      ...dnsChecks(true),
      checkHttps: vi.fn(async () => false),
    });

    expect(result.connected).toBe(false);
    expect(fake.rows("domains")[0]).toMatchObject({ status: "verifying", dns_ok: true, ssl_ok: true });
    expect(fake.rows("domains")[0].status_reason).toMatch(/waiting for the website to respond/i);
    expect(fake.rows("websites")[0]).toMatchObject({ live_url: "https://preview.vercel.app", primary_domain_id: null });
  });

  it("withdraws a custom-domain link if the final reachability check fails", async () => {
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "connected", verification: { source: "provider" } }],
      websites: [{ id: "web_1", live_url: "https://www.example.com", preview_url: "https://preview.vercel.app", primary_domain_id: "dom_1" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    await verifyDomain(fake.asClient(), "dom_1", deployment, {
      ...dnsChecks(true),
      checkHttps: vi.fn(async () => false),
    });

    expect(fake.rows("domains")[0].status).toBe("verifying");
    expect(fake.rows("websites")[0]).toMatchObject({ live_url: "https://preview.vercel.app", primary_domain_id: null });
  });
});

describe("domain ownership", () => {
  it("verifies only the organization whose token is in the zone", async () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    const fake = new FakeAdmin({
      domains: [
        { id: "dom_owner", organization_id: "org_owner", hostname: "example.com", kind: "apex", website_id: null, status: "pending", verification: {}, verification_token: "owner-token" },
        { id: "dom_squat", organization_id: "org_squat", hostname: "example.com", kind: "apex", website_id: null, status: "pending", verification: {}, verification_token: "squat-token" },
      ],
    });
    // The public zone: A points at the platform, TXT carries the owner's token.
    const zone = {
      checkDns: vi.fn(async (_hostname: string, records: DnsRecord[]) =>
        records.map((record) => {
          const ok = record.type === "A" || record.value === "vigil-verify=owner-token";
          return { record, found: ok ? [record.value] : [], ok };
        })),
      checkHttps: vi.fn(async () => true),
    };
    const deployment = provider((hostname) => snapshot(hostname, true));

    await beginDomainVerification(fake.asClient(), "dom_owner", deployment, zone);
    await beginDomainVerification(fake.asClient(), "dom_squat", deployment, zone);
    const rows = fake.rows("domains");
    expect(rows.find((r) => r.id === "dom_owner")?.dns_ok).toBe(true);
    expect(rows.find((r) => r.id === "dom_squat")?.dns_ok).toBe(false);
    const squatRecords = (rows.find((r) => r.id === "dom_squat")?.verification as { required_records: DnsRecord[] }).required_records;
    expect(squatRecords).toContainEqual({ type: "TXT", name: "_vigil", value: "vigil-verify=squat-token" });
  });
});
