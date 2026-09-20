import { describe, expect, it } from "vitest";
import { planAssets, recordDownloaded, recordFailed, renderReferenceFile, safeFilename, type AssetRow } from "../creative/assets";
import { CREATIVE_WORKSPACE_ROOT, readCreativeConfig } from "../creative/config";
import { buildSourceSnapshot } from "../creative/source";
import { buildWorkspace } from "../creative/workspace";

const config = readCreativeConfig({ CREATIVE_ASSET_INLINE_MAX_BYTES: String(1024 * 1024) });
const row = (over: Partial<AssetRow>): AssetRow => ({ id: "a1", kind: "photo", file_name: "front.jpg", content_type: "image/jpeg", size_bytes: 1000, caption: null, created_at: "2026-09-01T00:00:00Z", ...over });

describe("asset manifest and Git inclusion policy", () => {
  it("copies small working files, keeps video and oversized files in storage as references", () => {
    const plans = planAssets(
      [
        row({ id: "a1", kind: "logo", file_name: "Logo Final (1).svg", content_type: "image/svg+xml", size_bytes: 1200 }),
        row({ id: "a2", kind: "video", file_name: "reel.mp4", content_type: "video/mp4", size_bytes: 500, created_at: "2026-09-02T00:00:00Z" }),
        row({ id: "a3", kind: "photo", file_name: "raw.jpg", content_type: "image/jpeg", size_bytes: 5 * 1024 * 1024, created_at: "2026-09-03T00:00:00Z" }),
        row({ id: "a4", kind: "other", file_name: "moodboard.pdf", content_type: "application/pdf", size_bytes: 900, created_at: "2026-09-04T00:00:00Z", caption: "Colours we like" }),
      ],
      config
    );
    expect(plans.map((p) => [p.entry.category, p.inline, p.entry.filename])).toEqual([
      ["logos", true, "Logo-Final-1.svg"],
      ["videos", false, "reel.mp4"],
      ["images", false, "raw.jpg"],
      ["references", true, "moodboard.pdf"],
    ]);
    expect(plans[0].entry.repositoryPath).toBe(`${CREATIVE_WORKSPACE_ROOT}/client-assets/logos/Logo-Final-1.svg`);
    expect(plans[1].entry).toMatchObject({ availability: "external", repositoryPath: null, referencePath: `${CREATIVE_WORKSPACE_ROOT}/client-assets/videos/reel.mp4.reference.json`, reason: "video/mp4 files stay in storage by policy." });
    expect(plans[2].entry.reason).toMatch(/1 MB Git inclusion limit/);
    expect(plans[3].entry.description).toBe("Colours we like");
    expect(plans[0].entry.storage).toEqual({ provider: "vigil", reference: "project_asset:a1" });
  });

  it("sanitises names, takes the extension from the MIME type, and never collides", () => {
    expect(safeFilename("../../evil.html", "image/png")).toBe("evil.png");
    expect(safeFilename(".htaccess", "application/pdf")).toBe("htaccess.pdf");
    expect(safeFilename("   ", "image/jpeg")).toBe("asset.jpg");
    expect(safeFilename("café menu été.PDF", "application/pdf")).toBe("cafe-menu-ete.pdf");
    const plans = planAssets([row({ id: "b1", file_name: "front.jpg" }), row({ id: "b2", file_name: "Front.JPG", created_at: "2026-09-02T00:00:00Z" }), row({ id: "b3", file_name: "front.jpeg", created_at: "2026-09-03T00:00:00Z" })], config);
    expect(plans.map((p) => p.entry.filename)).toEqual(["front.jpg", "Front-2.jpg", "front-3.jpg"]);
    expect(plans.every((p) => p.entry.originalFilename !== p.entry.filename || p.entry.id === "b1")).toBe(true);
  });

  it("orders by upload time so names are stable across runs", () => {
    const rows = [row({ id: "z", file_name: "a.jpg", created_at: "2026-09-05T00:00:00Z" }), row({ id: "y", file_name: "a.jpg", created_at: "2026-09-01T00:00:00Z" })];
    expect(planAssets(rows, config).map((p) => [p.entry.id, p.entry.filename])).toEqual([["y", "a.jpg"], ["z", "a-2.jpg"]]);
    expect(planAssets([...rows].reverse(), config).map((p) => p.entry.filename)).toEqual(["a.jpg", "a-2.jpg"]);
  });

  it("records checksums for what it copies and flags a size mismatch", () => {
    const [plan] = planAssets([row({ size_bytes: 3 })], config);
    const ok = recordDownloaded(plan.entry, Buffer.from("abc"));
    expect(ok.warning).toBeNull();
    expect(ok.entry.checksum).toEqual({ algorithm: "sha256", value: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" });
    const off = recordDownloaded(plan.entry, Buffer.from("abcd"));
    expect(off.warning).toMatch(/differs from the recorded 3/);
    expect(off.entry.sizeBytes).toBe(4);
    const failed = recordFailed(plan.entry, "storage returned 404");
    expect(failed).toMatchObject({ availability: "failed", repositoryPath: null, reason: "storage returned 404" });
    expect(failed.referencePath).toMatch(/front\.jpg\.reference\.json$/);
  });

  it("writes no bucket names, object paths or signed URLs into the repository", () => {
    const rows = [row({ id: "a1", kind: "logo", content_type: "image/svg+xml", file_name: "logo.svg", size_bytes: 4 }), row({ id: "a2", kind: "video", content_type: "video/mp4", file_name: "reel.mp4", size_bytes: 10, created_at: "2026-09-02T00:00:00Z" })];
    const plans = planAssets(rows, config);
    const manifest = plans.map((p) => (p.inline ? recordDownloaded(p.entry, Buffer.from("<svg")).entry : p.entry));
    const snapshot = buildSourceSnapshot({ organization: { id: "org_1", name: "Ember", slug: "ember" }, website: { id: "site_1", name: "Ember", templateSlug: null }, project: null, assets: [] });
    const build = buildWorkspace({ organization: { id: "org_1", name: "Ember", slug: "ember" }, website: { id: "site_1", name: "Ember" }, project: null, snapshot, intelligence: null, manifest, assetBytes: new Map([["a1", Buffer.from("<svg")]]), generatedAt: "2026-09-20T10:00:00.000Z", warnings: [] });
    const text = build.files.map((f) => (Buffer.isBuffer(f.content) ? f.content.toString("utf8") : f.content)).join("\n");
    for (const forbidden of ["project-assets", "org_1/", "object_path", "supabase.co", "token=", "X-Amz", "signedUrl"]) expect(text).not.toContain(forbidden);
    const paths = build.files.map((f) => f.path);
    expect(paths).toContain(`${CREATIVE_WORKSPACE_ROOT}/client-assets/logos/logo.svg`);
    expect(paths).toContain(`${CREATIVE_WORKSPACE_ROOT}/client-assets/videos/reel.mp4.reference.json`);
    expect(paths).not.toContain(`${CREATIVE_WORKSPACE_ROOT}/client-assets/videos/reel.mp4`);
    const reference = JSON.parse(renderReferenceFile(manifest[1], "org_1"));
    expect(reference.retrieval).toEqual({ kind: "vigil_admin_files", organizationId: "org_1", reference: "project_asset:a2" });
    expect(build.assetCounts).toMatchObject({ total: 2, committed: 1, external: 1, failed: 0, logos: 1, videos: 1 });
    expect(build.warnings.some((w) => w.includes("stayed in storage"))).toBe(true);
  });
});
