import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError, NotFoundError } from "@/lib/vigil/auth/errors";
import { GitHubRepositoryProvider } from "@/lib/vigil/providers/github";
import { getBillingProvider, getDeploymentProvider } from "@/lib/vigil/providers/registry";
import type { BillingProvider, DeploymentProvider } from "@/lib/vigil/providers/types";
import type { AdminSupabaseClient } from "@/lib/supabase/admin";

const cancellableStatuses = ["incomplete", "trialing", "active", "past_due", "unpaid", "paused"] as const;
const cancellable = new Set<string>(cancellableStatuses);

type RetirementDependencies = {
  admin?: AdminSupabaseClient;
  billing?: BillingProvider;
  deployment?: DeploymentProvider;
  github?: Pick<GitHubRepositoryProvider, "deleteRepository">;
};

type SubscriptionForCancellation = { id: string; status: string };
type SubscriptionLink = { entity_id: string; external_id: string; metadata: unknown };

export async function cancelRemoteSubscriptions(
  subscriptions: SubscriptionForCancellation[],
  links: SubscriptionLink[],
  provider: BillingProvider
) {
  for (const subscription of subscriptions) {
    if (!cancellable.has(subscription.status)) continue;
    const link = links.find((candidate) => candidate.entity_id === subscription.id && (!(candidate.metadata as { mode?: string } | null)?.mode || (candidate.metadata as { mode?: string }).mode === provider.mode));
    if (!link) {
      const hasAnotherMode = links.some((candidate) => candidate.entity_id === subscription.id);
      if (hasAnotherMode) throw new ValidationError(`Subscription ${subscription.id} belongs to a different Stripe mode. Cancel it from the matching environment before archiving.`);
      continue;
    }
    const remote = await provider.getSubscription(link.external_id);
    if (!remote) throw new ValidationError(`Stripe subscription ${link.external_id} could not be verified. The customer was not archived.`);
    if (remote.status !== "canceled") await provider.cancelSubscription(link.external_id, { atPeriodEnd: false });
  }
}

export async function archiveCustomer(organizationId: string, actorId: string, dependencies: RetirementDependencies = {}) {
  const admin = dependencies.admin ?? createAdminClient();
  const { data: org, error } = await admin.from("organizations").select("id, name, archived_at, subscriptions(id, status)").eq("id", organizationId).maybeSingle();
  if (error) throw error;
  if (!org) throw new NotFoundError("Customer not found.");
  if (org.archived_at) return;

  const subscriptions = org.subscriptions ?? [];
  const ids = subscriptions.map((subscription) => subscription.id);
  const { data: links, error: linksError } = ids.length
    ? await admin.from("provider_links").select("entity_id, external_id, metadata").eq("provider", "stripe").eq("resource_kind", "subscription").in("entity_id", ids)
    : { data: [], error: null };
  if (linksError) throw linksError;
  const provider = dependencies.billing ?? getBillingProvider();
  await cancelRemoteSubscriptions(subscriptions, links ?? [], provider);

  const { error: archiveError } = await admin.schema("vigil").rpc("archive_organization", { p_organization_id: organizationId, p_actor_id: actorId });
  if (archiveError) throw archiveError;
}

export async function restoreCustomer(organizationId: string, actorId: string, dependencies: RetirementDependencies = {}) {
  const admin = dependencies.admin ?? createAdminClient();
  const { error } = await admin.schema("vigil").rpc("restore_organization", { p_organization_id: organizationId, p_actor_id: actorId });
  if (error) throw error;
}

export async function permanentlyDeleteCustomer(organizationId: string, actorId: string, dependencies: RetirementDependencies = {}) {
  const admin = dependencies.admin ?? createAdminClient();
  const { data: org, error } = await admin.from("organizations").select("id, name, slug, billing_email, archived_at, projects(id, name, kind), websites(id, name, repository_ref), subscriptions(id, status), organization_members(user_id, role)").eq("id", organizationId).maybeSingle();
  if (error) throw error;
  if (!org) throw new NotFoundError("Customer not found.");
  if (!org.archived_at) throw new ValidationError("Archive this customer before deleting it permanently.");

  const websiteIds = org.websites.map((website) => website.id);
  const { data: links, error: linksError } = websiteIds.length
    ? await admin.from("provider_links").select("provider, resource_kind, external_id, entity_id, metadata").eq("entity_type", "website").in("entity_id", websiteIds)
    : { data: [], error: null };
  if (linksError) throw linksError;

  const deleted = { vercelProjects: [] as string[], githubRepositories: [] as string[], storageObjects: 0 };
  const deployment = dependencies.deployment ?? getDeploymentProvider();
  const github = dependencies.github ?? new GitHubRepositoryProvider();
  if (links?.some((link) => link.provider === "vercel" && link.resource_kind === "site") && deployment.name !== "vercel") {
    throw new ValidationError("Vercel cleanup is not configured. No customer data was deleted.");
  }
  for (const website of org.websites) {
    const site = links?.find((link) => link.entity_id === website.id && link.provider === "vercel" && link.resource_kind === "site");
    if (site) {
      await deployment.deleteSite(site.external_id);
      deleted.vercelProjects.push(site.external_id);
    }
    const repository = links?.find((link) => link.entity_id === website.id && link.resource_kind === "repository");
    const fullName = (repository?.metadata as { full_name?: string } | null)?.full_name ?? (website.repository_ref?.startsWith("github:") ? website.repository_ref.slice("github:".length) : undefined);
    if (fullName) {
      await github.deleteRepository(fullName);
      deleted.githubRepositories.push(fullName);
    }
  }

  for (const [table, pathColumn] of [["project_assets", "object_path"], ["change_request_attachments", "object_path"], ["project_review_attachments", "object_path"]] as const) {
    const { data: assets, error: assetError } = await admin.from(table).select(`bucket_id, ${pathColumn}`).eq("organization_id", organizationId);
    if (assetError) throw assetError;
    const byBucket = new Map<string, string[]>();
    for (const asset of assets ?? []) {
      const row = asset as unknown as { bucket_id: string; object_path: string };
      byBucket.set(row.bucket_id, [...(byBucket.get(row.bucket_id) ?? []), row.object_path]);
    }
    for (const [bucket, paths] of byBucket) {
      const { error: storageError } = await admin.storage.from(bucket).remove(paths);
      if (storageError) throw storageError;
      deleted.storageObjects += paths.length;
    }
  }

  const snapshot = {
    name: org.name,
    slug: org.slug,
    billing_email: org.billing_email,
    projects: org.projects.map(({ id, name, kind }) => ({ id, name, kind })),
    websites: org.websites.map(({ id, name, repository_ref }) => ({ id, name, repository_ref })),
    subscriptions: org.subscriptions.map(({ id, status }) => ({ id, status })),
    members: org.organization_members.map(({ user_id, role }) => ({ user_id, role })),
  };
  const { error: purgeError } = await admin.schema("vigil").rpc("purge_organization", { p_organization_id: organizationId, p_snapshot: snapshot, p_cleanup: deleted, p_deleted_by: actorId });
  if (purgeError) throw purgeError;
  return deleted;
}
