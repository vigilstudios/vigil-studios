import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Website } from "@/lib/vigil/types";
import { FakeAdmin } from "./fake-admin";
import { getPreviewOverviewPalette } from "../queries/preview-overview-palette";

const mocks = vi.hoisted(() => ({ template: vi.fn(), publicAccent: vi.fn() }));
vi.mock("../express/library", () => ({ publishedExpressVariant: mocks.template }));
vi.mock("../queries/overview-deployment-palette", () => ({ readPublicDeploymentAccent: mocks.publicAccent }));
const website = { id: "site-a", organization_id: "org-a", metadata: {} } as Website;
const preview = { kind: "live" as const, src: "https://build-a.vercel.app/", address: "build-a.vercel.app" };
const template = { kind: "template" as const, src: "/express-preview/creator", address: "creator.preview" };
beforeEach(() => { vi.clearAllMocks(); mocks.template.mockResolvedValue({ accent: "#CBA383" }); mocks.publicAccent.mockResolvedValue("#12bf60"); });

describe("pre-launch preview branding", () => {
  it("tints an example with its published template colour rather than the customer's saved palette", async () => {
    const client = new FakeAdmin().asClient();
    expect(await getPreviewOverviewPalette(client, { ...website, metadata: { preview_accent: "#ff0000" } }, template, "creator")).toBe("#cba383");
    expect(mocks.template).toHaveBeenCalledWith("creator", client);
    expect(mocks.publicAccent).not.toHaveBeenCalled();
  });
  it("keeps an unavailable design neutral", async () => {
    mocks.template.mockResolvedValue(null);
    expect(await getPreviewOverviewPalette(new FakeAdmin().asClient(), website, template, "creator")).toBeNull();
    expect(await getPreviewOverviewPalette(new FakeAdmin().asClient(), website, { kind: "none" }, null)).toBeNull();
  });
  it("validates a saved public palette before inserting it into a style token", async () => {
    expect(await getPreviewOverviewPalette(new FakeAdmin().asClient(), { ...website, metadata: { preview_accent: "#12BF60" } }, preview, null)).toBe("#12bf60");
    expect(await getPreviewOverviewPalette(new FakeAdmin().asClient(), { ...website, metadata: { preview_accent: "url(https://untrusted.example)" } }, preview, null)).toBeNull();
  });
  it.each(["https://build-a.vercel.app", "https://build-a.vercel.app/"])("uses only a matching ready deployment, with URL %s", async url => {
    const record = { organization_id: "org-a", website_id: "site-a", status: "ready", url };
    const client = new FakeAdmin({ deployments: [
      { ...record, organization_id: "org-b" }, { ...record, website_id: "site-b" },
      { ...record, status: "building" }, { ...record, url: "https://older-build.vercel.app" }, record,
    ] }).asClient();
    expect(await getPreviewOverviewPalette(client, website, preview, null)).toBe("#12bf60");
    expect(mocks.publicAccent).toHaveBeenCalledExactlyOnceWith(url);
  });
  it("does not fetch an unrecorded customer preview URL", async () => {
    const client = new FakeAdmin({ deployments: [{ organization_id: "org-b", website_id: "site-b", status: "ready", url: preview.src }] }).asClient();
    expect(await getPreviewOverviewPalette(client, website, preview, null)).toBeNull();
    expect(mocks.publicAccent).not.toHaveBeenCalled();
  });
  it("treats a cosmetic lookup failure as neutral instead of blocking the dashboard", async () => {
    mocks.template.mockRejectedValue(new Error("Temporarily unavailable"));
    expect(await getPreviewOverviewPalette(new FakeAdmin().asClient(), website, template, "creator")).toBeNull();
  });
});
