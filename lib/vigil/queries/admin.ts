import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Read-side loaders for the admin console. Staff RLS grants cross-tenant reads. */

export const adminCounts = cache(async () => {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const results = await Promise.all([
    supabase.from("organizations").select("*", head),
    supabase.from("websites").select("*", head),
    supabase.from("websites").select("*", head).eq("status", "live"),
    supabase.from("domains").select("*", head).in("status", ["pending", "verifying", "error", "expired"]),
    supabase.from("subscriptions").select("*", head).in("status", ["past_due", "unpaid"]),
    supabase.from("change_requests").select("*", head).in("status", ["submitted", "triaged", "in_progress"]),
    supabase.from("provisioning_jobs").select("*", head).eq("status", "failed"),
    supabase.from("provisioning_jobs").select("*", head).eq("status", "queued"),
  ]);
  const n = (i: number) => (results[i].error ? 0 : results[i].count ?? 0);
  return {
    organizations: n(0),
    websites: n(1),
    live: n(2),
    domainsPending: n(3),
    subsPastDue: n(4),
    requestsOpen: n(5),
    jobsFailed: n(6),
    jobsQueued: n(7),
  };
});

export const listOrganizations = cache(async (search?: string) => {
  const supabase = await createClient();
  let q = supabase
    .from("organizations")
    .select("id, slug, name, status, billing_email, created_at, websites(id, status), subscriptions(id, status, plan:plans(code, name))")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search) q = q.ilike("name", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data;
});

export const getOrganizationDetail = cache(async (orgId: string) => {
  const supabase = await createClient();
  const [org, members, invites, websites, domains, subscriptions, projects, overrides, audit, jobs, orders] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    supabase
      .from("organization_members")
      .select("user_id, role, status, created_at, profile:profiles!organization_members_user_id_fkey(full_name, email)")
      .eq("organization_id", orgId),
    supabase.from("organization_invites").select("id, email, role, expires_at, accepted_at, revoked_at").eq("organization_id", orgId).order("created_at", { ascending: false }),
    supabase.from("websites").select("*").eq("organization_id", orgId).order("created_at"),
    supabase.from("domains").select("*").eq("organization_id", orgId).order("created_at"),
    supabase.from("subscriptions").select("*, plan:plans(code, name), price:plan_prices(amount_cents, currency, interval, interval_count)").eq("organization_id", orgId).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }),
    supabase.from("entitlement_overrides").select("*").eq("organization_id", orgId),
    supabase.from("audit_events").select("id, action, actor_kind, entity_type, entity_id, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(20),
    supabase.from("provisioning_jobs").select("id, kind, status, attempts, max_attempts, scheduled_for, error, updated_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(20),
    supabase.from("orders").select("id, status, project_kind, template_slug, build_amount_cents, plan_amount_cents, currency, email, checkout_token, paid_at, provisioned_at, created_at, plan:plans(code, name), price:plan_prices(interval, interval_count)").eq("organization_id", orgId).order("created_at", { ascending: false }),
  ]);
  for (const r of [org, members, invites, websites, domains, subscriptions, projects, overrides, audit, jobs, orders]) if (r.error) throw r.error;
  if (!org.data) return null;
  return {
    organization: org.data,
    members: members.data ?? [],
    invites: invites.data ?? [],
    websites: websites.data ?? [],
    domains: domains.data ?? [],
    subscriptions: subscriptions.data ?? [],
    projects: projects.data ?? [],
    overrides: overrides.data ?? [],
    audit: audit.data ?? [],
    jobs: jobs.data ?? [],
    orders: orders.data ?? [],
  };
});

export const listWebsites = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .select("id, name, status, live_url, template_slug, last_deployed_at, updated_at, organization:organizations(id, name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
});

export const getWebsiteDetail = cache(async (websiteId: string) => {
  const supabase = await createClient();
  const [site, deployments, domains, links, jobs] = await Promise.all([
    supabase.from("websites").select("*, organization:organizations(id, name), project:projects(id, name, kind, status)").eq("id", websiteId).maybeSingle(),
    supabase.from("deployments").select("*").eq("website_id", websiteId).order("created_at", { ascending: false }).limit(20),
    supabase.from("domains").select("*").eq("website_id", websiteId),
    supabase.from("provider_links").select("provider, resource_kind, external_id, metadata, created_at").eq("entity_type", "website").eq("entity_id", websiteId),
    supabase.from("provisioning_jobs").select("id, kind, status, attempts, max_attempts, error, scheduled_for, updated_at").eq("website_id", websiteId).order("created_at", { ascending: false }).limit(20),
  ]);
  for (const r of [site, deployments, domains, links, jobs]) if (r.error) throw r.error;
  if (!site.data) return null;
  return { website: site.data, deployments: deployments.data ?? [], domains: domains.data ?? [], links: links.data ?? [], jobs: jobs.data ?? [] };
});

export const listDomains = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("id, hostname, status, source, registrar, metadata, dns_ok, ssl_ok, expires_at, last_checked_at, status_reason, organization:organizations(id, name), website:websites!domains_website_id_fkey(id, name)")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data;
});

