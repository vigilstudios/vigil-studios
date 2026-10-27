import { afterEach, describe, expect, it, vi } from "vitest";
import type { DbClient } from "../types";
import { deploymentIcon, getWebsiteIcon } from "../queries/website-icon";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceSiteIcon } from "@/components/vigil/WorkspaceSiteIcon";

const origin = "https://customer-build.vercel.app";
const site = { id: "site-one", last_deployed_at: "2026-10-27T12:00:00Z" };
afterEach(() => vi.unstubAllGlobals());
function database(url: string | null, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: url ? { url } : null, error }),
  };
  const from = vi.fn(() => query);
  return { client: { from } as unknown as DbClient, query, from };
}
describe("published customer site icons", () => {
  it("uses Vigil when there is no icon and the customer's own asset when present", () => {
    const fallback = renderToStaticMarkup(
      createElement(WorkspaceSiteIcon, { name: "Customer One", iconUrl: null }),
    );
    expect(fallback).toContain('alt="Vigil"');
    const customer = renderToStaticMarkup(
      createElement(WorkspaceSiteIcon, {
        name: "Customer Two",
        iconUrl: `${origin}/own-icon.svg`,
      }),
    );
    expect(customer).toContain(`${origin}/own-icon.svg`);
    expect(customer).toContain('alt="Customer Two site icon"');
    expect(customer).not.toContain('alt="Vigil"');
  });
  it("resolves the site's actual icon path and prefers it over a touch icon", () => {
    expect(
      deploymentIcon(
        '<link rel="apple-touch-icon" href="/touch.png"><link href="/assets/sparkle.svg" rel="shortcut icon">',
        origin,
      ),
    ).toBe(`${origin}/assets/sparkle.svg`);
    expect(
      deploymentIcon(
        "<link REL=icon HREF='/icon.png?v=1&amp;size=32'>",
        origin,
      ),
    ).toBe(`${origin}/icon.png?v=1&size=32`);
  });
  it("resolves independent icons for different customers instead of sharing branding", async () => {
    const first = database("https://first-customer.vercel.app");
    const second = database("https://second-customer.vercel.app");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(
          async (url: string) =>
            new Response(
              `<link rel="icon" href="/${url.includes("first-customer") ? "first" : "second"}.svg">`,
              { headers: { "content-type": "text/html" } },
            ),
        ),
    );
    expect(await getWebsiteIcon(first.client, "org-first", site)).toBe(
      "https://first-customer.vercel.app/first.svg",
    );
    expect(
      await getWebsiteIcon(second.client, "org-second", {
        ...site,
        id: "site-second",
      }),
    ).toBe("https://second-customer.vercel.app/second.svg");
    expect(first.query.eq).toHaveBeenCalledWith("organization_id", "org-first");
    expect(second.query.eq).toHaveBeenCalledWith(
      "organization_id",
      "org-second",
    );
    expect(second.query.eq).toHaveBeenCalledWith("website_id", "site-second");
  });
  it("rejects other hosts, credentials and executable URLs in public markup", () => {
    for (const href of [
      "https://private.example/icon.svg",
      "//evil.example/icon.svg",
      "javascript:alert(1)",
      "data:image/svg+xml,a",
      "https://user:secret@customer-build.vercel.app/icon.svg",
    ]) {
      expect(deploymentIcon(`<link rel="icon" href="${href}">`, origin)).toBe(
        `${origin}/favicon.ico`,
      );
    }
    expect(
      deploymentIcon('<link data-rel="icon" data-href="/wrong.svg">', origin),
    ).toBe(`${origin}/favicon.ico`);
    expect(
      deploymentIcon(
        '<link rel="icon" href="/icon.svg">',
        "https://customer.example",
      ),
    ).toBeNull();
  });
  it("uses only the current tenant/site's ready production deployment, not a later build", async () => {
    const db = database(origin);
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<link rel="icon" href="/sparkle.svg">', {
        headers: { "content-type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    expect(await getWebsiteIcon(db.client, "org-one", site)).toBe(
      `${origin}/sparkle.svg`,
    );
    expect(db.from).toHaveBeenCalledWith("deployments");
    expect(db.query.eq.mock.calls).toEqual([
      ["organization_id", "org-one"],
      ["website_id", "site-one"],
      ["environment", "production"],
      ["status", "ready"],
    ]);
    expect(db.query.lte).toHaveBeenCalledWith(
      "finished_at",
      site.last_deployed_at,
    );
    expect(db.query.limit).toHaveBeenCalledWith(1);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      `${origin}/`,
      expect.objectContaining({
        credentials: "omit",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
  });
  it("never fetches an arbitrary customer URL or a site with no publication timestamp", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const db = database("https://127.0.0.1/private");
    expect(await getWebsiteIcon(db.client, "org-one", site)).toBeNull();
    expect(
      await getWebsiteIcon(db.client, "org-one", {
        ...site,
        last_deployed_at: null,
      }),
    ).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("leaves the Vigil fallback available when the deployment or document is unavailable", async () => {
    expect(
      await getWebsiteIcon(
        database(null, { message: "denied" }).client,
        "org-one",
        site,
      ),
    ).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(
      await getWebsiteIcon(database(origin).client, "org-one", site),
    ).toBeNull();
  });
});
