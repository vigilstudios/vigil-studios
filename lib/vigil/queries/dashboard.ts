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
    .select("id, title, status, priority, created_at, submitted_at, website_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
});