export const listSubscriptions = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, cancel_at_period_end, created_at, organization:organizations(id, name), plan:plans(code, name), price:plan_prices(amount_cents, currency, interval, interval_count)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data;
});

export const listChangeRequests = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_requests")
    .select("id, title, description, status, priority, submitted_at, created_at, organization:organizations(id, name), website:websites(id, name), requester:profiles!change_requests_requested_by_fkey(full_name, email), attachments:change_request_attachments(id, file_name, content_type, size_bytes, object_path, bucket_id)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data;
});

export const listJobs = cache(async (status?: string) => {
  const supabase = await createClient();
  let q = supabase
    .from("provisioning_jobs")
    .select("id, kind, status, attempts, max_attempts, scheduled_for, locked_by, error, result, created_at, updated_at, organization:organizations(id, name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status as "queued" | "running" | "succeeded" | "failed" | "canceled");
  const { data, error } = await q;
  if (error) throw error;
  return data;
});

export const listAudit = cache(async (orgId?: string) => {
  const supabase = await createClient();
  let q = supabase
    .from("audit_events")
    .select("id, action, actor_kind, entity_type, entity_id, before, after, created_at, organization:organizations(id, name), actor:profiles!audit_events_actor_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
});

export const getCatalog = cache(async () => {
  const supabase = await createClient();
  const [plans, prices, features, planFeatures, builds, links] = await Promise.all([
    supabase.from("plans").select("*").order("tier_rank"),
    supabase.from("plan_prices").select("*"),
    supabase.from("features").select("*").order("code"),
    supabase.from("plan_features").select("*"),
    supabase.from("build_prices").select("*").order("kind"),
    supabase.from("provider_links").select("provider, resource_kind, external_id, entity_type, entity_id, metadata").eq("resource_kind", "price"),
  ]);
  for (const r of [plans, prices, features, planFeatures, builds, links]) if (r.error) throw r.error;
  return {
    plans: plans.data ?? [],
    prices: prices.data ?? [],
    features: features.data ?? [],
    planFeatures: planFeatures.data ?? [],
    builds: builds.data ?? [],
    priceLinks: links.data ?? [],
  };
});

/** Job counts by status for the distribution widget. */
export const jobStatusCounts = cache(async () => {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const statuses = ["queued", "running", "succeeded", "failed", "canceled"] as const;
  const results = await Promise.all(statuses.map((s) => supabase.from("provisioning_jobs").select("*", head).eq("status", s)));
  return Object.fromEntries(statuses.map((s, i) => [s, results[i].error ? 0 : results[i].count ?? 0])) as Record<(typeof statuses)[number], number>;
});

/** Everything a human should look at, across tenants. Bounded lists; newest first. */
export const attentionItems = cache(async () => {
  const supabase = await createClient();
  const [jobs, domains, websites, subs, requests] = await Promise.all([
    supabase.from("provisioning_jobs").select("id, kind, error, updated_at, organization:organizations(id, name)").eq("status", "failed").order("updated_at", { ascending: false }).limit(10),
    supabase.from("domains").select("id, hostname, status, status_reason, updated_at, organization:organizations(id, name)").in("status", ["error", "expired"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("websites").select("id, name, status, status_reason, updated_at, organization:organizations(id, name)").in("status", ["error", "suspended"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("subscriptions").select("id, status, updated_at, organization:organizations(id, name), plan:plans(name)").in("status", ["past_due", "unpaid", "incomplete"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("change_requests").select("id, title, status, submitted_at, organization:organizations(id, name)").eq("status", "submitted").order("submitted_at", { ascending: true }).limit(10),
  ]);
  for (const r of [jobs, domains, websites, subs, requests]) if (r.error) throw r.error;
  return { jobs: jobs.data ?? [], domains: domains.data ?? [], websites: websites.data ?? [], subscriptions: subs.data ?? [], requests: requests.data ?? [] };
});

/** Unresolved workflow state used by the admin navigation attention dots. */
export const adminNavAttention = cache(async () => {
  const supabase = await createClient();
  const count = { count: "exact" as const, head: true };
  const [orders, customers, websites, domains, subscriptions, requests, jobs] = await Promise.all([
    supabase.from("orders").select("id", count).in("status", ["paid", "failed"]),
    supabase.from("projects").select("id", count).not("intake_completed_at", "is", null).eq("status", "in_progress"),
    supabase.from("websites").select("id", count).in("status", ["error", "suspended"]),
    supabase.from("domains").select("id", count).in("status", ["pending", "verifying", "error", "expired"]),
    supabase.from("subscriptions").select("id", count).in("status", ["past_due", "unpaid", "incomplete"]),
    supabase.from("change_requests").select("id", count).eq("status", "submitted"),
    supabase.from("provisioning_jobs").select("id", count).eq("status", "failed"),
  ]);
  for (const result of [orders, customers, websites, domains, subscriptions, requests, jobs]) if (result.error) throw result.error;
  return {
    orders: Boolean(orders.count),
    customers: Boolean(customers.count),
    websites: Boolean(websites.count),
    domains: Boolean(domains.count),
    subscriptions: Boolean(subscriptions.count),
    requests: Boolean(requests.count),
    jobs: Boolean(jobs.count),
  };
});
