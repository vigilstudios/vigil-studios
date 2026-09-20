import { describe, expect, it, vi } from "vitest";
import { GitHubRefMovedError, GitHubRepositoryProvider, assertRepositoryPath } from "../providers/github";

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

describe("GitHubRepositoryProvider.commitFiles", () => {
  const head = { name: "main", commit: { sha: "c0", commit: { tree: { sha: "t0" } } } };

  it("builds one commit on the branch tip and updates the ref without force", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(json(head))
      .mockResolvedValueOnce(json({ truncated: false, tree: [{ path: ".vigil/creative/README.md", type: "blob", sha: "b0" }, { path: "site/index.html", type: "blob", sha: "b9" }] }))
      .mockResolvedValueOnce(json({ sha: "blob1" }, 201))
      .mockResolvedValueOnce(json({ sha: "blob2" }, 201))
      .mockResolvedValueOnce(json({ sha: "t1" }, 201))
      .mockResolvedValueOnce(json({ sha: "c1" }, 201))
      .mockResolvedValueOnce(json({ object: { sha: "c1" } }));
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    const branch = await provider.getBranchHead("vigil/client-acme", "main");
    expect(branch).toEqual({ branch: "main", commitSha: "c0", treeSha: "t0" });
    const tree = await provider.listTree("vigil/client-acme", "t0", ".vigil/creative/");
    expect([...tree.entries()]).toEqual([[".vigil/creative/README.md", "b0"]]);
    const result = await provider.commitFiles("vigil/client-acme", { branch: "main", parentSha: "c0", baseTreeSha: "t0", message: "Creative workspace", files: [{ path: ".vigil/creative/README.md", content: "# a" }, { path: ".vigil/creative/client-assets/logos/logo.svg", content: Buffer.from("<svg") }] });
    expect(result).toEqual({ commitSha: "c1", treeSha: "t1" });
    expect(request.mock.calls.map((c) => c[0])).toEqual([
      "https://api.github.com/repos/vigil/client-acme/branches/main",
      "https://api.github.com/repos/vigil/client-acme/git/trees/t0?recursive=1",
      "https://api.github.com/repos/vigil/client-acme/git/blobs",
      "https://api.github.com/repos/vigil/client-acme/git/blobs",
      "https://api.github.com/repos/vigil/client-acme/git/trees",
      "https://api.github.com/repos/vigil/client-acme/git/commits",
      "https://api.github.com/repos/vigil/client-acme/git/refs/heads/main",
    ]);
    expect(JSON.parse(request.mock.calls[2][1].body)).toEqual({ content: Buffer.from("# a").toString("base64"), encoding: "base64" });
    expect(JSON.parse(request.mock.calls[4][1].body)).toEqual({ base_tree: "t0", tree: [{ path: ".vigil/creative/README.md", mode: "100644", type: "blob", sha: "blob1" }, { path: ".vigil/creative/client-assets/logos/logo.svg", mode: "100644", type: "blob", sha: "blob2" }] });
    expect(JSON.parse(request.mock.calls[5][1].body)).toMatchObject({ tree: "t1", parents: ["c0"] });
    expect(request.mock.calls[6][1].method).toBe("PATCH");
    expect(JSON.parse(request.mock.calls[6][1].body)).toEqual({ sha: "c1", force: false });
  });

  it("reports a moved branch as its own retryable error and refuses a truncated tree", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(json({ sha: "blob1" }, 201))
      .mockResolvedValueOnce(json({ sha: "t1" }, 201))
      .mockResolvedValueOnce(json({ sha: "c1" }, 201))
      .mockResolvedValueOnce(json({ message: "Update is not a fast forward" }, 422))
      .mockResolvedValueOnce(json({ truncated: true, tree: [] }));
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    await expect(provider.commitFiles("vigil/client-acme", { branch: "main", parentSha: "c0", baseTreeSha: "t0", message: "m", files: [{ path: "a.txt", content: "a" }] })).rejects.toBeInstanceOf(GitHubRefMovedError);
    await expect(provider.listTree("vigil/client-acme", "t0", "")).rejects.toThrow(/too large/);
  });

  it("refuses unsafe repository paths before any request is made", async () => {
    for (const bad of ["../escape.md", "/abs.md", "a\\b.md", "a/../b", "", "dir//x"]) expect(() => assertRepositoryPath(bad)).toThrow(/unsafe repository path/);
    expect(() => assertRepositoryPath(".vigil/creative/outputs/phase-1/.gitkeep")).not.toThrow();
    const request = vi.fn();
    const provider = new GitHubRepositoryProvider("gh_token", "vigil", "organization", request);
    await expect(provider.commitFiles("vigil/client-acme", { branch: "main", parentSha: "c0", baseTreeSha: "t0", message: "m", files: [{ path: "../x", content: "" }] })).rejects.toThrow(/unsafe/);
    expect(request).not.toHaveBeenCalled();
  });
});
