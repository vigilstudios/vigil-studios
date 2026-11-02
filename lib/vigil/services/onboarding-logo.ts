import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import { LOGO_ACCEPT, PROJECT_ASSETS_BUCKET } from "@/lib/vigil/onboarding/assets";
import { logoCompletionIssue, type Brand } from "@/lib/vigil/onboarding/brief";
import { ValidationError } from "@/lib/vigil/auth/errors";

/** A client claim cannot substitute for a recorded logo in this project's Files. */
export async function assertLogoChoice(db: DbClient, organizationId: string, projectId: string, logo: Brand["logo"] | undefined): Promise<void> {
  let hasLogo = false;
  if (logo?.mode === "upload") {
    const { data, error } = await db.from("project_assets").select("content_type,bucket_id,object_path,size_bytes").eq("organization_id", organizationId).eq("project_id", projectId).eq("kind", "logo");
    if (error) throw error;
    hasLogo = Boolean(data?.some(asset => asset.bucket_id === PROJECT_ASSETS_BUCKET && asset.object_path.startsWith(`${organizationId}/${projectId}/`) && LOGO_ACCEPT.split(",").includes(asset.content_type) && asset.size_bytes > 0));
  }
  const issue = logoCompletionIssue(logo, hasLogo);
  if (issue) throw new ValidationError(issue);
}
