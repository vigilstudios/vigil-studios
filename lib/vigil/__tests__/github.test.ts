import { describe, expect, it, vi } from "vitest";
import { GitHubRepositoryProvider } from "../providers/github";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("GitHubRepositoryProvider", () => {
  it("creates a private organization repository and seeds missing files serially", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json({ id: 42, full_name: "vigil/client-acme", html_url: "https://github.com/vigil/client-acme", default_branch: "main" }, 201))
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json({ content: {}, commit: {} }, 201))
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json({ content: {}, commit: {} }, 201));
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    const repository = await provider.ensureRepository({
      name: "client-acme",
      description: "Acme website",
      files: [{ path: "site/index.html", content: "<html></html>" }, { path: "README.md", content: "# Acme" }],
    });

    expect(repository.fullName).toBe("vigil/client-acme");
    expect(request).toHaveBeenCalledTimes(6);
    const create = request.mock.calls[1];
    expect(create[0]).toBe("https://api.github.com/orgs/vigil/repos");
    expect(JSON.parse(create[1].body)).toMatchObject({ name: "client-acme", private: true, auto_init: false });
    expect(JSON.parse(request.mock.calls[3][1].body).content).toBe(Buffer.from("<html></html>").toString("base64"));
  });

  it("reuses an existing repository and never overwrites existing files", async () => {
    const repo = { id: 42, full_name: "vigil/client-acme", html_url: "https://github.com/vigil/client-acme", default_branch: "main" };
    const request = vi.fn().mockResolvedValueOnce(json(repo)).mockResolvedValueOnce(json({ sha: "abc" }));
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    await provider.ensureRepository({ name: "client-acme", description: "", files: [{ path: "site/index.html", content: "new" }] });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][1].method).toBe("GET");
  });

  it("permanently deletes the exact repository and treats an absent repository as success", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(json({}, 404));
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    await provider.deleteRepository("vigil/client-acme");
    await provider.deleteRepository("vigil/already-gone");
    expect(request.mock.calls[0][0]).toBe("https://api.github.com/repos/vigil/client-acme");
    expect(request.mock.calls[0][1].method).toBe("DELETE");
    expect(request.mock.calls[1][1].method).toBe("DELETE");
  });

  it("refuses a repository reference outside the owner/name shape", async () => {
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", vi.fn());
    await expect(provider.deleteRepository("client-acme")).rejects.toThrow("invalid");
  });
});
