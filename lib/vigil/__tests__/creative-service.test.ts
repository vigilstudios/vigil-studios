import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "../auth/errors";
import { CREATIVE_WORKSPACE_ROOT, readCreativeConfig } from "../creative/config";
import { generateCreativeWorkspace } from "../creative/service";
import { FakeModel, FakeRepo, sampleBrief } from "./creative-fixtures";
import { FakeAdmin } from "./fake-admin";

vi.spyOn(console, "info").mockImplementation(() => undefined);
vi.spyOn(console, "error").mockImplementation(() => undefined);

const R = CREATIVE_WORKSPACE_ROOT;
const config = readCreativeConfig({ OPENAI_API_KEY: "sk-test", CREATIVE_ASSET_INLINE_MAX_BYTES: String(1024 * 1024) });
const samplePdf = readFileSync(path.join(process.cwd(), "lib/vigil/__tests__/fixtures-sample.pdf"));
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

function seed(options: { brief?: unknown; assets?: boolean; repository?: boolean } = {}) {
  const project = { id: "proj_1", organization_id: "org_1", name: "Ember & Oak", kind: "professional", status: "in_progress", template_slug: null, launch_target: null, intake_completed_at: "2026-09-19T00:00:00Z", brief: options.brief ?? sampleBrief() };
  const organization = { id: "org_1", name: "Ember & Oak", slug: "ember-oak" };
  return new FakeAdmin({
    organizations: [organization],
    projects: [project],
    websites: [{ id: "site_1", organization_id: "org_1", project_id: "proj_1", name: "Ember & Oak website", template_slug: null, organization, project }],
    provider_links: options.repository === false ? [] : [{ provider: "other", resource_kind: "repository", external_id: "42", entity_type: "website", entity_id: "site_1", metadata: { full_name: "vigil/client-ember-oak", default_branch: "main" } }],
    project_assets: options.assets === false ? [] : [
      { id: "a1", organization_id: "org_1", project_id: "proj_1", kind: "logo", file_name: "logo.svg", content_type: "image/svg+xml", size_bytes: 4, caption: null, checksum: sha(Buffer.from("<svg")), created_at: "2026-09-01T00:00:00Z", bucket_id: "project-assets", object_path: "org_1/proj_1/x.svg" },
      { id: "a2", organization_id: "org_1", project_id: "proj_1", kind: "video", file_name: "reel.mp4", content_type: "video/mp4", size_bytes: 9_000_000, caption: "Opening night", checksum: "ab".repeat(32), created_at: "2026-09-02T00:00:00Z", bucket_id: "project-assets", object_path: "org_1/proj_1/y.mp4" },
      { id: "a3", organization_id: "org_1", project_id: "proj_1", kind: "document", file_name: "Menu.PDF", content_type: "application/pdf", size_bytes: samplePdf.length, caption: null, checksum: null, created_at: "2026-09-03T00:00:00Z", bucket_id: "project-assets", object_path: "org_1/proj_1/z.pdf" },
    ],
  });
}

const storage = new Map<string, Buffer>([["project-assets:org_1/proj_1/x.svg", Buffer.from("<svg")], ["project-assets:org_1/proj_1/z.pdf", samplePdf]]);
const downloadAsset = vi.fn(async (bucket: string, path: string) => {
  const bytes = storage.get(`${bucket}:${path}`);
  if (!bytes) throw new Error(`storage returned 404 for ${path}`);
  return bytes;
});

let clock = 0;
const now = () => new Date(Date.UTC(2026, 8, 20, 10, 0, clock++));

beforeEach(() => {
  clock = 0;
  downloadAsset.mockClear();
});

