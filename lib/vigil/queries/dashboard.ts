import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-side loaders for the client dashboard. All run under RLS as the
 * signed-in user; `organizationId` narrows the query, it does not authorize
 * it. Memoised per request.
 */
export const getOrgWebsites = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
});

export const getOrgProjects = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const getOrgDomains = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "released")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
});

export const getOrgSubscription = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*), price:plan_prices(*)")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export const getRecentDeployments = cache(async (websiteId: string, limit = 5) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deployments")
    .select("id, environment, status, url, created_at, finished_at")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
});

export const getRecentActivity = cache(async (organizationId: string, limit = 8) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, entity_type, entity_id, actor_kind, after, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
});

export const getOrgMembers = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, status, created_at, profile:profiles!organization_members_user_id_fkey(id, full_name, email)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
});

export const getOrgInvites = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, email, role, expires_at, created_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export const getOrgChangeRequests = cache(async (organizationId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_requests")
    .select("id, title, description, status, priority, created_at, submitted_at, website_id, attachments:change_request_attachments(id, file_name, content_type, size_bytes, object_path, bucket_id)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
});

export type SignedAttachment = { id: string; file_name: string; content_type: string; size_bytes: number; url: string | null };

/** Signed, short-lived links for a set of attachment rows the caller can read. */
export async function signAttachments(
  rows: { id: string; file_name: string; content_type: string; size_bytes: number; object_path: string; bucket_id: string }[],
  expiresInSeconds = 60 * 30
): Promise<SignedAttachment[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const byBucket = new Map<string, typeof rows>();
  for (const r of rows) byBucket.set(r.bucket_id, [...(byBucket.get(r.bucket_id) ?? []), r]);
  const urls = new Map<string, string>();
  for (const [bucket, list] of byBucket) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(list.map((r) => r.object_path), expiresInSeconds);
    for (const d of data ?? []) if (d.signedUrl && d.path) urls.set(`${bucket}:${d.path}`, d.signedUrl);
  }
  return rows.map((r) => ({ id: r.id, file_name: r.file_name, content_type: r.content_type, size_bytes: r.size_bytes, url: urls.get(`${r.bucket_id}:${r.object_path}`) ?? null }));
}
