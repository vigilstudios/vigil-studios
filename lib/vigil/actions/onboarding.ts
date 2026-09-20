"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, NotFoundError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { assertOrgRole, requireOrgContextOrThrow, type OrgContext } from "@/lib/vigil/auth/session";
import { button, escapeHtml, layout, sendEmail, staffNotificationAddress } from "@/lib/vigil/email";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
import { assertTransition, domainTransitions } from "@/lib/vigil/lifecycle";
import { REGISTRAR_GUIDES } from "@/lib/vigil/domain-guides";
import { domainKind } from "@/lib/vigil/domains";
import { domainSchema, parseBrief, SECTION_SCHEMAS, STEP_KEYS, type Brief, type RegistrarKey, type SectionKey, type StepKey } from "@/lib/vigil/onboarding/brief";
import { PROJECT_ASSETS_BUCKET, validateAssets, type AssetKind } from "@/lib/vigil/onboarding/assets";
import { resolveEntitlements } from "@/lib/vigil/entitlements";
import { fileLimitsFor, recordUploadedFiles } from "@/lib/vigil/services/project-files";
import { detectRegistrar, requiredRecords, type DnsRecord } from "@/lib/vigil/services/dns";
import { beginDomainVerification, normalizeHostname, verifyDomain } from "@/lib/vigil/services/domain";
import type { Json } from "@/types/database.types";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/vigil/rate-limit";

/**
 * The guided onboarding writes to exactly two things the customer owns:
 * `projects.brief` / `intake_completed_at` (RLS lets members update those
 * columns and nothing else on projects) and `project_assets`. The domain
 * pieces reuse the Flow B services with the service-role client after the
 * membership check, because customers may not update `domains`.
 */

async function loadProject(ctx: OrgContext, projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("id, organization_id, status, brief, intake_completed_at, name, kind").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!data || data.organization_id !== ctx.organization.id) throw new NotFoundError("That project is not in your workspace.");
  return { supabase, project: data, brief: parseBrief(data.brief) };
}

async function writeBrief(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, brief: Brief): Promise<void> {
  const { error } = await supabase.from("projects").update({ brief: brief as unknown as Json }).eq("id", projectId);
  if (error) throw error;
}

function withProgress(brief: Brief, step: StepKey, completed?: boolean): Brief {
  const done = new Set(brief.progress.completed);
  if (completed) done.add(step);
  return { ...brief, progress: { lastStep: step, completed: STEP_KEYS.filter((k) => done.has(k)) } };
}

const STEP_EMAIL_LABELS: Record<SectionKey, string> = {
  basics: "Business basics",
  kickoff: "How we'll begin",
  strategy: "Site goals and scope",
  offerings: "What you offer",
  about: "About you",
  brand: "Brand and photos",
  domain: "Domain",
};

async function notifyStaffOfCompletedStep(ctx: OrgContext, project: { id: string; name: string; kind: string }, section: SectionKey): Promise<void> {
  const label = STEP_EMAIL_LABELS[section];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co";
  const adminUrl = `${appUrl}/admin/organizations/${ctx.organization.id}`;
  const subject = `Onboarding step completed: ${label} · ${ctx.organization.name}`;
  await sendEmail({
    to: staffNotificationAddress(),
    subject,
    text: `${ctx.organization.name} completed “${label}” for the ${project.kind} project “${project.name}”.\n\nReview progress: ${adminUrl}`,
    html: layout(subject, `<p><b>${escapeHtml(ctx.organization.name)}</b> completed <b>${escapeHtml(label)}</b> for the ${escapeHtml(project.kind)} project “${escapeHtml(project.name)}”.</p>${button(adminUrl, "Review onboarding progress")}`),
  });
}

