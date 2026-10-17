import "server-only";
import type { DbClient } from "../types";
import type { DeploymentProvider } from "../providers/types";
import { getReviewDeployReadiness } from "../project-reviews";
import { findProviderLink, providerEnum } from "./provider-links";

/** Read-only eligibility check shared by first activation and later manual checks. */
export async function domainProductionContext(admin: DbClient, websiteId: string, organizationId: string, provider: DeploymentProvider) {
  if (provider.name !== "vercel") return null;
  const { data: website, error: websiteError } = await admin.from("websites").select("id,organization_id,status").eq("id", websiteId).eq("organization_id", organizationId).maybeSingle();
  if (websiteError) throw websiteError;
  if (!website || ["archived", "suspended", "paused"].includes(website.status)) return null;
  const { data: deployment, error } = await admin.from("deployments").select("id,status,organization_id").eq("website_id", websiteId).eq("environment", "production").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!deployment || deployment.status !== "ready" || deployment.organization_id !== organizationId) return null;
  if (!(await getReviewDeployReadiness(admin, websiteId)).allowed) return null;
  const link = await findProviderLink(admin, { provider: providerEnum(provider.name), resourceKind: "deployment", entityType: "deployment", entityId: deployment.id });
  if (!link) return null;
  const { data: workspace, error: workspaceError } = await admin.from("design_workspaces").select("revision,repository_revision,repository_commit").eq("website_id", websiteId).maybeSingle();
  if (workspaceError) throw workspaceError;
  if (workspace && (workspace.revision !== workspace.repository_revision || !workspace.repository_commit || (link.metadata as { source_commit?: string } | null)?.source_commit !== workspace.repository_commit)) return null;
  const actual = await provider.getDeployment(link.external_id);
  if (!actual || actual.externalId !== link.external_id || actual.status !== "ready" || actual.environment !== "production") return null;
  return { id: deployment.id, externalId: link.external_id, url: actual.url };
}
