"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { assertOrgRole, requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
import { domainKind } from "@/lib/vigil/domains";
import { beginDomainVerification, normalizeHostname } from "@/lib/vigil/services/domain";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/vigil/rate-limit";

export type DomainState = ActionResult<{ domainId: string }> | null;

/**
 * Flow B, step 1: the customer records a domain they own. The row is created
 * under RLS (customer_owned + pending only); a job then asks the deployment
 * provider for the DNS records the customer must set.
 */
export async function startDomainConnection(_prev: DomainState, formData: FormData): Promise<DomainState> {
  let domainId: string;
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);

    const hostname = normalizeHostname(String(formData.get("hostname") ?? ""));
    if (!hostname) throw new ValidationError("Enter a domain like yourbusiness.com.", { hostname: ["Invalid domain"] });
    await enforceRateLimit(`domain:org:${ctx.organization.id}`, RATE_LIMITS.domainStartOrg);
    const websiteId = String(formData.get("website_id") ?? "") || null;

    const supabase = await createClient();
    if (!websiteId) throw new ValidationError("Choose the website for this domain.");
    const { data: website, error: websiteError } = await supabase.from("websites").select("id").eq("id", websiteId).eq("organization_id", ctx.organization.id).neq("status", "archived").neq("status", "suspended").maybeSingle();
    if (websiteError) throw websiteError;
    if (!website) throw new ValidationError("Choose a website in your account.");
    const registrar = formData.get("registrar") === "vercel" ? "vercel" : "other";
    const { data, error } = await supabase
      .from("domains")
      .insert({
        organization_id: ctx.organization.id,
        website_id: websiteId,
        hostname,
        kind: domainKind(hostname),
        source: "customer_owned",
        registrar,
        status: "pending",
      })
      .select("id")
      .single();
    let created = true;
    let savedId = data?.id;
    if (error) {
      if (error.code !== "23505") throw error;
      // A retry must resume the same tenant/site row and never detach a domain
      // already activated for production. Another site's domain is not reused.
      const { data: existing, error: existingError } = await supabase.from("domains").select("id").eq("organization_id", ctx.organization.id).eq("website_id", websiteId).eq("hostname", hostname).neq("status", "released").maybeSingle();
      if (existingError) throw existingError;
      if (!existing) throw new ValidationError("This domain is already being set up elsewhere. Contact Vigil for help.");
      savedId = existing.id;
      created = false;
    }
    if (!savedId) throw new ValidationError("Your domain could not be saved. Please retry.");
    if (created) {
      await logAuditEvent(supabase, {
        action: "domain.connect_started",
        entityType: "domain",
        entityId: savedId,
        organizationId: ctx.organization.id,
        after: { hostname, website_id: websiteId },
      });

      // Queue the provider hand-off. Without a service key the row still
      // exists and staff can pick it up from the admin console.
      if (hasAdminClient()) {
        const admin = createAdminClient();
        try {
          // Inline so the records are on screen when the page re-renders.
          await beginDomainVerification(admin, savedId);
        } catch (err) {
          console.error("beginDomainVerification failed inline; queueing:", err);
          await enqueueJob(admin, {
            kind: JOB_KINDS.domainConnect,
            idempotencyKey: `domain.connect:${savedId}`,
            organizationId: ctx.organization.id,
            websiteId,
            domainId: savedId,
            createdBy: ctx.user.id,
          });
        }
      }
    }
    revalidatePath("/dashboard/domain");
    revalidatePath("/dashboard/onboarding");
    domainId = savedId;
  } catch (error) {
    return toActionError(error);
  }
  // Outside the catch: Next uses a redirect exception for both client
  // navigation and the progressive-enhancement 303 response.
  redirect(`/dashboard/domain?flow=own&domain=${encodeURIComponent(domainId)}`);
}
