import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { NamecomSandboxRegistrar } from "../domain-engine/namecom-sandbox";
import type { DeploymentProvider } from "../providers/types";
const state = vi.hoisted(() => ({
  order: {} as Record<string, unknown>,
  registrar: null as unknown,
}));
vi.mock("../domain-engine/store", () => ({
  SupabaseDomainOrderStore: class {
    async load() {
      return state.order;
    }
  },
}));
vi.mock("../domain-engine/test-registrar", () => ({
  domainTestRegistrar: () => state.registrar,
}));
vi.mock("../project-reviews", () => ({
  assertProductionDeployAllowed: vi.fn(async () => {}),
}));
import {
  loadManagedRegistrarContext,
  prepareManagedDns,
  applyManagedDns,
  bindManagedDomain,
  assertManagedDomainDeployment,
} from "../domain-engine/managed-connection";
import { domainTestDeploymentProvider } from "../domain-engine/test-deployment";

const org = "10000000-0000-4000-8000-000000000001",
  asset = "10000000-0000-4000-8000-000000000002",
  website = "10000000-0000-4000-8000-000000000003",
  owner = "10000000-0000-4000-8000-000000000004",
  planId = "10000000-0000-4000-8000-000000000005",
  domainId = "10000000-0000-4000-8000-000000000006",
  token = "10000000-0000-4000-8000-000000000007";
let db: FakeAdmin,
  registrar: NamecomSandboxRegistrar,
  provider: DeploymentProvider;
const fqdn = "fixture.com";
function plan() {
  return {
    fqdn,
    accountScope: registrar.accountScope,
    snapshotDigest: "a".repeat(64),
    expected: [
      { type: "A" as const, name: "@", value: "76.76.21.21", ttl: 300 },
    ],
    creates: [
      { type: "A" as const, host: "", answer: "76.76.21.21", ttl: 300 },
    ],
  };
}
function claim(
  claimed = true,
  status = "claimed",
  consentedAt = new Date().toISOString(),
) {
  return {
    claimed,
    record: {
      id: planId,
      registration_id: asset,
      organization_id: org,
      domain_id: domainId,
      website_id: website,
      status,
      claim_token: token,
      consented_at: consentedAt,
      plan: plan(),
    },
  };
}
function rpc(claimValue = claim()) {
  return vi.spyOn(db, "rpc").mockImplementation(
    async (name) =>
      ({
        data:
          name === "claim_managed_dns_plan"
            ? claimValue
            : name === "bind_managed_domain"
              ? domainId
              : name === "create_managed_dns_plan"
                ? {
                    id: planId,
                    expiresAt: new Date(Date.now() + 300000).toISOString(),
                  }
                : null,
        error: null,
      }) as never,
  );
}
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
  vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "namecom");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  registrar = new NamecomSandboxRegistrar(
    "fixture-test",
    "fixture-token",
    2500,
    vi.fn(),
  );
  state.registrar = registrar;
  state.order = {
    id: "order",
    organizationId: org,
    fqdn,
    registrar: "namecom",
    environment: "test",
    years: 1,
    autoRenew: false,
    acceptanceId: "acceptance",
    contact: {},
    registrarAmountMinor: 1200,
    currency: "usd",
    registrarOrderRef: `${registrar.accountScope}:order:123`,
  };
  vi.spyOn(registrar, "getDomainStatus").mockResolvedValue({
    externalId: `${registrar.accountScope}:domain:${fqdn}`,
    fqdn,
    status: "registered",
    expiresAt: "2027-10-26T00:00:00Z",
    autoRenew: false,
    contactVerification: "pending",
  });
  vi.spyOn(registrar, "getRegisteredDomainStatus").mockImplementation(
    (name, approved) => registrar.getDomainStatus(name, approved),
  );
  vi.spyOn(registrar, "prepareWebsiteDns").mockResolvedValue(plan());
  vi.spyOn(registrar, "applyWebsiteDns").mockResolvedValue({
    applied: true,
    reconciled: false,
    publicDnsVerified: false,
  });
  db = new FakeAdmin({
    domain_registrations: [
      {
        id: asset,
        organization_id: org,
        registrar: "namecom",
        environment: "test",
        fqdn,
        website_id: website,
      },
    ],
    domain_orders: [
      {
        id: "order",
        registration_id: asset,
        organization_id: org,
        operation: "register",
        registration_state: "registered",
        payment_state: "paid",
      },
    ],
    domains: [
      {
        id: domainId,
        managed_registration_id: asset,
        organization_id: org,
        website_id: website,
        hostname: fqdn,
        verification_token: "b".repeat(32),
      },
    ],
    provider_links: [
      {
        provider: "other",
        resource_kind: "registration",
        entity_type: "domain_registration",
        entity_id: asset,
        external_id: `${registrar.accountScope}:domain:${fqdn}`,
        metadata: {
          environment: "test",
          account_scope: registrar.accountScope,
          registrar: "namecom",
        },
      },
      {
        provider: "other",
        resource_kind: "site",
        entity_type: "website",
        entity_id: website,
        external_id: `mock-domain-site:${website}`,
      },
    ],
  });
  provider = domainTestDeploymentProvider();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

