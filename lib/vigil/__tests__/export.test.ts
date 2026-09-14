import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildSiteExport, ExportUnavailableError } from "../services/export";
import type { Website } from "../types";

const base: Website = {
  id: "w1",
  organization_id: "o1",
  project_id: null,
  name: "Marlow & Fen website",
  status: "live",
  template_slug: "restaurant",
  hosting_mode: null,
  live_url: "https://example.com",
  preview_url: null,
  primary_domain_id: null,
  code_ownership: "customer_owned",
  export_eligible: true,
  repository_ref: null,
  status_reason: null,
  last_deployed_at: null,
  last_health_at: null,
  health_ok: null,
  metadata: {},
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

describe("buildSiteExport", () => {
  it("packages the published build with a manifest and README", async () => {
    const out = await buildSiteExport(base, { organizationName: "Marlow & Fen", exportedBy: "owner@example.com", exportedAt: new Date("2026-09-14T12:00:00Z") });
    expect(out.filename).toBe("marlow-fen-website-site-2026-09-14.zip");
    expect(out.source).toBe("express-template");
    const zip = await JSZip.loadAsync(out.bytes);
    expect(Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort()).toEqual(["README.md", "manifest.json", "site/index.html"]);
    const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
    expect(manifest.website.id).toBe("w1");
    expect(manifest.exported_by).toBe("owner@example.com");
    const html = await zip.file("site/index.html")!.async("string");
    expect(html).toMatch(/<html/i);
    const readme = await zip.file("README.md")!.async("string");
    expect(readme).toMatch(/does not include Vigil platform code/);
  });

  it("refuses when there is nothing to export", async () => {
    await expect(buildSiteExport({ ...base, template_slug: null }, { organizationName: "x", exportedBy: "y" })).rejects.toBeInstanceOf(ExportUnavailableError);
    await expect(buildSiteExport({ ...base, template_slug: "not-a-template" }, { organizationName: "x", exportedBy: "y" })).rejects.toBeInstanceOf(ExportUnavailableError);
  });
});