/** Autosave one section. Called on every change (debounced client-side). */
export async function saveBriefSection(projectId: string, section: SectionKey, data: unknown, completed = false): Promise<ActionResult<{ brief: Brief }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await enforceRateLimit(`autosave:user:${ctx.user.id}`, RATE_LIMITS.autosaveUser);
    const { supabase, project, brief } = await loadProject(ctx, projectId);
    if (project.intake_completed_at) throw new ForbiddenError("This brief has already been sent to Vigil. Use Requests to change something.");
    const schema = SECTION_SCHEMAS[section];
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (issues[i.path.join(".") || "_"] ??= []).push(i.message);
      throw new ValidationError("Check the highlighted fields.", issues);
    }
    // The domain step's `domainId` names a `domains` row that only the server
    // creates (startOnboardingDomain). The client echoes it back on autosave,
    // so it must be the row already on the brief or one this organization
    // can read; anything else is dropped rather than carried into submitIntake.
    if (section === "domain") {
      const domainData = parsed.data as z.infer<typeof domainSchema>;
      if (domainData.domainId && domainData.domainId !== brief.domain?.domainId) {
        const { data: owned } = await supabase.from("domains").select("id").eq("id", domainData.domainId).eq("organization_id", ctx.organization.id).maybeSingle();
        if (!owned) domainData.domainId = null;
      }
    }
    const newlyCompleted = completed && !brief.progress.completed.includes(section);
    const next = withProgress({ ...brief, [section]: parsed.data }, section, completed);
    await writeBrief(supabase, projectId, next);
    if (newlyCompleted) {
      await logAuditEvent(supabase, {
        action: "project.onboarding_step_completed",
        entityType: "project",
        entityId: projectId,
        organizationId: ctx.organization.id,
        after: { step: section, label: STEP_EMAIL_LABELS[section] },
      }).catch(() => undefined);
      await notifyStaffOfCompletedStep(ctx, project, section).catch((error) => {
        console.error("onboarding step notification failed:", error);
      });
      revalidatePath(`/admin/organizations/${ctx.organization.id}`);
    }
    return { ok: true, data: { brief: next } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Remember where the customer is (welcome → basics, review), without changing content. */
export async function markStep(projectId: string, step: StepKey, completed = false): Promise<ActionResult<{ brief: Brief }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const { supabase, project, brief } = await loadProject(ctx, projectId);
    if (project.intake_completed_at) return { ok: true, data: { brief } };
    const next = withProgress(brief, step, completed);
    await writeBrief(supabase, projectId, next);
    return { ok: true, data: { brief: next } };
  } catch (error) {
    return toActionError(error);
  }
}

export type UploadedAsset = { path: string; name: string; type: string; size: number; caption?: string | null; checksum?: string | null };

/**
 * Record files the browser uploaded straight to the project-assets bucket
 * from the wizard. Same path as the Files page: the organization's limits
 * apply and staff hear about the batch.
 */
