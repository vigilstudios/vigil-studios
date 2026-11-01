import "server-only";
import type { DbClient, Website } from "@/lib/vigil/types";
import type { PreviewSource } from "@/lib/vigil/presenters";
import { publishedExpressVariant } from "@/lib/vigil/express/library";
import { safePreviewAccent } from "@/lib/vigil/overview/palette";
import { readPublicDeploymentAccent } from "./overview-deployment-palette";

/** Tint the card from the design actually displayed, rather than unsent brief colours. */
export async function getPreviewOverviewPalette(client: DbClient, website: Website | null, preview: PreviewSource, templateSlug: string | null): Promise<string | null> {
  try {
    if (preview.kind === "template" && templateSlug) {
      return safePreviewAccent((await publishedExpressVariant(templateSlug, client))?.accent);
    }
    if (preview.kind === "none" || !website) return null;
    const metadata = website.metadata && typeof website.metadata === "object" && !Array.isArray(website.metadata) ? website.metadata : {};
    const saved = safePreviewAccent(metadata.preview_accent);
    if (saved) return saved;
    // Only use the ready deployment recorded for this exact authenticated site and preview.
    const { data, error } = await client.from("deployments").select("url")
      .eq("organization_id", website.organization_id).eq("website_id", website.id)
      .eq("status", "ready").in("url", [preview.src, preview.src.replace(/\/$/, "")])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return !error && data?.url ? await readPublicDeploymentAccent(data.url) : null;
  } catch {
    return null; // A cosmetic lookup must never block the client's overview.
  }
}
