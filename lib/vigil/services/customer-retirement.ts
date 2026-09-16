import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError, NotFoundError } from "@/lib/vigil/auth/errors";
import { GitHubRepositoryProvider } from "@/lib/vigil/providers/github";
import { getBillingProvider, getDeploymentProvider } from "@/lib/vigil/providers/registry";

const cancellableStatuses = ["incomplete", "trialing", "active", "past_due", "unpaid", "paused"] as const;
const cancellable = new Set<string>(cancellableStatuses);

export async function archiveCustomer(organizationId: string, actorId: string) {
  const admin = createAdminClient();
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
  const provider = getBillingProvider();
  for (const subscription of subscriptions) {
    if (!cancellable.has(subscription.status)) continue;
    const link = links?.find((candidate) => candidate.entity_id === subscription.id && (!(candidate.metadata as { mode?: string } | null)?.mode || (candidate.metadata as { mode?: string }).mode === provider.mode));
    if (link) await provider.cancelSubscription(link.external_id, { atPeriodEnd: false });
  }

  const now = new Date().toISOString();
  const updates = await Promise.all([
    admin.from("subscriptions").update({ status: "canceled", canceled_at: now, cancel_at_period_end: false }).eq("organization_id", organizationId).in("status", cancellableStatuses),
    admin.from("websites").update({ status: "archived", status_reason: "Customer archived" }).eq("organization_id", organizationId),
    admin.from("projects").update({ status: "cancelled" }).eq("organization_id", organizationId).in("status", ["draft", "intake", "in_progress", "review", "approved"]),
    admin.from("organizations").update({ status: "closed", archived_at: now }).eq("id", organizationId),
  ]);
  const failed = updates.find((result) => result.error);
  if (failed?.error) throw failed.error;
  await admin.rpc("log_audit_event", { p_action: "organization.archived", p_entity_type: "organization", p_entity_id: organizationId, p_org: organizationId, p_before: null, p_after: { archived_at: now }, p_metadata: {}, p_actor_kind: "staff" });
}

export async function restoreCustomer(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").update({ status: "active", archived_at: null }).eq("id", organizationId).not("archived_at", "is", null).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new ValidationError("This customer is not archived.");
}

export async function permanentlyDeleteCustomer(organizationId: string, actorId: string) {
  const admin = createAdminClient();
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
  const deployment = getDeploymentProvider();
  const github = new GitHubRepositoryProvider();
  for (const website of org.websites) {
    const site = links?.find((link) => link.entity_id === website.id && link.provider === "vercel" && link.resource_kind === "site");
    if (site) {
      await deployment.deleteSite(site.external_id);
      deleted.vercelProjects.push(site.external_id);
    }
    const repository = links?.find((link) => link.entity_id === website.id && link.resource_kind === "repository");
    const fullName = (repository?.metadata as { full_name?: string } | null)?.full_name ?? website.repository_ref?.replace(/^github:/, "");
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
