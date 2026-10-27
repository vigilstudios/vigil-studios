import "server-only";
import type { DbClient, Website } from "@/lib/vigil/types";
import {
  publicDeploymentOrigin,
  publicDeploymentText,
} from "./overview-deployment-palette";

/** Only images on the recorded public deployment can become workspace branding. */
export function deploymentIcon(
  html: string,
  deploymentUrl: string,
): string | null {
  const origin = publicDeploymentOrigin(deploymentUrl);
  if (!origin) return null;
  const attribute = (tag: string, name: string) =>
    tag
      .match(
        new RegExp(
          `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
          "i",
        ),
      )
      ?.slice(1)
      .find((value) => value !== undefined);
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => ({
    rel: attribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [],
    href: attribute(tag, "href"),
  }));
  // Prefer the site's browser icon to the larger home-screen touch icon.
  for (const rel of ["icon", "apple-touch-icon"]) {
    for (const link of tags) {
      if (!link.rel.includes(rel) || !link.href) continue;
      try {
        const iconUrl: URL = new URL(link.href.replace(/&amp;/gi, "&"), origin);
        if (iconUrl.origin === origin && !iconUrl.username && !iconUrl.password)
          return iconUrl.href;
      } catch {
        /* Ignore malformed public markup. */
      }
    }
  }
  return `${origin}/favicon.ico`;
}

/** Caller supplies an RLS-loaded live site. No arbitrary customer host is fetched. */
export async function getWebsiteIcon(
  client: DbClient,
  organizationId: string,
  site: Pick<Website, "id" | "last_deployed_at">,
): Promise<string | null> {
  if (!site.last_deployed_at) return null;
  const { data, error } = await client
    .from("deployments")
    .select("url")
    .eq("organization_id", organizationId)
    .eq("website_id", site.id)
    .eq("environment", "production")
    .eq("status", "ready")
    .lte("finished_at", site.last_deployed_at)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.url) return null;
  const origin = publicDeploymentOrigin(data.url);
  if (!origin) return null;
  try {
    const html = await publicDeploymentText(`${origin}/`, "html");
    return html ? deploymentIcon(html, origin) : null;
  } catch {
    return null;
  } // Missing branding must not prevent account access.
}
