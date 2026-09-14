"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, NotFoundError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { normalizeEmail } from "@/lib/vigil/auth/redirects";
import { ACTIVE_ORG_COOKIE, requireAdminOrThrow, requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { enqueueJob, JOB_KINDS, runDueJobs } from "@/lib/vigil/jobs";
import {
  assertTransition,
  changeRequestTransitions,
  domainTransitions,
  projectTransitions,
  subscriptionTransitions,
  websiteTransitions,
} from "@/lib/vigil/lifecycle";
import { normalizeHostname } from "@/lib/vigil/services/domain";
import { slugify } from "@/lib/vigil/format";
import type { ChangeRequestStatus, DomainStatus, ProjectStatus, SubscriptionStatus, Updates, WebsiteStatus } from "@/lib/vigil/types";
import { Constants } from "@/types/database.types";

/**
 * Staff operations. Every action re-verifies staff (or admin) membership,
 * validates input, and writes under the caller's RLS grants, so the
 * database — not this file — is the last line of defence.
 */

const minuteBucket = () => Math.floor(Date.now() / 60_000).toString(36);

function issuesOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) (out[issue.path.join(".") || "_"] ??= []).push(issue.message);
  return out;
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------
const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  slug: z.string().trim().max(63).optional().or(z.literal("")),
  owner_email: z.string().trim().email("Enter the owner's email.").optional().or(z.literal("")),
  billing_email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
});

export type CreateOrgState = ActionResult<{ id: string }> | null;