import {
  beginDomainVerification,
  activateDomainVerification,
  verifyDomain,
} from "../services/domain";
describe("managed registration to website bridge", () => {
  it("prepares only provider-derived apex/www targets and the saved organization proof", async () => {
    const calls = rpc();
    const result = await prepareManagedDns(
      db.asClient(),
      asset,
      org,
      owner,
      provider,
    );
    expect(result.records).toEqual([
      { type: "A", name: fqdn, value: "76.76.21.21", ttl: 300 },
      {
        type: "CNAME",
        name: `www.${fqdn}`,
        value: "fixture.vercel-dns-017.com",
        ttl: 300,
      },
      {
        type: "TXT",
        name: `_vigil.${fqdn}`,
        value: `vigil-verify=${"b".repeat(32)}`,
        ttl: 300,
      },
    ]);
    expect(calls).toHaveBeenCalledWith(
      "create_managed_dns_plan",
      expect.objectContaining({ p_registration_id: asset, p_actor_id: owner }),
    );
    expect(result).not.toHaveProperty("accountScope");
    await expect(provider.addDomain("site", fqdn)).rejects.toThrow(
      "established review",
    );
  });
  it("refuses another tenant, unpaid order, moved website or live registrar before preparing DNS", async () => {
    rpc();
    await expect(
      prepareManagedDns(db.asClient(), asset, "another-org", owner, provider),
    ).rejects.toThrow();
    db.rows("domain_orders")[0].payment_state = "authorized";
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow("Complete registration");
    db.rows("domain_orders")[0].payment_state = "paid";
    db.rows("domains")[0].website_id = "other-site";
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow("Choose the website");
    db.rows("domain_registrations")[0].environment = "live";
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow();
    expect(registrar.prepareWebsiteDns).not.toHaveBeenCalled();
  });
  it("requires the saved asset mapping and its original registrar account", async () => {
    const link = db
      .rows("provider_links")
      .find((row) => row.resource_kind === "registration")!;
    link.metadata = {
      environment: "test",
      account_scope: "namecom:test:" + "c".repeat(64),
      registrar: "namecom",
    };
    await expect(
      bindManagedDomain(db.asClient(), asset, website, org, owner),
    ).rejects.toThrow();
    expect(registrar.getRegisteredDomainStatus).not.toHaveBeenCalled();
  });
  it("retains owned-registration reads independently of a Stripe refund", async () => {
    db.rows("domain_orders")[0].payment_state = "refunded";
    expect(
      (await loadManagedRegistrarContext(db.asClient(), asset, org, false))
        .assetRef,
    ).toBe(`${registrar.accountScope}:domain:${fqdn}`);
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow("Complete registration and payment");
  });
  it("never sends sandbox names to the real Vercel provider", async () => {
    provider = { ...provider, name: "vercel" };
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow("isolated test");
    await expect(
      assertManagedDomainDeployment(db.asClient(), domainId, provider, true),
    ).rejects.toThrow("isolated test");
    expect(registrar.getDomainStatus).not.toHaveBeenCalled();
  });
  it("blocks the legacy connection path for an unbound managed name at every deployment entry point", async () => {
    db.rows("domains")[0].managed_registration_id = null;
    const realProvider = { ...provider, name: "vercel" as const, addDomain: vi.spyOn(provider, "addDomain"), removeDomain: vi.spyOn(provider, "removeDomain"), getRecommendedDnsRecords: vi.spyOn(provider, "getRecommendedDnsRecords") };
    for (const entry of [beginDomainVerification, activateDomainVerification, verifyDomain])
      await expect(entry(db.asClient(), domainId, realProvider)).rejects.toThrow("Link this managed registration");
    expect(realProvider.addDomain).not.toHaveBeenCalled();
    expect(realProvider.removeDomain).not.toHaveBeenCalled();
    expect(realProvider.getRecommendedDnsRecords).not.toHaveBeenCalled();
  });
  it("preserves the legacy path for an unrelated customer-owned name", async () => {
    db.rows("domains")[0].managed_registration_id = null;
    db.rows("domains")[0].hostname = "unrelated.com";
    await expect(assertManagedDomainDeployment(db.asClient(), domainId, { ...provider, name: "vercel" }, true)).resolves.toBeUndefined();
  });
  it("enforces the sandbox boundary at every existing deployment entry point", async () => {
    const realProvider = { ...provider, name: "vercel" as const };
    const attach = vi.spyOn(realProvider, "addDomain");
    const recommendations = vi.spyOn(realProvider, "getRecommendedDnsRecords");
    for (const entry of [
      beginDomainVerification,
      activateDomainVerification,
      verifyDomain,
    ]) {
      await expect(
        entry(db.asClient(), domainId, realProvider),
      ).rejects.toThrow("isolated test deployment provider");
    }
    expect(attach).not.toHaveBeenCalled();
    expect(recommendations).not.toHaveBeenCalled();
  });
  it("rejects arbitrary routing values supplied by a provider before storing or applying a plan", async () => {
    const calls = rpc();
    provider.getRecommendedDnsRecords = async () => [
      { type: "A", name: "mail.fixture.com", value: "127.0.0.1" },
    ];
    await expect(
      prepareManagedDns(db.asClient(), asset, org, owner, provider),
    ).rejects.toThrow();
    expect(calls).not.toHaveBeenCalled();
    expect(registrar.applyWebsiteDns).not.toHaveBeenCalled();
  });
  it("checks the actual approved owner before binding and rejects unconfirmed assets", async () => {
    rpc();
    expect(
      await bindManagedDomain(db.asClient(), asset, website, org, owner),
    ).toEqual({ domainId });
    vi.mocked(registrar.getDomainStatus).mockResolvedValueOnce(null);
    await expect(
      bindManagedDomain(db.asClient(), asset, website, org, owner),
    ).rejects.toThrow();
  });
  it("requires verified contact and a ready approved production deployment before attachment", async () => {
    await expect(
      assertManagedDomainDeployment(db.asClient(), domainId, provider, true),
    ).rejects.toThrow("Verify the registrant");
    vi.mocked(registrar.getDomainStatus).mockResolvedValue({
      externalId: "asset",
      fqdn,
      status: "registered",
      expiresAt: "2027-10-26T00:00:00Z",
      autoRenew: false,
      contactVerification: "verified",
    });
    await expect(
      assertManagedDomainDeployment(db.asClient(), domainId, provider, true),
    ).rejects.toThrow("approved production deployment");
    db.rows("deployments").push({
      id: "deployment",
      website_id: website,
      environment: "production",
      status: "ready",
    });
    await expect(
      assertManagedDomainDeployment(db.asClient(), domainId, provider, true),
    ).resolves.toBeUndefined();
  });
});

