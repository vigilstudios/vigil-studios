import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertProductionDeployAllowed, beginDomainVerification, activateDomainVerification } = vi.hoisted(() => ({
  assertProductionDeployAllowed: vi.fn(),
  beginDomainVerification: vi.fn().mockResolvedValue(undefined),
  activateDomainVerification: vi.fn(),
}));
vi.mock("@/lib/vigil/project-reviews", () => ({ assertProductionDeployAllowed }));
vi.mock("../services/domain", () => ({ beginDomainVerification, activateDomainVerification }));

import { deployWebsite, syncDeployment } from "../services/deployment";
import type { DeploymentProvider } from "../providers/types";
import { FakeAdmin } from "./fake-admin";

function provider(): DeploymentProvider {
  return {
    name: "null",
    provisionSite: vi.fn().mockResolvedValue({ externalId: "provider-site", previewUrl: "https://preview.test" }),
    triggerDeployment: vi.fn().mockResolvedValue({ externalId: "provider-deployment", status: "ready", url: "https://live.test", createdAt: "2026-01-01T00:00:00Z", readyAt: "2026-01-01T00:01:00Z", error: null }),
    getDeployment: vi.fn(),
    addDomain: vi.fn(),
    removeDomain: vi.fn(),
    getDomainConfig: vi.fn(),
    deleteSite: vi.fn(),
  };
}

describe("deployment service review enforcement", () => {
  it("blocks preview and production deployments until a repository exists", async () => {
    const db = new FakeAdmin({ websites: [{ id: "site_1", organization_id: "org_1", status: "building" }] });
    await expect(deployWebsite(db.asClient(), "site_1", { environment: "preview" }, provider())).rejects.toThrow(/Create the customer repository/);
    await expect(deployWebsite(db.asClient(), "site_1", { environment: "production" }, provider())).rejects.toThrow(/Create the customer repository/);
  });

  beforeEach(() => {
    assertProductionDeployAllowed.mockReset().mockResolvedValue(undefined);
    beginDomainVerification.mockClear();
    activateDomainVerification.mockReset().mockImplementation(async (admin, domainId) => {
      await admin.from("domains").update({ status: "connected", verification: { canonical_hostname: "example.com" } }).eq("id", domainId);
      return { connected: true };
    });
  });

  it("checks the review gate for production but leaves preview deployments available", async () => {
    const db = new FakeAdmin({
      projects: [{ id: "project_1", status: "in_progress", launched_at: null }],
      websites: [{ id: "site_1", organization_id: "org_1", project_id: "project_1", status: "building", template_slug: null, hosting_mode: null, preview_url: null }],
      domains: [{ id: "domain_1", organization_id: "org_1", website_id: "site_1", status: "pending" }],
      provider_links: [{ id: "repo_link", provider: "other", resource_kind: "repository", entity_type: "website", entity_id: "site_1", external_id: "123", metadata: { full_name: "vigil/site" } }],
    });
    const deploymentProvider = provider();

    const preview = await deployWebsite(db.asClient(), "site_1", { environment: "preview" }, deploymentProvider);
    expect(assertProductionDeployAllowed).not.toHaveBeenCalled();
    expect(deploymentProvider.triggerDeployment).toHaveBeenLastCalledWith("provider-site", expect.objectContaining({ environment: "preview" }));
    expect(db.rows("websites")[0].preview_url).toBe("https://live.test");
    expect(db.rows("projects")[0].status).toBe("review");
    expect(beginDomainVerification).toHaveBeenCalledWith(db.asClient(), "domain_1", deploymentProvider);
    expect(preview.domainIds).toEqual([]);

    Object.assign(db.rows("domains")[0], { hostname: "example.com", dns_ok: true, verification: { launch_ready: true }, status: "verifying" });

    vi.mocked(deploymentProvider.triggerDeployment).mockResolvedValueOnce({ externalId: "provider-production", status: "ready", url: "https://production.test", createdAt: "2026-01-01T00:02:00Z", readyAt: "2026-01-01T00:03:00Z", error: null });
    await deployWebsite(db.asClient(), "site_1", { environment: "production" }, deploymentProvider);
    expect(assertProductionDeployAllowed).toHaveBeenCalledWith(db.asClient(), "site_1");
    expect(deploymentProvider.triggerDeployment).toHaveBeenLastCalledWith("provider-site", expect.objectContaining({ environment: "production" }));
    expect(activateDomainVerification).toHaveBeenCalledWith(db.asClient(), "domain_1", deploymentProvider);
    expect(db.rows("websites")[0]).toMatchObject({ status: "live", live_url: "https://example.com", primary_domain_id: "domain_1" });
    expect(db.rows("projects")[0]).toMatchObject({ status: "launched", launched_at: "2026-01-01T00:03:00Z" });
  });

  it("does not let a production deployment inserted outside the normal path promote during sync", async () => {
    assertProductionDeployAllowed.mockRejectedValueOnce(new Error("Professional approvals are required"));
    const db = new FakeAdmin({ deployments: [{ id: "deployment_1", website_id: "site_1", environment: "production", status: "building" }] });

    await expect(syncDeployment(db.asClient(), "deployment_1", provider())).rejects.toThrow("Professional approvals are required");
    expect(assertProductionDeployAllowed).toHaveBeenCalledWith(db.asClient(), "site_1");
  });

  it("blocks a live deployment until customer DNS is verified for launch", async () => {
    const db = new FakeAdmin({
      websites: [{ id: "site_1", organization_id: "org_1", status: "building" }],
      domains: [{ id: "domain_1", website_id: "site_1", hostname: "example.com", status: "verifying", dns_ok: false, verification: { source: "platform", launch_ready: false } }],
      provider_links: [{ id: "repo_link", provider: "other", resource_kind: "repository", entity_type: "website", entity_id: "site_1", external_id: "123", metadata: { full_name: "vigil/site" } }],
    });

    await expect(deployWebsite(db.asClient(), "site_1", { environment: "production" }, provider())).rejects.toThrow(/Configure and verify DNS/);
  });
});
