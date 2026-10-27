import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  previewAccentFromCss,
  safePreviewAccent,
} from "@/lib/vigil/overview/palette";

/** Only a provider-recorded Vercel deployment can supply this cosmetic fallback. */
export function publicDeploymentOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^[a-z\d][a-z\d-]*\.vercel\.app$/i.test(url.hostname)
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

async function fetchPublicDeploymentText(
  url: string,
  type: "html" | "css",
): Promise<string> {
  const response = await fetch(url, {
    redirect: "error", // Never follow customer-controlled redirects to another network destination.
    credentials: "omit",
    signal: AbortSignal.timeout(6000),
    // Cache the validated document below, never a transient HTTP error response.
    cache: "no-store",
  });
  if (
    !response.ok ||
    !response.headers
      .get("content-type")
      ?.includes(type === "html" ? "text/html" : "text/css")
  ) {
    await response.body?.cancel();
    throw new Error("Public branding document unavailable");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Public branding document has no body");
  const decoder = new TextDecoder();
  let text = "",
    bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      const document = text + decoder.decode();
      if (!document.trim())
        throw new Error("Public branding document is empty");
      return document;
    }
    bytes += chunk.value.byteLength;
    if (bytes > 262144) {
      await reader.cancel();
      throw new Error("Public branding document exceeds the size limit");
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
}

// Only fulfilled, bounded documents enter the cross-request cache. Exceptions
// leave it empty so the next request can recover instead of retaining a fallback.
const cachedPublicDeploymentText = unstable_cache(
  fetchPublicDeploymentText,
  ["published-website-branding-v2"],
  { revalidate: 3600 },
);

/** Icon and palette reads share one document within a server render. */
export const publicDeploymentText = cache(
  async (url: string, type: "html" | "css"): Promise<string | null> => {
    if (!publicDeploymentOrigin(url)) return null;
    try {
      return await cachedPublicDeploymentText(url, type);
    } catch {
      return null;
    }
  },
);

/** Read public style tokens only; no cookies, provider credentials, arbitrary hosts, scripts or page content leave the server. */
export async function readPublicDeploymentAccent(
  deploymentUrl: string,
): Promise<string | null> {
  const origin = publicDeploymentOrigin(deploymentUrl);
  if (!origin) return null;
  try {
    const html = await publicDeploymentText(`${origin}/`, "html");
    if (!html) return null;
    const inline = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
      .map((m) => m[1])
      .join("\n");
    const accent = previewAccentFromCss(inline);
    if (accent) return accent;
    const sheets = [...html.matchAll(/<link\b[^>]*>/gi)]
      .flatMap(([tag]) => {
        if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return [];
        const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
        if (!href) return [];
        try {
          const url = new URL(href, origin);
          return url.origin === origin ? [url.href] : [];
        } catch {
          return [];
        }
      })
      .slice(0, 2);
    const css = await Promise.all(
      sheets.map((url) => publicDeploymentText(url, "css").catch(() => null)),
    );
    const linked = previewAccentFromCss(css.filter(Boolean).join("\n"));
    if (linked) return linked;
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      if (!/\bname\s*=\s*["']theme-color["']/i.test(tag)) continue;
      const theme = safePreviewAccent(
        tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1],
      );
      if (theme) return theme;
    }
    return null;
  } catch {
    return null;
  } // Cosmetic failure must never break the client dashboard.
}