describe("generateCreativeWorkspace", () => {
  it("writes the whole workspace in one commit and records a ready row", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const model = new FakeModel();
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });

    expect(result.status).toBe("ready_with_warnings");
    expect(result.intelligence).toBe("generated");
    expect(repo.commits).toHaveLength(1);
    expect(repo.commits[0].message).toMatch(/^Creative workspace: initial generation/);
    for (const path of ["README.md", "ASTRA_INSTRUCTIONS.md", "workspace.json", "source/onboarding-raw.json", "source/customer-brief.md", "source/project-requirements.json", "intelligence/creative-brief.json", "intelligence/creative-analysis.json", "intelligence/brand-strategy.json", "intelligence/sitemap.json", "intelligence/content-strategy.json", "intelligence/creative-directive.md", "client-assets/assets-manifest.json", "client-assets/logos/logo.svg", "client-assets/videos/reel.mp4.reference.json", "outputs/phase-1/.gitkeep", "outputs/phase-2/.gitkeep"]) {
      expect(repo.read(`${R}/${path}`), path).toBeDefined();
    }
    expect(repo.read(`${R}/client-assets/videos/reel.mp4`)).toBeUndefined();
    expect(repo.read("site/index.html")).toBe("<html></html>");
    expect(downloadAsset).toHaveBeenCalledTimes(2);
    expect(model.calls[0].customerBriefMarkdown).toContain("Walk-in humidor");
    expect(model.calls[0].customerBriefMarkdown).not.toContain("dana@private.test");

    // The PDF's text layer reached Terra and sits beside the source files, mechanically extracted.
    expect(model.calls[0].documentTexts).toEqual([expect.objectContaining({ filename: "Menu.pdf", pages: 1, text: expect.stringContaining("Ember and Oak tasting menu") })]);
    expect(repo.read(`${R}/source/documents/Menu.pdf.txt`)).toContain("Ember and Oak tasting menu");
    expect(repo.read(`${R}/client-assets/documents/Menu.pdf`)).toBeDefined();

    // Checksums: the upload hash is verified for the committed logo, listed for the external video, computed for the hash-less PDF.
    const manifest = JSON.parse(repo.read(`${R}/client-assets/assets-manifest.json`)!);
    const byId = Object.fromEntries(manifest.assets.map((a: { id: string }) => [a.id, a]));
    expect(byId.a1).toMatchObject({ availability: "committed", checksum: { algorithm: "sha256", value: sha(Buffer.from("<svg")) }, checksumSource: "verified" });
    expect(byId.a2).toMatchObject({ availability: "external", checksum: { algorithm: "sha256", value: "ab".repeat(32) }, checksumSource: "upload" });
    expect(byId.a3).toMatchObject({ availability: "committed", checksum: { algorithm: "sha256", value: sha(samplePdf) }, checksumSource: "download" });
    expect(JSON.parse(repo.read(`${R}/workspace.json`)!).source.documents).toEqual([{ assetId: "a3", filename: "Menu.pdf", pages: 1, chars: expect.any(Number), truncated: false }]);

    const row = fake.rows("creative_workspaces")[0];
    expect(row).toMatchObject({ status: "ready_with_warnings", commit_sha: "commit_1", model_id: "gpt-5.6-terra", website_id: "site_1" });
    expect(row.intelligence).toBeTruthy();
    expect(row.error).toBeNull();
    expect((row.warnings as string[])[0]).toMatch(/stayed in storage/);
    expect(Object.keys(row.generated_files as Record<string, string>)).toContain(`${R}/intelligence/creative-brief.json`);
    expect(fake.audit[0]).toMatchObject({ p_action: "website.creative_workspace_generated", p_entity_id: "site_1" });
  });

  it("is idempotent: a retry with the same source calls no model and makes no commit", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const model = new FakeModel();
    await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });
    const again = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });

    expect(again.intelligence).toBe("reused");
    expect(again.commitSha).toBeNull();
    expect(model.calls).toHaveLength(1);
    expect(repo.commits).toHaveLength(1);
    expect(fake.rows("creative_workspaces")).toHaveLength(1);
    expect(fake.rows("creative_workspaces")[0].commit_sha).toBe("commit_1");
    expect(fake.rows("creative_workspaces")[0].status).toBe("ready_with_warnings");
  });

  it("never touches outputs/ or a hand-edited generated file when the brief changes", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const model = new FakeModel();
    await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });

    // Astra and the human do their work; someone also tweaks a generated file by hand.
    repo.files.set(`${R}/outputs/phase-1/creative-directions.md`, "# Three directions\n");
    repo.files.set(`${R}/outputs/phase-1/selected-direction.md`, "Go with B.\n");
    repo.files.set(`${R}/outputs/phase-1/.gitkeep`, "keep me\n");
    repo.files.set(`${R}/intelligence/creative-brief.json`, '{"edited":"by a person"}\n');

    const brief = sampleBrief();
    brief.about.hero = "Slow down.";
    fake.rows("projects")[0].brief = brief;
    (fake.rows("websites")[0].project as { brief: unknown }).brief = brief;

    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });

    expect(model.calls).toHaveLength(2);
    expect(repo.commits).toHaveLength(2);
    expect(repo.read(`${R}/outputs/phase-1/creative-directions.md`)).toBe("# Three directions\n");
    expect(repo.read(`${R}/outputs/phase-1/selected-direction.md`)).toBe("Go with B.\n");
    expect(repo.read(`${R}/outputs/phase-1/.gitkeep`)).toBe("keep me\n");
    expect(repo.read(`${R}/intelligence/creative-brief.json`)).toBe('{"edited":"by a person"}\n');
    expect(repo.read(`${R}/intelligence/creative-brief.v2.json`)).toContain("Bookings for tastings");
    expect(repo.read(`${R}/source/customer-brief.md`)).toContain("Slow down.");
    expect(repo.commits[1].paths).not.toEqual(expect.arrayContaining([expect.stringContaining("/outputs/")]));
    expect(result.preserved).toBe(1);
    expect(result.warnings.some((w) => w.includes("intelligence/creative-brief.json was edited by hand") && w.includes("creative-brief.v2.json"))).toBe(true);
    expect(result.status).toBe("ready_with_warnings");

    // The versioned copy is now Vigil's file: an unchanged regeneration rewrites nothing.
    const third = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });
    expect(third.commitSha).toBeNull();
    expect(repo.commits).toHaveLength(2);
  });

  it("keeps the validated intelligence when the repository write fails, then reuses it on retry", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const model = new FakeModel();
    repo.failCommit = new ProviderError("github", "GitHub returned 502.", { retryable: true });

    await expect(generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now })).rejects.toThrow("GitHub returned 502.");
    const row = fake.rows("creative_workspaces")[0];
    expect(row.status).toBe("failed");
    expect(row.error).toMatchObject({ code: "provider_error", message: "GitHub returned 502." });
    expect(row.intelligence).toBeTruthy();
    expect(repo.commits).toHaveLength(0);
    expect(repo.files.has(`${R}/workspace.json`)).toBe(false);

    repo.failCommit = null;
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });
    expect(result.intelligence).toBe("reused");
    expect(model.calls).toHaveLength(1);
    expect(repo.commits).toHaveLength(1);
    expect(fake.rows("creative_workspaces")[0]).toMatchObject({ status: "ready_with_warnings", error: null, commit_sha: "commit_1" });
  });

  it("re-reads the branch and commits again when someone pushed in between", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    repo.moveRefOnce = true;
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model: new FakeModel(), repository: repo, downloadAsset, now });
    expect(result.commitSha).toBe("commit_2");
    expect(repo.commits).toHaveLength(1);
  });

  it("still delivers source and assets, with a warning, when the model is not configured", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model: new FakeModel(() => ({ ok: false, reason: "not_configured" })), repository: repo, downloadAsset, now });
    expect(result.status).toBe("ready_with_warnings");
    expect(result.intelligence).toBe("missing");
    expect(result.warnings.some((w) => w.includes("model provider is not configured"))).toBe(true);
    expect(repo.read(`${R}/intelligence/creative-brief.json`)).toBeUndefined();
    expect(JSON.parse(repo.read(`${R}/workspace.json`)!).intelligence.status).toBe("missing");
    expect(repo.read(`${R}/source/customer-brief.md`)).toContain("Ember");
  });

  it("marks an asset failed rather than failing the run when storage cannot return it", async () => {
    const fake = seed();
    fake.rows("project_assets")[0].object_path = "org_1/proj_1/missing.svg";
    const repo = new FakeRepo();
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model: new FakeModel(), repository: repo, downloadAsset, now });
    const manifest = JSON.parse(repo.read(`${R}/client-assets/assets-manifest.json`)!);
    expect(manifest.assets[0]).toMatchObject({ id: "a1", availability: "failed", repositoryPath: null });
    expect(manifest.counts.failed).toBe(1);
    expect(result.warnings.some((w) => w.includes("could not be fetched"))).toBe(true);
  });

  it("refuses to run before the repository exists and says so on the row", async () => {
    const fake = seed({ repository: false });
    await expect(generateCreativeWorkspace(fake.asClient(), "site_1", { config, model: new FakeModel(), repository: new FakeRepo(), downloadAsset, now })).rejects.toThrow(/Create the customer repository/);
    expect(fake.rows("creative_workspaces")[0]).toMatchObject({ status: "failed", error: { code: "validation" } });
  });

  it("warns when the stored bytes do not match the upload checksum, and re-normalises when a document changes", async () => {
    const fake = seed();
    fake.rows("project_assets")[0].checksum = "00".repeat(32);
    const repo = new FakeRepo();
    const model = new FakeModel();
    const result = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });
    expect(result.warnings.some((w) => w.includes("logo.svg: the stored bytes do not match the checksum recorded at upload"))).toBe(true);
    const manifest = JSON.parse(repo.read(`${R}/client-assets/assets-manifest.json`)!);
    expect(manifest.assets.find((a: { id: string }) => a.id === "a1")).toMatchObject({ checksumSource: "download", reason: "Stored bytes do not match the checksum recorded at upload." });

    // Same brief, different PDF text: the source checksum moves, so Terra runs again.
    storage.set("project-assets:org_1/proj_1/z.pdf", Buffer.from(samplePdf.toString("latin1").replace("House blend 18 dollars", "House blend 22 dollars"), "latin1"));
    try {
      const again = await generateCreativeWorkspace(fake.asClient(), "site_1", { config, model, repository: repo, downloadAsset, now });
      expect(again.intelligence).toBe("generated");
      expect(model.calls).toHaveLength(2);
      expect(repo.read(`${R}/source/documents/Menu.pdf.txt`)).toContain("22 dolla");
    } finally {
      storage.set("project-assets:org_1/proj_1/z.pdf", samplePdf);
    }
  });

  it("skips document text when the policy turns it off or the PDF is too large", async () => {
    const fake = seed();
    const repo = new FakeRepo();
    const model = new FakeModel();
    await generateCreativeWorkspace(fake.asClient(), "site_1", { config: readCreativeConfig({ OPENAI_API_KEY: "sk", CREATIVE_DOCUMENT_TEXT: "false" }), model, repository: repo, downloadAsset, now });
    expect(model.calls[0].documentTexts).toEqual([]);
    expect(repo.read(`${R}/source/documents/Menu.pdf.txt`)).toBeUndefined();

    const big = seed();
    big.rows("project_assets")[2].size_bytes = 50 * 1024 * 1024;
    const bigRepo = new FakeRepo();
    const bigModel = new FakeModel();
    const result = await generateCreativeWorkspace(big.asClient(), "site_1", { config, model: bigModel, repository: bigRepo, downloadAsset, now });
    expect(bigModel.calls[0].documentTexts).toEqual([]);
    expect(result.warnings.some((w) => w.includes("Menu.PDF"))).toBe(false);
    expect(JSON.parse(bigRepo.read(`${R}/client-assets/assets-manifest.json`)!).assets.find((a: { id: string }) => a.id === "a3")).toMatchObject({ availability: "external" });
  });
});
