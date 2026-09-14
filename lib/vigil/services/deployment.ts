import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { assertTransition, websiteTransitions } from "@/lib/vigil/lifecycle";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { NotFoundError } from "@/lib/vigil/auth/errors";
import { findExternalId, providerEnum, upsertProviderLink } from "./provider-links";

/**
 * DeploymentService: Vigil Website -> DeploymentProvider.
 *
 * Runs with the service-role client from the job runner. Each step is
 * idempotent: provider ids are looked up before being created, and status
 * transitions are asserted so a retried job cannot regress a live site.
 */
export async function provisionWebsite(
  admin: AdminSupabaseClient,
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
    const result = await provider.provisionSite({
      websiteId,
      organizationId: website.organization_id,
      name: `vigil-${website.id.slice(0, 8)}`,
      templateSlug: website.template_slug,
      hostingMode: website.hosting_mode,
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
  admin: AdminSupabaseClient,
  websiteId: string,
  options: { environment?: "production" | "preview"; triggeredBy?: string | null } = {},
  provider: DeploymentProvider = getDeploymentProvider()
): Promise<{ deploymentId: string }> {
  const environment = options.environment ?? "production";
  const { siteExternalId, organizationId } = await provisionWebsite(admin, websiteId, provider);

  const snapshot = await provider.triggerDeployment(siteExternalId, { environment });
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
    const { data: website } = await admin.from("websites").select("status").eq("id", websiteId).single();
    if (website && website.status !== "live" && websiteTransitions[website.status].includes("live")) {
      await admin
        .from("websites")
        .update({ status: "live", live_url: snapshot.url, last_deployed_at: snapshot.readyAt, status_reason: null })
        .eq("id", websiteId);
    } else if (website?.status === "live") {
      await admin.from("websites").update({ live_url: snapshot.url, last_deployed_at: snapshot.readyAt }).eq("id", websiteId);
    }
  } else if (snapshot.status === "error") {
    await admin
      .from("websites")
      .update({ status_reason: snapshot.error?.message ?? "The last publish did not complete." })
      .eq("id", websiteId);
  }

  return { deploymentId: deployment.id };
}