export async function recordProjectAssets(projectId: string, kind: AssetKind, uploaded: UploadedAsset[]): Promise<ActionResult<{ recorded: { id: string; path: string }[]; failed: string[] }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const { supabase, project } = await loadProject(ctx, projectId);
    const problems = validateAssets(uploaded, kind);
    const bad = new Set(problems.map((p) => p.name));
    const accepted = uploaded.filter((f) => !bad.has(f.name) && !bad.has("*"));
    const rejected = uploaded.filter((f) => bad.has(f.name) || bad.has("*")).map((f) => f.name);
    const limits = fileLimitsFor(await resolveEntitlements(ctx.organization.id));
    const result = await recordUploadedFiles(supabase, ctx, project, accepted, limits, kind);
    revalidatePath("/dashboard/onboarding");
    return { ok: true, data: { recorded: result.recorded, failed: [...rejected, ...result.failed] } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAssetCaption(assetId: string, caption: string): Promise<ActionResult<undefined>> {
  try {
    await requireOrgContextOrThrow();
    const supabase = await createClient();
    const { error } = await supabase.from("project_assets").update({ caption: caption.trim().slice(0, 200) || null }).eq("id", assetId);
    if (error) throw error;
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeProjectAsset(assetId: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const supabase = await createClient();
    const { data: asset, error } = await supabase.from("project_assets").select("id, object_path, organization_id").eq("id", assetId).maybeSingle();
    if (error) throw error;
    if (!asset || asset.organization_id !== ctx.organization.id) throw new NotFoundError("File not found.");
    const { error: delError } = await supabase.from("project_assets").delete().eq("id", assetId);
    if (delError) throw delError;
    await supabase.storage.from(PROJECT_ASSETS_BUCKET).remove([asset.object_path]).catch(() => undefined);
    revalidatePath("/dashboard/onboarding");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

/** Public-DNS guess of where the domain is managed, so the guide opens on the right registrar. */
export async function guessRegistrar(hostnameInput: string): Promise<ActionResult<{ registrar: RegistrarKey | null; nameservers: string[] }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const hostname = normalizeHostname(hostnameInput);
    if (!hostname) throw new ValidationError("Enter a domain like yourbusiness.com.", { hostname: ["Invalid domain"] });
    await enforceRateLimit(`dns:user:${ctx.user.id}`, RATE_LIMITS.dnsLookupUser);
    const result = await detectRegistrar(hostname);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export type DomainSetup = {
  domainId: string;
  hostname: string;
  status: string;
  registrar: RegistrarKey;
  records: DnsRecord[];
  dnsOk: boolean | null;
  sslOk: boolean | null;
  reachable: boolean | null;
  launchReady: boolean;
  statusReason: string | null;
  /** DNS changes stay locked until the domain is attached to a deployed site. */
  cutoverReady: boolean;
};

/**
 * "Yes, I own one": record the domain, attach it to the project's website,
 * work out the records the customer must add, and remember the answer in
 * the brief. Safe to call again for the same hostname.
 */
export async function startOnboardingDomain(projectId: string, input: { hostname: string; registrar: RegistrarKey | null }): Promise<ActionResult<DomainSetup>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    const { supabase, brief } = await loadProject(ctx, projectId);
    const hostname = normalizeHostname(input.hostname);
    if (!hostname) throw new ValidationError("Enter a domain like yourbusiness.com.", { hostname: ["Invalid domain"] });
    await enforceRateLimit(`domain:org:${ctx.organization.id}`, RATE_LIMITS.domainStartOrg);
    let registrar: RegistrarKey | null = input.registrar;
    if (!registrar) registrar = (await detectRegistrar(hostname)).registrar;
    registrar ??= "other";

    const { data: website } = await supabase.from("websites").select("id").eq("project_id", projectId).maybeSingle();

    // Reuse an existing row for the same hostname in this organization.
    const { data: existing } = await supabase.from("domains").select("id").eq("organization_id", ctx.organization.id).eq("hostname", hostname).maybeSingle();
    let domainId = existing?.id ?? null;
    if (!domainId) {
      const { data, error } = await supabase
        .from("domains")
        .insert({
          organization_id: ctx.organization.id,
          website_id: website?.id ?? null,
          hostname,
          kind: domainKind(hostname),
          source: "customer_owned",
          status: "pending",
          registrar,
        })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") throw new ValidationError("You have already added that domain.", { hostname: ["Already added"] });
        throw error;
      }
      domainId = data.id;
      await logAuditEvent(supabase, { action: "domain.connect_started", entityType: "domain", entityId: domainId, organizationId: ctx.organization.id, after: { hostname, website_id: website?.id ?? null, via: "onboarding" } });
    }

    // Work out the records now so the guide is complete on the next screen.
    if (hasAdminClient()) {
      const admin = createAdminClient();
      if (existing) {
        await admin.from("domains").update({ registrar, website_id: website?.id ?? null }).eq("id", domainId);
      }
      try {
        await beginDomainVerification(admin, domainId);
      } catch (err) {
        console.error("beginDomainVerification failed inline; queueing:", err);
        await enqueueJob(admin, { kind: JOB_KINDS.domainConnect, idempotencyKey: `domain.connect:${domainId}`, organizationId: ctx.organization.id, websiteId: website?.id ?? null, domainId, createdBy: ctx.user.id });
      }
    }

    const next = withProgress({ ...brief, domain: { ...(brief.domain ?? domainSchema.parse({})), answer: "own", hostname, registrar, domainId, later: false } }, "domain");
    await writeBrief(supabase, projectId, next);

    revalidatePath("/dashboard/domain");
    return { ok: true, data: await domainSetup(supabase, domainId, registrar) };
  } catch (error) {
    return toActionError(error);
  }
}

async function domainSetup(supabase: Awaited<ReturnType<typeof createClient>>, domainId: string, registrar: RegistrarKey): Promise<DomainSetup> {
  const { data: domain, error } = await supabase.from("domains").select("id, hostname, status, verification, verification_token, dns_ok, ssl_ok, status_reason").eq("id", domainId).single();
  if (error) throw error;
  const records = requiredRecords(domain.hostname, domain.verification, domain.verification_token);
  const source = (domain.verification as { source?: string } | null)?.source;
  const reachable = (domain.verification as { connection_reachable?: boolean } | null)?.connection_reachable ?? null;
  const launchReady = (domain.verification as { launch_ready?: boolean } | null)?.launch_ready === true;
  return { domainId: domain.id, hostname: domain.hostname, status: domain.status, registrar, records, dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady, statusReason: domain.status_reason, cutoverReady: source === "provider" || domain.status === "connected" };
}

/** Re-read the domain's state (the wizard polls this while "Checking…"). */
export async function getDomainSetup(domainId: string, registrar: RegistrarKey): Promise<ActionResult<DomainSetup>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const supabase = await createClient();
    const { data } = await supabase.from("domains").select("organization_id").eq("id", domainId).maybeSingle();
    if (!data || data.organization_id !== ctx.organization.id) throw new NotFoundError("Domain not found.");
    return { ok: true, data: await domainSetup(supabase, domainId, registrar) };
  } catch (error) {
    return toActionError(error);
  }
}

