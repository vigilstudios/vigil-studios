"use server";

import { revalidatePath } from "next/cache";
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
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);

    const hostname = normalizeHostname(String(formData.get("hostname") ?? ""));
    if (!hostname) throw new ValidationError("Enter a domain like yourbusiness.com.", { hostname: ["Invalid domain"] });
    await enforceRateLimit(`domain:org:${ctx.organization.id}`, RATE_LIMITS.domainStartOrg);
    const websiteId = String(formData.get("website_id") ?? "") || null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("domains")
      .insert({
        organization_id: ctx.organization.id,
        website_id: websiteId,
        hostname,
        kind: domainKind(hostname),
        source: "customer_owned",
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new ValidationError("You have already added that domain.", { hostname: ["Already added"] });
      throw error;
    }

    await logAuditEvent(supabase, {
      action: "domain.connect_started",
      entityType: "domain",
      entityId: data.id,
      organizationId: ctx.organization.id,
      after: { hostname, website_id: websiteId },
    });

    // Queue the provider hand-off. Without a service key the row still
    // exists and staff can pick it up from the admin console.
    if (hasAdminClient()) {
      const admin = createAdminClient();
      try {
        // Inline so the records are on screen when the page re-renders.
        await beginDomainVerification(admin, data.id);
      } catch (err) {
        console.error("beginDomainVerification failed inline; queueing:", err);
        await enqueueJob(admin, {
          kind: JOB_KINDS.domainConnect,
          idempotencyKey: `domain.connect:${data.id}`,
          organizationId: ctx.organization.id,
          websiteId,
          domainId: data.id,
          createdBy: ctx.user.id,
        });
      }
    }

    revalidatePath("/dashboard/domain");
    return { ok: true, data: { domainId: data.id } };
  } catch (error) {
    return toActionError(error);
  }
}
