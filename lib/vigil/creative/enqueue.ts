import type { DbClient } from "@/lib/vigil/types";
import { autoGeneratesFor, readCreativeConfig, type CreativeConfig } from "./config";

export const CREATIVE_WORKSPACE_JOB_KIND = "website.creative_workspace";

/** The once-per-repository key Create Repo uses; a staff regeneration uses a fresh key. */
export function creativeWorkspaceJobKey(websiteId: string, regeneration?: string): string {
  return regeneration ? `${CREATIVE_WORKSPACE_JOB_KIND}:${websiteId}:${regeneration}` : `${CREATIVE_WORKSPACE_JOB_KIND}:${websiteId}`;
}

/**
 * Whether Create Repo should queue a workspace for this website on its own.
 * Express sites are template copies and skip it by default; the admin can
 * still generate one explicitly from the website page.
 */
export async function shouldAutoGenerate(admin: DbClient, websiteId: string, config: CreativeConfig = readCreativeConfig()): Promise<{ generate: boolean; organizationId: string; projectId: string | null }> {
  const { data, error } = await admin
    .from("websites")
    .select("organization_id, project_id, project:projects!websites_project_id_fkey(kind)")
    .eq("id", websiteId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { generate: false, organizationId: "", projectId: null };
  const project = Array.isArray(data.project) ? data.project[0] : data.project;
  return { generate: autoGeneratesFor(config, project?.kind ?? null), organizationId: data.organization_id, projectId: data.project_id };
}
