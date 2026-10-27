import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import {
  previewAccentFromCss,
  previewAccentFromSite,
  safePreviewAccent,
} from "../overview/palette";
import { getOverviewPalette } from "../queries/overview-palette";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  available: vi.fn(),
  publicAccent: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.admin,
  hasAdminClient: mocks.available,
}));
vi.mock("../queries/overview-deployment-palette", () => ({
  readPublicDeploymentAccent: mocks.publicAccent,
}));
const deployed = "2026-10-26T18:00:00Z";
const definition = (accent: string) => ({
  settings: { brand: { colors: { accent } } },
});
const website = {
  id: "site-a",
  organization_id: "org-a",
  last_deployed_at: deployed,
  metadata: { preview_accent: "#abcdef" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.available.mockReturnValue(true);
  mocks.publicAccent.mockResolvedValue(null);
});

describe("public preview palette", () => {
  it("accepts only a single hex color and uses the design theme when no override exists", () => {
    expect(safePreviewAccent("#12BF60")).toBe("#12bf60");
    for (const input of [
      "red",
      "url(https://example.com)",
      "#fff;background:red",
      null,
      {},
      "#fff",
    ])
      expect(safePreviewAccent(input)).toBeNull();
    expect(previewAccentFromSite(definition("#CB7286"))).toBe("#cb7286");
    expect(
      previewAccentFromSite({ settings: { brand: { theme: "neutral" } } }),
    ).toBe("#354d80");
    expect(
      previewAccentFromSite({ settings: { brand: { theme: "unknown" } } }),
    ).toBeNull();
    expect(previewAccentFromSite(null)).toBeNull();
  });

  it("uses public brand tokens, including pink, without choosing status colors or quiet backgrounds", () => {
    expect(
      previewAccentFromCss(
        ":root{--pink:#a52d60;--ink:#352630;--background:#fff4f8;--error:#ff0000}",
      ),
    ).toBe("#a52d60");
    expect(
      previewAccentFromCss(
        ":root{--blue:#00f;--brand:#12bf60;--primary-text:#ff0000}",
      ),
    ).toBe("#12bf60");
    expect(
      previewAccentFromCss(":root{--paper:#fffafc;--gray:#555}"),
    ).toBeNull();
  });
  it("requires RLS-visible access to the same organization and website before using a service client", async () => {
    const client = new FakeAdmin({ websites: [website] }).asClient();
    expect(await getOverviewPalette(client, "org-b", "site-a")).toBeNull();
    expect(await getOverviewPalette(client, "org-a", "site-b")).toBeNull();
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("projects only the published site's palette and excludes other tenants, sites and newer exports", async () => {
    const snapshot = {
      organization_id: "org-a",
      website_id: "site-a",
      created_at: "2026-10-25T12:00:00Z",
      site_definition: definition("#cb7286"),
    };
    mocks.admin.mockReturnValue(
      new FakeAdmin({
        website_content_runtimes: [
          {
            ...snapshot,
            organization_id: "org-b",
            site_definition: definition("#ff0000"),
          },
          {
            ...snapshot,
            website_id: "site-b",
            site_definition: definition("#ff0000"),
          },
          {
            ...snapshot,
            created_at: "2026-10-27T12:00:00Z",
            site_definition: definition("#ff0000"),
          },
          snapshot,
        ],
      }).asClient(),
    );
    const client = new FakeAdmin({ websites: [website] }).asClient();
    expect(await getOverviewPalette(client, "org-a", "site-a")).toBe("#cb7286");
  });

  it("uses only the RLS-visible ready production deployment for a legacy site's color", async () => {
    mocks.available.mockReturnValue(false);
    mocks.publicAccent.mockResolvedValue("#a52d60");
    const build = {
      organization_id: "org-a",
      website_id: "site-a",
      status: "ready",
      environment: "production",
      finished_at: deployed,
      url: "https://site-build.vercel.app",
    };
    const client = new FakeAdmin({
      websites: [{ ...website, metadata: {} }],
      deployments: [
        { ...build, organization_id: "org-b", url: "https://wrong.vercel.app" },
        { ...build, website_id: "site-b", url: "https://wrong.vercel.app" },
        { ...build, status: "error", url: "https://wrong.vercel.app" },
        { ...build, environment: "preview", url: "https://wrong.vercel.app" },
        {
          ...build,
          finished_at: "2026-10-27T12:00:00Z",
          url: "https://wrong.vercel.app",
        },
        build,
      ],
    }).asClient();
    expect(await getOverviewPalette(client, "org-a", "site-a")).toBe("#a52d60");
    expect(mocks.publicAccent).toHaveBeenCalledExactlyOnceWith(build.url);
  });
  it("uses a safe metadata fallback when historical deployment palettes are unavailable", async () => {
    mocks.available.mockReturnValue(false);
    const client = new FakeAdmin({ websites: [website] }).asClient();
    expect(await getOverviewPalette(client, "org-a", "site-a")).toBe("#abcdef");
    expect(mocks.admin).not.toHaveBeenCalled();
    mocks.available.mockReturnValue(true);
    mocks.admin.mockReturnValue(new FakeAdmin().asClient());
    expect(await getOverviewPalette(client, "org-a", "site-a")).toBe("#abcdef");
  });
});