/** "I've added the records": move to verifying, check once now, keep checking in the background. */
export async function confirmDnsAdded(domainId: string, registrar: RegistrarKey = "other"): Promise<ActionResult<DomainSetup>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    const supabase = await createClient();
    const { data: domain } = await supabase.from("domains").select("id, organization_id, status, website_id").eq("id", domainId).maybeSingle();
    if (!domain || domain.organization_id !== ctx.organization.id) throw new NotFoundError("Domain not found.");

    if (hasAdminClient()) {
      const admin = createAdminClient();
      if (domain.status === "pending") {
        assertTransition(domainTransitions, "pending", "verifying", "domain");
        const { error } = await admin.from("domains").update({ status: "verifying", status_reason: null }).eq("id", domainId).eq("status", "pending");
        if (error) throw error;
      }
      await enqueueJob(admin, { kind: JOB_KINDS.domainVerify, idempotencyKey: `domain.verify:${domainId}`, organizationId: ctx.organization.id, websiteId: domain.website_id, domainId, createdBy: ctx.user.id, maxAttempts: 50 });
      await verifyDomain(admin, domainId).catch((err) => console.error("verifyDomain inline failed:", err));
      await logAuditEvent(supabase, { action: "domain.records_confirmed", entityType: "domain", entityId: domainId, organizationId: ctx.organization.id });
    }

    revalidatePath("/dashboard/domain");
    return { ok: true, data: await domainSetup(supabase, domainId, registrar) };
  } catch (error) {
    return toActionError(error);
  }
}

