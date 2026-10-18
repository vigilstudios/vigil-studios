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
    getDeployment: vi.fn(async () => ({externalId:"dpl_1",status:"ready",environment:"production",url:"https://production.vercel.app",createdAt:null,readyAt:null,error:null})),
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
  servingDeploymentId: "dpl_1", servingSiteId: "prj_1",
});

const dnsChecks = (ok: boolean) => ({
  checkDns: vi.fn(async (_hostname: string, records: DnsRecord[]) => records.map((record) => ({ record, found: ok ? [record.value] : [], ok }))),
  checkHttps: vi.fn(async () => ok),
});

function readyProduction(fake: FakeAdmin) {
  for (const site of fake.rows("websites")) site.organization_id ??= "org_1";
  for (const row of fake.rows("domains")) row.organization_id ??= "org_1";
  fake.rows("deployments").push({id:"prod_1",website_id:"web_1",organization_id:"org_1",environment:"production",status:"ready",created_at:"2026-10-16T10:00:00Z"});
  fake.rows("provider_links").push({provider:"vercel",resource_kind:"deployment",entity_type:"deployment",entity_id:"prod_1",external_id:"dpl_1"});
}

describe("customer domain service", () => {
  it("holds DNS cutover until a provider site exists", async () => {
    process.env.VIGIL_DNS_APEX_A = "76.76.21.21";
    const fake = new FakeAdmin({ domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending", verification_token: "fixture-token" }] });

    await beginDomainVerification(fake.asClient(), "dom_1", provider((hostname) => snapshot(hostname, false)));

    const domain = fake.rows("domains")[0];
    expect((domain.verification as { source: string }).source).toBe("platform");
    expect(domain.status).toBe("pending");
    expect(domain.status_reason).toMatch(/ownership record/);
  });

  it("attaches www plus apex only at launch, redirects the apex, and publishes the canonical URL after verification", async () => {
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "example.com", kind: "apex", website_id: "web_1", status: "pending", verification_token: "fixture-token" }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    readyProduction(fake);
    await activateDomainVerification(fake.asClient(), "dom_1", deployment, dnsChecks(false));
    expect(deployment.addDomain).toHaveBeenNthCalledWith(1, "prj_1", "www.example.com", undefined);
    expect(deployment.addDomain).toHaveBeenNthCalledWith(2, "prj_1", "example.com", { redirect: "www.example.com", redirectStatusCode: 308 });
    expect(fake.rows("domains")[0].status).toBe("pending");
    expect(fake.rows("domains")[0].dns_ok).toBe(false);

    readyProduction(fake);
    const result = await verifyDomain(fake.asClient(), "dom_1", deployment, dnsChecks(true));
    expect(result.connected).toBe(true);
    expect(fake.rows("domains")[0].status).toBe("connected");
    expect(fake.rows("websites")[0].live_url).toBe("https://preview.vercel.app");
  });

  it("does not trust provider verification when the public DNS record is absent", async () => {
    process.env.VIGIL_DNS_CNAME_TARGET = "cname.vercel-dns.com";
    const fake = new FakeAdmin({
      domains: [{ id: "dom_1", hostname: "drytest.vigilstudios.co", kind: "subdomain", website_id: "web_1", status: "pending", verification_token: "fixture-token" }],
      websites: [{ id: "web_1", live_url: "https://preview.vercel.app", preview_url: "https://preview.vercel.app" }],
      provider_links: [{ provider: "vercel", resource_kind: "site", entity_type: "website", entity_id: "web_1", external_id: "prj_1" }],
    });
    const deployment = provider((hostname) => snapshot(hostname, true));

    await beginDomainVerification(fake.asClient(), "dom_1", deployment, dnsChecks(false));

    expect(fake.rows("domains")[0]).toMatchObject({ status: "pending", dns_ok: false });
    expect(fake.rows("domains")[0].status_reason).toMatch(/ownership record/);
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
    readyProduction(fake);
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

    readyProduction(fake);
    await verifyDomain(fake.asClient(), "dom_1", deployment, {
      ...dnsChecks(true),
      checkHttps: vi.fn(async () => false),
    });

    expect(fake.rows("domains")[0].status).toBe("verifying");
    expect(fake.rows("websites")[0]).toMatchObject({ live_url: "https://production.vercel.app", primary_domain_id: null });
  });
});

describe("domain ownership", () => {
  it("does not report readiness when its transactional notification/outbox update fails", async () => {
    const fake = new FakeAdmin({ domains: [{ id: "dom-a", organization_id: "org-a", website_id: "web-a", hostname: "example.com", kind: "apex", status: "verifying", verification_token: "proof", dns_ok: false, verification: { source: "platform" } }] });
    const from = fake.from.bind(fake);
    vi.spyOn(fake, "from").mockImplementation(table => {
      const builder = from(table); const run = builder.run.bind(builder);
      builder.run = () => table === "domains" && (builder._payload?.verification as { launch_ready?: boolean } | undefined)?.launch_ready ? { data: null, error: { message: "Outbox unavailable" } } : run();
      return builder;
    });
    await expect(verifyDomain(fake.asClient(), "dom-a", provider(host => snapshot(host, false)), dnsChecks(true))).rejects.toMatchObject({ message: "Outbox unavailable" });
    expect(fake.rows("domains")[0].dns_ok).toBe(false);
  });
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

describe("manual guide production boundaries",()=>{
  const fixture=()=>new FakeAdmin({websites:[{id:"web_1",organization_id:"org_1",status:"live",live_url:"https://production.vercel.app"}],domains:[{id:"dom_1",organization_id:"org_1",website_id:"web_1",hostname:"example.com",kind:"apex",status:"pending",verification_token:"proof"}],provider_links:[{provider:"vercel",resource_kind:"site",entity_type:"website",entity_id:"web_1",external_id:"prj_1"}]});
  it("refuses directly called activation when no ready production exists",async()=>{
    const db=fixture(),p=provider(name=>snapshot(name,true));expect(await activateDomainVerification(db.asClient(),"dom_1",p,dnsChecks(true))).toEqual({connected:false});expect(p.addDomain).not.toHaveBeenCalled();
  });
  it("connects a later purchase to an existing approved production build without deploying again",async()=>{
    const db=fixture();readyProduction(db);const p=provider(name=>snapshot(name,true));expect((await verifyDomain(db.asClient(),"dom_1",p,dnsChecks(true))).connected).toBe(true);expect(p.addDomain).toHaveBeenCalled();expect(p.triggerDeployment).not.toHaveBeenCalled();
  });
  it("refuses a Preview returned for the alleged production deployment",async()=>{
    const db=fixture();readyProduction(db);const p=provider(name=>snapshot(name,true));vi.mocked(p.getDeployment).mockResolvedValueOnce({externalId:"dpl_1",environment:"preview",status:"ready",url:"https://preview.test",createdAt:null,readyAt:null,error:null});expect((await activateDomainVerification(db.asClient(),"dom_1",p,dnsChecks(true))).connected).toBe(false);expect(p.addDomain).not.toHaveBeenCalled();
  });
  it("blocks a production artifact that does not match the current saved design",async()=>{
    const db=fixture();readyProduction(db);db.rows("design_workspaces").push({website_id:"web_1",revision:2,repository_revision:1,repository_commit:"old"});const p=provider(name=>snapshot(name,true));expect((await activateDomainVerification(db.asClient(),"dom_1",p,dnsChecks(true))).connected).toBe(false);expect(p.addDomain).not.toHaveBeenCalled();
  });
  it("does not mark a different deployment or project as connected despite working DNS and HTTPS",async()=>{
    const db=fixture();readyProduction(db);const p=provider(name=>({...snapshot(name,true),servingDeploymentId:"unapproved-build",servingSiteId:"wrong-project"}));expect((await activateDomainVerification(db.asClient(),"dom_1",p,dnsChecks(true))).connected).toBe(false);expect(db.rows("domains")[0].status).not.toBe("connected");expect(db.rows("domains")[0].status_reason).not.toBe("The domain is connected.");
  });
});

it("keeps a pending production association when another Preview is prepared",async()=>{
  const db=new FakeAdmin({websites:[{id:"web_1",organization_id:"org_1",status:"building"}],domains:[{id:"dom_1",organization_id:"org_1",website_id:"web_1",hostname:"example.com",kind:"apex",status:"pending",verification:{source:"provider"},verification_token:"proof"}]});readyProduction(db);const p=provider(name=>snapshot(name,false));await beginDomainVerification(db.asClient(),"dom_1",p,dnsChecks(false));expect(p.removeDomain).not.toHaveBeenCalled();expect(db.rows("domains")[0].verification).toEqual({source:"provider"});
});