export async function createOrganization(_prev: CreateOrgState, formData: FormData): Promise<CreateOrgState> {
  try {
    const staff = await requireStaffOrThrow();
    const parsed = createOrgSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));
    const v = parsed.data;
    const slug = slugify(v.slug || v.name);
    if (!slug) throw new ValidationError("Could not derive a slug from that name.", { slug: ["Invalid"] });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: v.name, slug, billing_email: v.billing_email ? normalizeEmail(v.billing_email) : null, created_by: staff.user.id })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new ValidationError("That slug is already taken.", { slug: ["Already in use"] });
      throw error;
    }

    await logAuditEvent(supabase, { action: "organization.created", entityType: "organization", entityId: data.id, organizationId: data.id, after: { name: v.name, slug } });

    if (v.owner_email) {
      const email = normalizeEmail(v.owner_email);
      const { error: inviteError } = await supabase
        .from("organization_invites")
        .insert({ organization_id: data.id, email, role: "owner", invited_by: staff.user.id });
      if (inviteError) throw inviteError;
      await logAuditEvent(supabase, { action: "member.invited", entityType: "organization_invite", organizationId: data.id, after: { email, role: "owner" } });
    }

    revalidatePath("/admin/organizations");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setOrganizationStatus(orgId: string, status: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    if (!(Constants.public.Enums.organization_status as readonly string[]).includes(status)) throw new ValidationError("Unknown status.");
    const supabase = await createClient();
    const { error } = await supabase.from("organizations").update({ status: status as "active" | "suspended" | "offboarding" | "closed" }).eq("id", orgId);
    if (error) throw error;
    revalidatePath(`/admin/organizations/${orgId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function inviteToOrganization(orgId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaffOrThrow();
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const role = String(formData.get("role") ?? "member");
    if (!z.string().email().safeParse(email).success) throw new ValidationError("Enter a valid email.", { email: ["Invalid"] });
    if (!["owner", "manager", "member"].includes(role)) throw new ValidationError("Unknown role.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("organization_invites")
      .insert({ organization_id: orgId, email, role: role as "owner" | "manager" | "member", invited_by: staff.user.id });
    if (error) throw error;
    await logAuditEvent(supabase, { action: "member.invited", entityType: "organization_invite", organizationId: orgId, after: { email, role } });
    revalidatePath(`/admin/organizations/${orgId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

/** Open a customer's dashboard as staff (RLS still governs every read). */
export async function viewAsOrganization(orgId: string): Promise<void> {
  await requireStaffOrThrow();
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Projects and websites
// ---------------------------------------------------------------------------
const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["express", "professional", "custom"]),
  template_slug: z.string().trim().max(80).optional().or(z.literal("")),
  create_website: z.string().optional(),
});

export async function createProject(orgId: string, formData: FormData): Promise<ActionResult> {
  try {
    const staff = await requireStaffOrThrow();
    const parsed = createProjectSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));
    const v = parsed.data;
    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ organization_id: orgId, name: v.name, kind: v.kind, template_slug: v.template_slug || null, created_by: staff.user.id })
      .select("id")
      .single();
    if (error) throw error;
    await logAuditEvent(supabase, { action: "project.created", entityType: "project", entityId: project.id, organizationId: orgId, after: { name: v.name, kind: v.kind } });

    if (v.create_website === "on") {
      const { data: site, error: siteError } = await supabase
        .from("websites")
        .insert({ organization_id: orgId, project_id: project.id, name: v.name, template_slug: v.template_slug || null })
        .select("id")
        .single();
      if (siteError) throw siteError;
      await logAuditEvent(supabase, { action: "website.created", entityType: "website", entityId: site.id, organizationId: orgId });
    }

    revalidatePath(`/admin/organizations/${orgId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setProjectStatus(projectId: string, next: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: project, error } = await supabase.from("projects").select("id, organization_id, status").eq("id", projectId).maybeSingle();
    if (error) throw error;
    if (!project) throw new NotFoundError();
    assertTransition(projectTransitions, project.status, next as ProjectStatus, "project");
    const patch: Updates<"projects"> = { status: next as ProjectStatus };
    if (next === "launched") patch.launched_at = new Date().toISOString();
    if (next === "closed" || next === "cancelled") patch.closed_at = new Date().toISOString();
    const { error: updateError } = await supabase.from("projects").update(patch).eq("id", projectId);
    if (updateError) throw updateError;
    revalidatePath(`/admin/organizations/${project.organization_id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setWebsiteStatus(websiteId: string, next: string, reason?: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: site, error } = await supabase.from("websites").select("id, organization_id, status").eq("id", websiteId).maybeSingle();
    if (error) throw error;
    if (!site) throw new NotFoundError();
    assertTransition(websiteTransitions, site.status, next as WebsiteStatus, "website");
    const { error: updateError } = await supabase
      .from("websites")
      .update({ status: next as WebsiteStatus, status_reason: reason?.trim() || null })
      .eq("id", websiteId);
    if (updateError) throw updateError;
    revalidatePath(`/admin/websites/${websiteId}`);
    revalidatePath(`/admin/organizations/${site.organization_id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateWebsiteFields(websiteId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const schema = z.object({
      name: z.string().trim().min(1).max(120),
      live_url: z.string().trim().url().optional().or(z.literal("")),
      preview_url: z.string().trim().url().optional().or(z.literal("")),
      template_slug: z.string().trim().max(80).optional().or(z.literal("")),
      hosting_mode: z.string().trim().max(40).optional().or(z.literal("")),
      repository_ref: z.string().trim().max(200).optional().or(z.literal("")),
      code_ownership: z.enum(["customer_owned", "vigil_owned"]),
      export_eligible: z.string().optional(),
    });
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));
    const v = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase
      .from("websites")
      .update({
        name: v.name,
        live_url: v.live_url || null,
        preview_url: v.preview_url || null,
        template_slug: v.template_slug || null,
        hosting_mode: v.hosting_mode || null,
        repository_ref: v.repository_ref || null,
        code_ownership: v.code_ownership,
        export_eligible: v.export_eligible === "on",
      })
      .eq("id", websiteId);
    if (error) throw error;
    revalidatePath(`/admin/websites/${websiteId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function enqueueWebsiteJob(websiteId: string, kind: "website.provision" | "website.deploy"): Promise<ActionResult<{ jobId: string }>> {
  try {
    const staff = await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: site, error } = await supabase.from("websites").select("id, organization_id").eq("id", websiteId).maybeSingle();
    if (error) throw error;
    if (!site) throw new NotFoundError();
    // Provisioning is once per site; a deploy can be re-queued, but a double
    // click inside the same minute collapses into one job.
    const key = kind === JOB_KINDS.websiteProvision ? `website.provision:${websiteId}` : `website.deploy:${websiteId}:${minuteBucket()}`;
    const job = await enqueueJob(supabase, { kind, idempotencyKey: key, organizationId: site.organization_id, websiteId, createdBy: staff.user.id });
    revalidatePath(`/admin/websites/${websiteId}`);
    revalidatePath("/admin/jobs");
    return { ok: true, data: { jobId: job.id } };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------
export async function addDomainForOrganization(orgId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const hostname = normalizeHostname(String(formData.get("hostname") ?? ""));
    if (!hostname) throw new ValidationError("Enter a valid hostname.", { hostname: ["Invalid"] });
    const websiteId = String(formData.get("website_id") ?? "") || null;
    const source = String(formData.get("source") ?? "customer_owned");
    if (!["customer_owned", "purchased_via_vigil", "vigil_managed"].includes(source)) throw new ValidationError("Unknown source.");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("domains")
      .insert({ organization_id: orgId, website_id: websiteId, hostname, kind: hostname.split(".").length > 2 ? "subdomain" : "apex", source: source as "customer_owned" | "purchased_via_vigil" | "vigil_managed" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new ValidationError("That hostname already exists.", { hostname: ["Already in use"] });
      throw error;
    }
    await logAuditEvent(supabase, { action: "domain.added", entityType: "domain", entityId: data.id, organizationId: orgId, after: { hostname, source } });
    revalidatePath(`/admin/organizations/${orgId}`);
    revalidatePath("/admin/domains");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

/** Attach a domain to one of its organization's websites (or detach with ""). */
export async function attachDomainToWebsite(domainId: string, websiteId: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: domain, error } = await supabase.from("domains").select("id, organization_id, website_id").eq("id", domainId).maybeSingle();
    if (error) throw error;
    if (!domain) throw new NotFoundError();
    const { error: updateError } = await supabase
      .from("domains")
      .update({ website_id: websiteId || null })
      .eq("id", domainId);
    if (updateError) throw updateError; // the same-organization trigger refuses a foreign website
    await logAuditEvent(supabase, {
      action: "domain.attached",
      entityType: "domain",
      entityId: domainId,
      organizationId: domain.organization_id,
      before: { website_id: domain.website_id },
      after: { website_id: websiteId || null },
    });
    revalidatePath(`/admin/organizations/${domain.organization_id}`);
    revalidatePath("/admin/domains");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setDomainStatus(domainId: string, next: string, reason?: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: domain, error } = await supabase.from("domains").select("id, status, organization_id").eq("id", domainId).maybeSingle();
    if (error) throw error;
    if (!domain) throw new NotFoundError();
    assertTransition(domainTransitions, domain.status, next as DomainStatus, "domain");
    const now = new Date().toISOString();
    const patch: Updates<"domains"> = { status: next as DomainStatus, status_reason: reason?.trim() || null };
    if (next === "connected") Object.assign(patch, { dns_ok: true, ssl_ok: true, verified_at: now, connected_at: now, last_checked_at: now });
    const { error: updateError } = await supabase.from("domains").update(patch).eq("id", domainId);
    if (updateError) throw updateError;
    revalidatePath("/admin/domains");
    revalidatePath(`/admin/organizations/${domain.organization_id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function enqueueDomainJob(domainId: string, kind: "domain.connect" | "domain.verify"): Promise<ActionResult> {
  try {
    const staff = await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: domain, error } = await supabase.from("domains").select("id, organization_id, website_id").eq("id", domainId).maybeSingle();
    if (error) throw error;
    if (!domain) throw new NotFoundError();
    await enqueueJob(supabase, {
      kind,
      idempotencyKey: `${kind}:${domainId}:${minuteBucket()}`,
      organizationId: domain.organization_id,
      websiteId: domain.website_id,
      domainId,
      createdBy: staff.user.id,
    });
    revalidatePath("/admin/domains");
    revalidatePath("/admin/jobs");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Subscriptions and entitlements
// ---------------------------------------------------------------------------
export async function createSubscription(orgId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const planId = String(formData.get("plan_id") ?? "");
    const status = String(formData.get("status") ?? "active");
    const websiteId = String(formData.get("website_id") ?? "") || null;
    if (!z.string().uuid().safeParse(planId).success) throw new ValidationError("Choose a plan.", { plan_id: ["Required"] });
    if (!(Constants.public.Enums.subscription_status as readonly string[]).includes(status)) throw new ValidationError("Unknown status.");
    const supabase = await createClient();
    const { data: price } = await supabase.from("plan_prices").select("id").eq("plan_id", planId).eq("is_active", true).limit(1).maybeSingle();
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({ organization_id: orgId, website_id: websiteId, plan_id: planId, plan_price_id: price?.id ?? null, status: status as SubscriptionStatus, current_period_start: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw error;
    await logAuditEvent(supabase, { action: "subscription.created", entityType: "subscription", entityId: data.id, organizationId: orgId, after: { plan_id: planId, status } });
    revalidatePath(`/admin/organizations/${orgId}`);
    revalidatePath("/admin/subscriptions");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setSubscriptionStatus(subscriptionId: string, next: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: sub, error } = await supabase.from("subscriptions").select("id, status, organization_id").eq("id", subscriptionId).maybeSingle();
    if (error) throw error;
    if (!sub) throw new NotFoundError();
    assertTransition(subscriptionTransitions, sub.status, next as SubscriptionStatus, "subscription");
    const patch: Updates<"subscriptions"> = { status: next as SubscriptionStatus };
    if (next === "canceled") patch.canceled_at = new Date().toISOString();
    const { error: updateError } = await supabase.from("subscriptions").update(patch).eq("id", subscriptionId);
    if (updateError) throw updateError;
    revalidatePath("/admin/subscriptions");
    revalidatePath(`/admin/organizations/${sub.organization_id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setEntitlementOverride(orgId: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    const featureCode = String(formData.get("feature_code") ?? "");
    const raw = String(formData.get("value") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim() || null;
    if (!featureCode) throw new ValidationError("Choose a feature.");
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new ValidationError("Value must be JSON: true, false, a number, or \"text\".", { value: ["Invalid JSON"] });
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("entitlement_overrides")
      .upsert({ organization_id: orgId, feature_code: featureCode, value: value as never, reason, granted_by: admin.user.id }, { onConflict: "organization_id,feature_code" });
    if (error) throw error;
    await logAuditEvent(supabase, { action: "entitlement.override_set", entityType: "organization", entityId: orgId, organizationId: orgId, after: { feature_code: featureCode, value: value as never, reason } });
    revalidatePath(`/admin/organizations/${orgId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeEntitlementOverride(orgId: string, featureCode: string): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();
    const supabase = await createClient();
    const { error } = await supabase.from("entitlement_overrides").delete().eq("organization_id", orgId).eq("feature_code", featureCode);
    if (error) throw error;
    await logAuditEvent(supabase, { action: "entitlement.override_removed", entityType: "organization", entityId: orgId, organizationId: orgId, after: { feature_code: featureCode } });
    revalidatePath(`/admin/organizations/${orgId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
export async function setChangeRequestStatus(requestId: string, next: string): Promise<ActionResult> {
  try {
    const staff = await requireStaffOrThrow();
    const supabase = await createClient();
    const { data: req, error } = await supabase.from("change_requests").select("id, status, organization_id").eq("id", requestId).maybeSingle();
    if (error) throw error;
    if (!req) throw new NotFoundError();
    assertTransition(changeRequestTransitions, req.status, next as ChangeRequestStatus, "change request");
    const patch: Updates<"change_requests"> = { status: next as ChangeRequestStatus };
    if (next === "triaged" || next === "in_progress") patch.assigned_to = staff.user.id;
    if (next === "delivered") patch.delivered_at = new Date().toISOString();
    if (next === "closed" || next === "declined") patch.closed_at = new Date().toISOString();
    const { error: updateError } = await supabase.from("change_requests").update(patch).eq("id", requestId);
    if (updateError) throw updateError;
    revalidatePath("/admin/requests");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
export async function retryJob(jobId: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { error } = await supabase
      .from("provisioning_jobs")
      .update({ status: "queued", scheduled_for: new Date().toISOString(), locked_by: null, locked_at: null, finished_at: null })
      .eq("id", jobId)
      .in("status", ["failed", "canceled"]);
    if (error) throw error;
    revalidatePath("/admin/jobs");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function cancelJob(jobId: string): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const supabase = await createClient();
    const { error } = await supabase
      .from("provisioning_jobs")
      .update({ status: "canceled", finished_at: new Date().toISOString(), locked_by: null, locked_at: null })
      .eq("id", jobId)
      .in("status", ["queued", "failed"]);
    if (error) throw error;
    revalidatePath("/admin/jobs");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

/** Drain the queue from the console. Uses the service role when present so system rows are attributed correctly. */
export async function runJobsNow(): Promise<ActionResult<{ ran: number; failed: number }>> {
  try {
    const staff = await requireStaffOrThrow();
    const client = hasAdminClient() ? createAdminClient() : await createClient();
    const outcomes = await runDueJobs(client, { worker: `console:${staff.user.id.slice(0, 8)}`, limit: 20 });
    revalidatePath("/admin/jobs");
    return { ok: true, data: { ran: outcomes.length, failed: outcomes.filter((o) => o.status === "failed").length } };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Catalog (admin only)
// ---------------------------------------------------------------------------
export async function updatePlan(planId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();
    const schema = z.object({
      name: z.string().trim().min(1).max(80),
      tagline: z.string().trim().max(160).optional().or(z.literal("")),
      description: z.string().trim().max(2000).optional().or(z.literal("")),
      is_active: z.string().optional(),
      is_public: z.string().optional(),
      amount_cents: z.string().trim().optional().or(z.literal("")),
    });
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new ValidationError("Check the highlighted fields.", issuesOf(parsed.error));
    const v = parsed.data;
    const supabase = await createClient();
    const { error } = await supabase
      .from("plans")
      .update({ name: v.name, tagline: v.tagline || null, description: v.description || null, is_active: v.is_active === "on", is_public: v.is_public === "on" })
      .eq("id", planId);
    if (error) throw error;

    // Monthly USD price; empty means "not approved yet" and stays NULL.
    const cents = v.amount_cents ? Math.round(Number(v.amount_cents) * 100) : null;
    if (v.amount_cents && (!Number.isFinite(cents) || (cents as number) < 0)) throw new ValidationError("Price must be a number.", { amount_cents: ["Invalid"] });
    const { error: priceError } = await supabase
      .from("plan_prices")
      .upsert({ plan_id: planId, currency: "usd", interval: "month", amount_cents: cents }, { onConflict: "plan_id,currency,interval" });
    if (priceError) throw priceError;

    await logAuditEvent(supabase, { action: "plan.updated", entityType: "plan", entityId: planId, after: { name: v.name, amount_cents: cents, is_public: v.is_public === "on" } });
    revalidatePath("/admin/plans");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPlanFeature(planId: string, featureCode: string, raw: string): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();
    const trimmed = raw.trim();
    const supabase = await createClient();
    if (trimmed === "") {
      const { error } = await supabase.from("plan_features").delete().eq("plan_id", planId).eq("feature_code", featureCode);
      if (error) throw error;
    } else {
      let value: unknown;
      try {
        value = JSON.parse(trimmed);
      } catch {
        throw new ValidationError("Value must be JSON: true, false, a number, or \"text\".");
      }
      const { error } = await supabase
        .from("plan_features")
        .upsert({ plan_id: planId, feature_code: featureCode, value: value as never }, { onConflict: "plan_id,feature_code" });
      if (error) throw error;
    }
    await logAuditEvent(supabase, { action: "plan.feature_set", entityType: "plan", entityId: planId, after: { feature_code: featureCode, value: trimmed } });
    revalidatePath("/admin/plans");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function grantStaff(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const role = String(formData.get("role") ?? "staff");
    if (!["staff", "admin"].includes(role)) throw new ValidationError("Unknown role.");
    const supabase = await createClient();
    const { data: profile, error } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (error) throw error;
    if (!profile) throw new NotFoundError("No account with that email has signed in yet. Ask them to sign in first.");
    const { error: upsertError } = await supabase
      .from("staff_members")
      .upsert({ user_id: profile.id, role: role as "staff" | "admin", granted_by: admin.user.id }, { onConflict: "user_id" });
    if (upsertError) throw upsertError;
    await logAuditEvent(supabase, { action: "staff.granted", entityType: "profile", entityId: profile.id, after: { email, role } });
    revalidatePath("/admin/plans");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revokeStaff(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();
    if (userId === admin.user.id) throw new ForbiddenError("You cannot remove your own admin access.");
    const supabase = await createClient();
    const { error } = await supabase.from("staff_members").delete().eq("user_id", userId);
    if (error) throw error;
    await logAuditEvent(supabase, { action: "staff.revoked", entityType: "profile", entityId: userId });
    revalidatePath("/admin/plans");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
