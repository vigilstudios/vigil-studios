import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import {
  previewAccentFromSite,
  safePreviewAccent,
} from "@/lib/vigil/overview/palette";
import { readPublicDeploymentAccent } from "./overview-deployment-palette";

/** A cosmetic projection from the saved deployment palette; never fetch an arbitrary customer URL. */
export async function getOverviewPalette(
  client: DbClient,
  organizationId: string,
  websiteId: string,
): Promise<string | null> {
  // Verify access under RLS before looking up a service-only immutable runtime.
  const { data: site, error } = await client
    .from("websites")
    .select("id,metadata,last_deployed_at")
    .eq("id", websiteId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !site) return null;
  const metadata =
    site.metadata &&
    typeof site.metadata === "object" &&
    !Array.isArray(site.metadata)
      ? site.metadata
      : {};
  const fallback = safePreviewAccent(metadata.preview_accent);
  if (!site.last_deployed_at) return fallback;
  if (hasAdminClient()) {
    const { data: snapshot, error: snapshotError } = await createAdminClient()
      .from("website_content_runtimes")
      .select("site_definition")
      .eq("website_id", websiteId)
      .eq("organization_id", organizationId)
      .lte("created_at", site.last_deployed_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const accent = snapshotError
      ? null
      : previewAccentFromSite(snapshot?.site_definition);
    if (accent) return accent;
  }
  if (fallback) return fallback;
  // Older custom sites have no Design Engine snapshot. Use the recorded public production build.
  const { data: deployment, error: deploymentError } = await client
    .from("deployments")
    .select("url")
    .eq("organization_id", organizationId)
    .eq("website_id", websiteId)
    .eq("environment", "production")
    .eq("status", "ready")
    .lte("finished_at", site.last_deployed_at)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return !deploymentError && deployment?.url
    ? readPublicDeploymentAccent(deployment.url)
    : null;
}