describe("durable DNS approval and recovery", () => {
  it("requires explicit consent, claims once, then records a sandbox-only result", async () => {
    const calls = rpc();
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, false),
    ).rejects.toThrow("Approve");
    expect(calls).not.toHaveBeenCalled();
    expect(
      await applyManagedDns(db.asClient(), planId, org, owner, true),
    ).toEqual({ applied: true, domainId, reconciled: false, publicDnsVerified: false });
    expect(registrar.applyWebsiteDns).toHaveBeenCalledTimes(1);
    expect(calls).toHaveBeenLastCalledWith("finish_managed_dns_plan", {
      p_plan_id: planId,
      p_claim_token: token,
      p_applied: true,
    });
  });
  it("does not write during another active claim or after a completed replay", async () => {
    const calls = rpc(claim(false));
    expect(
      await applyManagedDns(db.asClient(), planId, org, owner, true),
    ).toMatchObject({ working: true, applied: false });
    calls.mockResolvedValueOnce({
      data: claim(false, "applied"),
      error: null,
    } as never);
    expect(
      await applyManagedDns(db.asClient(), planId, org, owner, true),
    ).toMatchObject({ reconciled: true, applied: true });
    expect(registrar.applyWebsiteDns).not.toHaveBeenCalled();
  });
  it("reads back an interrupted submission without repeating any POST", async () => {
    rpc(claim(false, "review"));
    vi.mocked(registrar.prepareWebsiteDns).mockResolvedValueOnce({
      ...plan(),
      creates: [],
    });
    expect(
      await applyManagedDns(db.asClient(), planId, org, owner, true),
    ).toMatchObject({ applied: true, reconciled: true });
    expect(registrar.applyWebsiteDns).not.toHaveBeenCalled();
  });
  it("retains uncertain submissions for review and never treats partial DNS as complete", async () => {
    const calls = rpc();
    vi.mocked(registrar.applyWebsiteDns).mockRejectedValueOnce(
      Error("Lost response"),
    );
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, true),
    ).rejects.toThrow("No duplicate");
    expect(calls).toHaveBeenLastCalledWith(
      "finish_managed_dns_plan",
      expect.objectContaining({ p_applied: false }),
    );
    calls.mockResolvedValueOnce({
      data: claim(false, "review"),
      error: null,
    } as never);
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, true),
    ).rejects.toThrow("No duplicate");
    expect(registrar.applyWebsiteDns).toHaveBeenCalledTimes(1);
  });
  it("refuses changed account/website bindings and expired plans before external writes", async () => {
    const calls = rpc();
    db.rows("domain_registrations")[0].website_id = "other-site";
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, true),
    ).rejects.toThrow();
    calls.mockResolvedValueOnce({
      data: claim(false, "expired"),
      error: null,
    } as never);
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, true),
    ).rejects.toThrow("expired");
    expect(registrar.applyWebsiteDns).not.toHaveBeenCalled();
  });
  it("cannot run against a production environment even with test flags", async () => {
    vi.stubEnv("NODE_ENV", "production");
    rpc();
    await expect(
      applyManagedDns(db.asClient(), planId, org, owner, true),
    ).rejects.toThrow("approved test database");
    expect(registrar.applyWebsiteDns).not.toHaveBeenCalled();
  });
});
