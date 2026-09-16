import type { DbClient } from "@/lib/vigil/types";
import { assertTransition, websiteTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError } from "@/lib/vigil/auth/errors";
import { findExternalId, findProviderLink, providerEnum, upsertProviderLink } from "./provider-links";
import { beginDomainVerification } from "./domain";

/**
 * DeploymentService: Vigil Website -> DeploymentProvider.
 *
 * Runs with the service-role client from the job runner. Each step is
 * idempotent: provider ids are looked up before being created, and status
 * transitions are asserted so a retried job cannot regress a live site.
 */
export async function provisionWebsite(
  admin: DbClient,
  websiteId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ siteExternalId: string; organizationId: string }> {
  const { data: website, error } = await admin.from("websites").select("*").eq("id", websiteId).maybeSingle();
  if (error) throw error;
  if (!website) throw new NotFoundError(`Website ${websiteId} not found.`);

  const providerName = providerEnum(provider.name);
  let siteExternalId = await findExternalId(admin, {
    provider: providerName,
    resourceKind: "site",
    entityType: "website",
    entityId: websiteId,
  });

  if (!siteExternalId) {
    const repository = await findProviderLink(admin, {
      provider: "other",
      resourceKind: "repository",
      entityType: "website",
      entityId: websiteId,
    });
    const repositoryMetadata = repository?.metadata as { full_name?: string } | undefined;
    const result = await provider.provisionSite({
      websiteId,
      organizationId: website.organization_id,
      name: `vigil-${website.id.slice(0, 8)}`,
      templateSlug: website.template_slug,
      hostingMode: website.hosting_mode,
      repositoryFullName: repositoryMetadata?.full_name ?? null,
      repositoryId: repository ? Number(repository.external_id) : null,
    });
    siteExternalId = result.externalId;
    await upsertProviderLink(admin, {
      provider: providerName,
      resourceKind: "site",
      externalId: siteExternalId,
      entityType: "website",
      entityId: websiteId,
    });
    if (result.previewUrl) {
      await admin.from("websites").update({ preview_url: result.previewUrl }).eq("id", websiteId);
    }
  }

  if (website.status === "provisioning") {
    assertTransition(websiteTransitions, website.status, "building", "website");
    const { error: updateError } = await admin
      .from("websites")
      .update({ status: "building", status_reason: null })
      .eq("id", websiteId);
    if (updateError) throw updateError;
  }

  return { siteExternalId, organizationId: website.organization_id };
}

export async function deployWebsite(
  admin: DbClient,
  websiteId: string,
  options: { environment?: "production" | "preview"; triggeredBy?: string | null } = {},
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ deploymentId: string; status: string; domainIds: string[] }> {
  const environment = options.environment ?? "production";
  const { siteExternalId, organizationId } = await provisionWebsite(admin, websiteId, provider);

  const repository = await findProviderLink(admin, {
    provider: "other",
    resourceKind: "repository",
    entityType: "website",
    entityId: websiteId,
  });
  const snapshot = await provider.triggerDeployment(siteExternalId, {
    environment,
    ref: "main",
    repositoryId: repository ? Number(repository.external_id) : null,
  });
  const providerName = providerEnum(provider.name);

  const { data: deployment, error } = await admin
    .from("deployments")
    .insert({
      organization_id: organizationId, // the insert trigger re-derives this from the website
      website_id: websiteId,
      environment,
      status: snapshot.status,
      url: snapshot.url,
      triggered_by: options.triggeredBy ?? null,
      started_at: snapshot.createdAt,
      finished_at: snapshot.readyAt,
      error: snapshot.error,
    })
    .select("id")
    .single();
  if (error) throw error;

  await upsertProviderLink(admin, {
    provider: providerName,
    resourceKind: "deployment",
    externalId: snapshot.externalId,
    entityType: "deployment",
    entityId: deployment.id,
  });

  if (environment === "production" && snapshot.status === "ready") {
    const { data: website } = await admin.from("websites").select("status, preview_url").eq("id", websiteId).single();
    const publicUrl = website?.preview_url ?? snapshot.url;
    if (website && website.status !== "live" && websiteTransitions[website.status].includes("live")) {
      await admin
        .from("websites")
        .update({ status: "live", live_url: publicUrl, last_deployed_at: snapshot.readyAt, status_reason: null })
        .eq("id", websiteId);
    } else if (website?.status === "live") {
      await admin.from("websites").update({ live_url: publicUrl, last_deployed_at: snapshot.readyAt }).eq("id", websiteId);
    }
  } else if (snapshot.status === "error") {
    await admin
      .from("websites")
      .update({ status_reason: snapshot.error?.message ?? "The last publish did not complete." })
      .eq("id", websiteId);
  }

  const domainIds = environment === "production" && snapshot.status === "ready"
    ? await attachWebsiteDomains(admin, websiteId, provider)
    : [];

  return { deploymentId: deployment.id, status: snapshot.status, domainIds };
}

/** Poll a provider deployment and reflect its terminal state in Vigil. */
export async function syncDeployment(
  admin: DbClient,
  deploymentId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ status: string; pending: boolean; domainIds: string[] }> {
  const { data: deployment, error } = await admin.from("deployments").select("*").eq("id", deploymentId).maybeSingle();
  if (error) throw error;
  if (!deployment) throw new NotFoundError(`Deployment ${deploymentId} not found.`);
  const externalId = await findExternalId(admin, {
    provider: providerEnum(provider.name), resourceKind: "deployment", entityType: "deployment", entityId: deploymentId,
  });
  if (!externalId) throw new NotFoundError("The provider deployment link is missing.");
  const snapshot = await provider.getDeployment(externalId);
  if (!snapshot) throw new NotFoundError(`Provider deployment ${externalId} not found.`);
  await admin.from("deployments").update({
    status: snapshot.status,
    url: snapshot.url,
    started_at: snapshot.createdAt,
    finished_at: snapshot.readyAt,
    error: snapshot.error,
  }).eq("id", deploymentId);

  let domainIds: string[] = [];
  if (snapshot.status === "ready" && deployment.environment === "production") {
    await provisionWebsite(admin, deployment.website_id, provider);
    const { data: website } = await admin.from("websites").select("preview_url").eq("id", deployment.website_id).single();
    await admin.from("websites").update({ status: "live", live_url: website?.preview_url ?? snapshot.url, last_deployed_at: snapshot.readyAt ?? new Date().toISOString(), status_reason: null }).eq("id", deployment.website_id);
    domainIds = await attachWebsiteDomains(admin, deployment.website_id, provider);
  } else if (snapshot.status === "error") {
    await admin.from("websites").update({ status_reason: snapshot.error?.message ?? "The last publish did not complete." }).eq("id", deployment.website_id);
  }
  return { status: snapshot.status, pending: snapshot.status === "queued" || snapshot.status === "building", domainIds };
}

async function attachWebsiteDomains(admin: DbClient, websiteId: string, provider: DeploymentProvider): Promise<string[]> {
  const { data: domains, error } = await admin.from("domains").select("id").eq("website_id", websiteId).neq("status", "released");
  if (error) throw error;
  for (const domain of domains ?? []) {
    await beginDomainVerification(admin, domain.id, provider);
  }
  return (domains ?? []).map((domain) => domain.id);
}
