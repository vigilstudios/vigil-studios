import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertProductionDeployAllowed, beginDomainVerification } = vi.hoisted(() => ({
  assertProductionDeployAllowed: vi.fn(),
  beginDomainVerification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/vigil/project-reviews", () => ({ assertProductionDeployAllowed }));
vi.mock("../services/domain", () => ({ beginDomainVerification }));

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
  beforeEach(() => {
    assertProductionDeployAllowed.mockReset().mockResolvedValue(undefined);
    beginDomainVerification.mockClear();
  });

  it("checks the review gate for production but leaves preview deployments available", async () => {
    const db = new FakeAdmin({
      websites: [{ id: "site_1", organization_id: "org_1", status: "building", template_slug: null, hosting_mode: null, preview_url: null }],
      domains: [{ id: "domain_1", organization_id: "org_1", website_id: "site_1", status: "pending" }],
    });
    const deploymentProvider = provider();

    const preview = await deployWebsite(db.asClient(), "site_1", { environment: "preview" }, deploymentProvider);
    expect(assertProductionDeployAllowed).not.toHaveBeenCalled();
    expect(deploymentProvider.triggerDeployment).toHaveBeenLastCalledWith("provider-site", expect.objectContaining({ environment: "preview" }));
    expect(db.rows("websites")[0].preview_url).toBe("https://live.test");
    expect(beginDomainVerification).toHaveBeenCalledWith(db.asClient(), "domain_1", deploymentProvider);
    expect(preview.domainIds).toEqual([]);

    vi.mocked(deploymentProvider.triggerDeployment).mockResolvedValueOnce({ externalId: "provider-production", status: "ready", url: "https://production.test", createdAt: "2026-01-01T00:02:00Z", readyAt: "2026-01-01T00:03:00Z", error: null });
    await deployWebsite(db.asClient(), "site_1", { environment: "production" }, deploymentProvider);
    expect(assertProductionDeployAllowed).toHaveBeenCalledWith(db.asClient(), "site_1");
    expect(deploymentProvider.triggerDeployment).toHaveBeenLastCalledWith("provider-site", expect.objectContaining({ environment: "production" }));
    expect(db.rows("websites")[0].live_url).toBe("https://production.test");
  });

  it("does not let a production deployment inserted outside the normal path promote during sync", async () => {
    assertProductionDeployAllowed.mockRejectedValueOnce(new Error("Professional approvals are required"));
    const db = new FakeAdmin({ deployments: [{ id: "deployment_1", website_id: "site_1", environment: "production", status: "building" }] });

    await expect(syncDeployment(db.asClient(), "deployment_1", provider())).rejects.toThrow("Professional approvals are required");
    expect(assertProductionDeployAllowed).toHaveBeenCalledWith(db.asClient(), "site_1");
  });
});
