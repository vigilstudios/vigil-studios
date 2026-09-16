import { describe, expect, it, vi } from "vitest";
import { VercelDeploymentProvider } from "../providers/vercel";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("VercelDeploymentProvider", () => {
  it("creates a dedicated project connected to the private GitHub repository", async () => {
    const request = vi.fn().mockResolvedValueOnce(json({}, 404)).mockResolvedValueOnce(json({ id: "prj_1", name: "vigil-acme" }));
    const provider = new VercelDeploymentProvider("vc_token", "team_1", request);
    const result = await provider.provisionSite({ websiteId: "w", organizationId: "o", name: "vigil-acme", templateSlug: "restaurant", hostingMode: "dedicated", repositoryFullName: "vigil/client-acme", repositoryId: 42 });
    expect(result).toEqual({ externalId: "prj_1", previewUrl: "https://vigil-acme.vercel.app" });
    const url = request.mock.calls[1][0] as URL;
    expect(url.toString()).toContain("/v11/projects?teamId=team_1");
    expect(JSON.parse(request.mock.calls[1][1].body)).toMatchObject({ rootDirectory: "site", gitRepository: { type: "github", repo: "vigil/client-acme" } });
  });

  it("deploys main to production and normalizes asynchronous states", async () => {
    const request = vi.fn().mockResolvedValue(json({ id: "dpl_1", readyState: "BUILDING", url: "vigil-acme.vercel.app", createdAt: 1_700_000_000_000 }));
    const provider = new VercelDeploymentProvider("vc_token", "", request);
    const result = await provider.triggerDeployment("prj_1", { environment: "production", ref: "main", repositoryId: 42 });
    expect(result.status).toBe("building");
    expect(result.url).toBe("https://vigil-acme.vercel.app");
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({ project: "prj_1", target: "production", gitSource: { type: "github", repoId: 42, ref: "main" } });
  });

  it("creates and reapplies a permanent domain redirect", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(json({ name: "example.com", verified: true }))
      .mockResolvedValueOnce(json({ name: "example.com", verified: true, redirect: "www.example.com", redirectStatusCode: 308 }));
    const provider = new VercelDeploymentProvider("vc_token", "team_1", request);
    await provider.addDomain("prj_1", "example.com", { redirect: "www.example.com", redirectStatusCode: 308 });

    expect(request).toHaveBeenCalledTimes(2);
    expect((request.mock.calls[0][0] as URL).pathname).toBe("/v10/projects/prj_1/domains");
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ name: "example.com", redirect: "www.example.com", redirectStatusCode: 308 });
    expect((request.mock.calls[1][0] as URL).pathname).toBe("/v9/projects/prj_1/domains/example.com");
    expect(request.mock.calls[1][1].method).toBe("PATCH");
  });

  it("asks Vercel to verify an ownership challenge and keeps polling when DNS is pending", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(json({ name: "example.com", verified: false, verification: [{ type: "TXT", domain: "_vercel.example.com", value: "vc-domain-verify=abc" }] }))
      .mockResolvedValueOnce(json({ error: { message: "Domain verification failed" } }, 400))
      .mockResolvedValueOnce(json({ misconfigured: true }));
    const provider = new VercelDeploymentProvider("vc_token", "", request);
    const config = await provider.getDomainConfig("prj_1", "example.com");

    expect(config.verified).toBe(false);
    expect(config.requiredRecords).toContainEqual({ type: "TXT", name: "_vercel.example.com", value: "vc-domain-verify=abc" });
    expect((request.mock.calls[1][0] as URL).pathname).toBe("/v9/projects/prj_1/domains/example.com/verify");
    expect(request.mock.calls[1][1].method).toBe("POST");
  });
});
