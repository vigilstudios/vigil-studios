import type { DbClient } from "@/lib/vigil/types";
import { assertTransition, websiteTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import { assertProductionDeployAllowed } from "@/lib/vigil/project-reviews";
import { findExternalId, findProviderLink, providerEnum, upsertProviderLink } from "./provider-links";
import { activateDomainVerification, beginDomainVerification } from "./domain";
import { advanceWebsiteProjectStatus } from "./project-status";

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
): Promise<{ deploymentId: string; status: string; domainIds: string[]; customerReady: boolean }> {
  const environment = options.environment ?? "production";
  // This check belongs at the service boundary so a manually inserted job,
  // retry, or future admin surface cannot bypass Professional approvals.
  // Preview builds are deliberately excluded: they are what staff use to
  // publish each version for the customer to review.
  if (environment === "production") {
    await assertProductionDeployAllowed(admin, websiteId);
    await assertDomainsReadyForLaunch(admin, websiteId);
  }
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

  let domainIds: string[] = [];
  let customerReady = false;
  if (snapshot.status === "ready" && environment === "preview" && snapshot.url) {
    await admin.from("websites").update({ preview_url: snapshot.url, status_reason: null }).eq("id", websiteId);
    await advanceWebsiteProjectStatus(admin, websiteId, "review", snapshot.readyAt ?? new Date().toISOString());
    await prepareWebsiteDomains(admin, websiteId, provider);
    customerReady = true;
  } else if (environment === "production" && snapshot.status === "ready") {
    await admin.from("websites").update({ last_deployed_at: snapshot.readyAt, status_reason: "The production build is ready. We are activating your secure domain." }).eq("id", websiteId);
    domainIds = await activateWebsiteDomains(admin, websiteId, provider);
    customerReady = await finalizeWebsiteLaunch(admin, websiteId, deployment.id);
  } else if (snapshot.status === "error") {
    await admin
      .from("websites")
      .update({ status_reason: snapshot.error?.message ?? "The last publish did not complete." })
      .eq("id", websiteId);
  }

  return { deploymentId: deployment.id, status: snapshot.status, domainIds, customerReady };
}

/** Poll a provider deployment and reflect its terminal state in Vigil. */
export async function syncDeployment(
  admin: DbClient,
  deploymentId: string,
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ status: string; pending: boolean; domainIds: string[]; customerReady: boolean }> {
  const { data: deployment, error } = await admin.from("deployments").select("*").eq("id", deploymentId).maybeSingle();
  if (error) throw error;
  if (!deployment) throw new NotFoundError(`Deployment ${deploymentId} not found.`);
  // Keep a production deployment from being promoted by the asynchronous
  // polling path if it was created outside deployWebsite.
  if (deployment.environment === "production") {
    await assertProductionDeployAllowed(admin, deployment.website_id);
    await assertDomainsReadyForLaunch(admin, deployment.website_id);
  }
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
  let customerReady = false;
  if (snapshot.status === "ready" && deployment.environment === "preview" && snapshot.url) {
    await admin.from("websites").update({ preview_url: snapshot.url, status_reason: null }).eq("id", deployment.website_id);
    await advanceWebsiteProjectStatus(admin, deployment.website_id, "review", snapshot.readyAt ?? new Date().toISOString());
    await prepareWebsiteDomains(admin, deployment.website_id, provider);
    customerReady = true;
  } else if (snapshot.status === "ready" && deployment.environment === "production") {
    await provisionWebsite(admin, deployment.website_id, provider);
    await admin.from("websites").update({ last_deployed_at: snapshot.readyAt ?? new Date().toISOString(), status_reason: "The production build is ready. We are activating your secure domain." }).eq("id", deployment.website_id);
    domainIds = await activateWebsiteDomains(admin, deployment.website_id, provider);
    customerReady = await finalizeWebsiteLaunch(admin, deployment.website_id, deploymentId);
  } else if (snapshot.status === "error") {
    await admin.from("websites").update({ status_reason: snapshot.error?.message ?? "The last publish did not complete." }).eq("id", deployment.website_id);
  }
  return { status: snapshot.status, pending: snapshot.status === "queued" || snapshot.status === "building", domainIds, customerReady };
}

async function assertDomainsReadyForLaunch(admin: DbClient, websiteId: string): Promise<void> {
  const { data: domains, error } = await admin.from("domains").select("id, hostname, status, dns_ok, verification").eq("website_id", websiteId).neq("status", "released");
  if (error) throw error;
  const pending = (domains ?? []).filter((domain) => {
    if (domain.status === "connected") return false;
    const verification = domain.verification as { launch_ready?: boolean; source?: string } | null;
    return !(domain.dns_ok && (verification?.launch_ready || verification?.source === "provider"));
  });
  if (pending.length > 0) {
    throw new ValidationError(`Configure and verify DNS for ${pending.map((domain) => domain.hostname).join(", ")} before deploying live.`);
  }
}

async function prepareWebsiteDomains(admin: DbClient, websiteId: string, provider: DeploymentProvider): Promise<void> {
  const { data: domains, error } = await admin.from("domains").select("id").eq("website_id", websiteId).neq("status", "released");
  if (error) throw error;
  for (const domain of domains ?? []) await beginDomainVerification(admin, domain.id, provider);
}

async function activateWebsiteDomains(admin: DbClient, websiteId: string, provider: DeploymentProvider): Promise<string[]> {
  const { data: domains, error } = await admin.from("domains").select("id").eq("website_id", websiteId).neq("status", "released");
  if (error) throw error;
  for (const domain of domains ?? []) {
    await activateDomainVerification(admin, domain.id, provider);
  }
  return (domains ?? []).map((domain) => domain.id);
}

/** Promote the dashboard and public URL only after every custom domain works. */
export async function finalizeWebsiteLaunch(admin: DbClient, websiteId: string, deploymentId: string): Promise<boolean> {
  const [{ data: website, error: websiteError }, { data: deployment, error: deploymentError }, { data: domains, error: domainsError }] = await Promise.all([
    admin.from("websites").select("status, live_url").eq("id", websiteId).maybeSingle(),
    admin.from("deployments").select("environment, status, url, finished_at").eq("id", deploymentId).maybeSingle(),
    admin.from("domains").select("id, hostname, status, verification").eq("website_id", websiteId).neq("status", "released"),
  ]);
  if (websiteError) throw websiteError;
  if (deploymentError) throw deploymentError;
  if (domainsError) throw domainsError;
  if (!website || !deployment || deployment.environment !== "production" || deployment.status !== "ready") return false;
  if ((domains ?? []).some((domain) => domain.status !== "connected")) return false;

  const primary = (domains ?? [])[0];
  const canonical = (primary?.verification as { canonical_hostname?: string } | null)?.canonical_hostname ?? primary?.hostname;
  const publicUrl = canonical ? `https://${canonical}` : deployment.url;
  if (!publicUrl) return false;
  if (website.status !== "live") {
    assertTransition(websiteTransitions, website.status, "live", "website");
  }
  const { error } = await admin.from("websites").update({
    status: "live",
    live_url: publicUrl,
    ...(primary ? { primary_domain_id: primary.id } : {}),
    last_deployed_at: deployment.finished_at ?? new Date().toISOString(),
    status_reason: null,
  }).eq("id", websiteId);
  if (error) throw error;
  await advanceWebsiteProjectStatus(admin, websiteId, "launched", deployment.finished_at ?? new Date().toISOString());
  return true;
}
