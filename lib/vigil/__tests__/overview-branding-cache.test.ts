import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cached = vi.hoisted(() => new Map<string, unknown>());
// Model Next's fulfilled-result cache: null is cacheable, rejected reads are not.
// This catches accidentally swallowing failures inside the persistent boundary.
vi.mock("next/cache", () => ({
  unstable_cache:
    (read: (...args: string[]) => Promise<unknown>, keys: string[]) =>
    async (...args: string[]) => {
      const key = JSON.stringify([keys, args]);
      if (cached.has(key)) return cached.get(key);
      const result = await read(...args);
      cached.set(key, result);
      return result;
    },
}));

import {
  publicDeploymentText,
  readPublicDeploymentAccent,
} from "../queries/overview-deployment-palette";
import { deploymentIcon } from "../queries/website-icon";

const origin = "https://published-customer.vercel.app";
const html =
  '<style>:root{--brand:#a52d60}</style><link rel="icon" href="/sparkle.svg">';
const document = () =>
  new Response(html, { headers: { "content-type": "text/html" } });
beforeEach(() => cached.clear());
afterEach(() => vi.unstubAllGlobals());

describe("published branding cache recovery", () => {
  it("recovers both color and icon after a temporary 404 and caches only the successful document", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("Not Found", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(document());
    vi.stubGlobal("fetch", fetcher);

    expect(await publicDeploymentText(`${origin}/`, "html")).toBeNull();
    expect(await readPublicDeploymentAccent(origin)).toBe("#a52d60");
    expect(
      deploymentIcon(
        (await publicDeploymentText(`${origin}/`, "html"))!,
        origin,
      ),
    ).toBe(`${origin}/sparkle.svg`);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith(
      `${origin}/`,
      expect.objectContaining({
        cache: "no-store",
        redirect: "error",
        credentials: "omit",
      }),
    );
    expect(fetcher.mock.calls[0][1]).not.toHaveProperty("next");
  });

  it.each(["timeout", "wrong content type", "oversized", "empty"])(
    "does not retain a %s failure between requests",
    async (failure) => {
      const fetcher = vi.fn();
      if (failure === "timeout")
        fetcher.mockRejectedValueOnce(new Error("timeout"));
      else if (failure === "wrong content type")
        fetcher.mockResolvedValueOnce(
          new Response("{}", {
            headers: { "content-type": "application/json" },
          }),
        );
      else
        fetcher.mockResolvedValueOnce(
          new Response(failure === "oversized" ? "x".repeat(262145) : "", {
            headers: { "content-type": "text/html" },
          }),
        );
      fetcher.mockResolvedValueOnce(document());
      vi.stubGlobal("fetch", fetcher);

      expect(await publicDeploymentText(`${origin}/`, "html")).toBeNull();
      expect(await publicDeploymentText(`${origin}/`, "html")).toBe(html);
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );

  it("keeps successful documents separate for each deployment and response type", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(document())
      .mockResolvedValueOnce(
        new Response("other site", {
          headers: { "content-type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(":root{--brand:#12bf60}", {
          headers: { "content-type": "text/css" },
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await publicDeploymentText(`${origin}/`, "html")).toBe(html);
    expect(
      await publicDeploymentText("https://other-customer.vercel.app/", "html"),
    ).toBe("other site");
    expect(await publicDeploymentText(`${origin}/`, "css")).toBe(
      ":root{--brand:#12bf60}",
    );
    expect(await publicDeploymentText(`${origin}/`, "html")).toBe(html);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
