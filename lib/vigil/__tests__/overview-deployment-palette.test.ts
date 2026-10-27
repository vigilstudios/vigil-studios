import { afterEach, describe, expect, it, vi } from "vitest";
import {
  publicDeploymentOrigin,
  readPublicDeploymentAccent,
} from "../queries/overview-deployment-palette";
const origin = "https://site-build-team.vercel.app";
const response = (body: string, type = "text/html") =>
  new Response(body, { headers: { "content-type": type } });
afterEach(() => vi.unstubAllGlobals());

describe("legacy public deployment palettes", () => {
  it("rejects arbitrary destinations and credentials before any network request", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    for (const url of [
      "http://site.vercel.app",
      "https://vercel.app.evil.test",
      "https://127.0.0.1",
      "https://site.vercel.app:8443",
      "https://name:secret@site.vercel.app",
      "https://customer.example",
      "bad",
    ]) {
      expect(publicDeploymentOrigin(url)).toBeNull();
      expect(await readPublicDeploymentAccent(url)).toBeNull();
    }
    expect(fetcher).not.toHaveBeenCalled();
    expect(publicDeploymentOrigin(`${origin}/anything?ignored=1`)).toBe(origin);
  });

  it("reads only public style tokens with no credentials or redirects", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        response("<style>:root{--pink:#a52d60;--background:#fff4f8}</style>"),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await readPublicDeploymentAccent(origin)).toBe("#a52d60");
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      `${origin}/`,
      expect.objectContaining({
        credentials: "omit",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("limits linked styles to the same deployment and at most two sheets", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          '<link rel="stylesheet" href="https://private.example/a.css"><link href="/a.css" rel="stylesheet"><link rel="stylesheet" href="/b.css"><link rel="stylesheet" href="/c.css">',
        ),
      )
      .mockResolvedValueOnce(response(":root{--accent:#12bf60}", "text/css"))
      .mockResolvedValueOnce(
        response(":root{--background:#fafafa}", "text/css"),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await readPublicDeploymentAccent(origin)).toBe("#12bf60");
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      `${origin}/`,
      `${origin}/a.css`,
      `${origin}/b.css`,
    ]);
  });

  it("falls back to a safe public theme token and treats missing, oversized or failing pages as cosmetic failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response('<meta content="#fff4f8" name="theme-color">'),
      )
      .mockResolvedValueOnce(response("x".repeat(262145)))
      .mockResolvedValueOnce(response("secret", "application/json"))
      .mockRejectedValueOnce(new Error("timeout"));
    vi.stubGlobal("fetch", fetcher);
    expect(await readPublicDeploymentAccent(origin)).toBe("#fff4f8");
    expect(await readPublicDeploymentAccent(origin)).toBeNull();
    expect(await readPublicDeploymentAccent(origin)).toBeNull();
    expect(await readPublicDeploymentAccent(origin)).toBeNull();
  });
});
