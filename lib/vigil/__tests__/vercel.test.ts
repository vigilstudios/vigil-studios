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
});