/** Sends the brief to Vigil: locks it, notifies staff, moves the project into the build. */
export async function submitIntake(projectId: string): Promise<ActionResult<{ completedAt: string }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const { supabase, project, brief } = await loadProject(ctx, projectId);
    if (project.intake_completed_at) return { ok: true, data: { completedAt: project.intake_completed_at } };
    if (!brief.basics?.businessName) throw new ValidationError("Tell me the business name before sending.");

    const completedAt = new Date().toISOString();
    const finished = withProgress(brief, "review", true);
    const { error } = await supabase.from("projects").update({ brief: finished as unknown as Json, intake_completed_at: completedAt }).eq("id", projectId);
    if (error) throw error;
    await logAuditEvent(supabase, { action: "project.intake_completed", entityType: "project", entityId: projectId, organizationId: ctx.organization.id, after: { business_name: brief.basics.businessName, project_kind: project.kind, domain: brief.domain?.answer ?? null } });

    if (hasAdminClient() && (project.status === "draft" || project.status === "intake")) {
      const admin = createAdminClient();
      await admin.from("projects").update({ status: "in_progress" }).eq("id", projectId).in("status", ["draft", "intake"]);
    }

    if (hasAdminClient() && brief.domain?.answer === "own" && brief.domain.domainId) {
      const admin = createAdminClient();
      // The brief is customer-writable (RLS lets members update projects.brief
      // directly), so the domain it names is re-checked against this
      // organization before anything is written with the service role.
      const { data: domain } = await admin.from("domains").select("metadata, status_reason").eq("id", brief.domain.domainId).eq("organization_id", ctx.organization.id).maybeSingle();
      if (domain) {
        const metadata = domain.metadata && typeof domain.metadata === "object" && !Array.isArray(domain.metadata)
          ? domain.metadata as Record<string, Json | undefined>
          : {};
        const assistanceRequestedAt = brief.domain.delegate ? completedAt : null;
        await admin.from("domains").update({
          registrar: brief.domain.registrar,
          metadata: {
            ...metadata,
            onboarding_delegate: brief.domain.delegate,
            assistance_requested_at: assistanceRequestedAt,
          },
          ...(brief.domain.delegate
            ? { status_reason: "Assisted DNS cutover requested. Contact the customer before making any DNS changes." }
            : {}),
        }).eq("id", brief.domain.domainId);
        if (brief.domain.delegate) {
          await logAuditEvent(supabase, {
            action: "domain.assistance_requested",
            entityType: "domain",
            entityId: brief.domain.domainId,
            organizationId: ctx.organization.id,
            after: { registrar: brief.domain.registrar, requested_at: completedAt },
          });
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co";
    const domainLine =
      brief.domain?.answer === "own"
        ? `Owns ${brief.domain.hostname} (${REGISTRAR_GUIDES[brief.domain.registrar ?? "other"].name})${brief.domain.delegate ? "; asked Vigil to make the DNS changes" : ""}${brief.domain.later ? "; will connect it later" : ""}`
        : brief.domain?.answer === "need"
          ? "Needs a domain; shown the buy-it-yourself guide, will connect it once bought"
          : "Domain: not decided yet";
    const { count: assetCount } = await supabase.from("project_assets").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    const kickoffLine = project.kind === "express" ? "" : `\nOnboarding route: ${brief.kickoff?.mode === "call" ? `kickoff call with the Vigil team${brief.kickoff.callBooked ? " (booked)" : ""}` : brief.kickoff?.mode === "both" ? "kickoff call with the Vigil team (booked) and guided brief" : "guided brief"}\n`;
    const strategyLine = project.kind === "express"
      ? ""
      : `\nSite goal: ${brief.strategy?.primaryGoal ?? "not selected"}\nPages requested: ${brief.strategy?.pages.join(", ") || "not listed"}\nFunctionality: ${brief.strategy?.features.join(", ") || "not listed"}\n`;
    const text = `${brief.basics.businessName} finished ${project.kind} onboarding for "${project.name}".\n${kickoffLine}${strategyLine}\n${domainLine}\nFiles uploaded: ${assetCount ?? 0}\n\nReview: ${appUrl}/admin/organizations/${ctx.organization.id}`;
    // The notification is what starts the build. If it fails, nothing is
    // recorded and the reconciliation pass sends it again.
    const notified = await sendEmail({
      to: staffNotificationAddress(),
      subject: brief.kickoff?.mode === "call" ? `Professional kickoff booked: ${brief.basics.businessName}` : `Onboarding complete: ${brief.basics.businessName}`,
      text,
      html: layout(`Onboarding complete: ${brief.basics.businessName}`, `<p><b>${escapeHtml(project.kind)} site</b></p>${kickoffLine ? `<p>${escapeHtml(kickoffLine).replace(/\n/g, "<br>")}</p>` : ""}${strategyLine ? `<p>${escapeHtml(strategyLine).replace(/\n/g, "<br>")}</p>` : ""}<p>${escapeHtml(domainLine)}</p><p>Files uploaded: ${assetCount ?? 0}</p>${button(`${appUrl}/admin/organizations/${ctx.organization.id}`, "Open in Vigil Admin")}`),
    }).catch(() => ({ sent: false }));
    if (notified.sent) {
      await logAuditEvent(supabase, { action: "project.intake_notified", entityType: "project", entityId: projectId, organizationId: ctx.organization.id, after: { via: "submit" } }).catch(() => undefined);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/onboarding");
    return { ok: true, data: { completedAt } };
  } catch (error) {
    return toActionError(error);
  }
}
