"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { ForbiddenError, ProviderNotConfiguredError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/vigil/rate-limit";

export type DomainResetState = ActionResult | null;

/** Clear a reviewed, unpublished setup; never changes DNS or deletes history. */
export async function resetDomainSetup(_previous: DomainResetState, form: FormData): Promise<DomainResetState> {
  let website: string;
  try {
    const ctx = await requireOrgContextOrThrow();
    if (ctx.staffRole !== "admin") throw new ForbiddenError("Open the customer account as a Vigil administrator to reset setup.");
    website = z.string().uuid().parse(form.get("website_id"));
    if (form.get("confirm_reset") !== "yes") throw new ValidationError("Confirm that you want to clear this website’s domain setup.");
    const version = z.coerce.number().int().nonnegative().parse(form.get("intent_version"));
    const snapshot = z.array(z.object({ id: z.string().uuid(), updated_at: z.string().datetime({ offset: true }) }).strict()).max(100).parse(JSON.parse(String(form.get("domain_snapshot"))));
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Domain setup management");
    await enforceRateLimit(`domain-handoff:org:${ctx.organization.id}`, RATE_LIMITS.domainHandoffOrg, true);
    const { error } = await createAdminClient().rpc("reset_domain_setup", {
      p_organization: ctx.organization.id, p_website: website, p_actor: ctx.user.id,
      p_expected_version: version, p_domains: snapshot,
    });
    if (error?.code === "40001") throw new ValidationError("This setup changed or is being checked. Refresh, review it, and try again.");
    if (error) throw new ValidationError("This setup could not be cleared. Live or provider-managed domains need a separate domain change.");
    for (const path of ["/dashboard", "/dashboard/domain", "/dashboard/onboarding", `/admin/organizations/${ctx.organization.id}`, "/admin/domains"]) revalidatePath(path);
  } catch (error) { return toActionError(error); }
  redirect(`/dashboard/domain?flow=choose&website=${encodeURIComponent(website)}`);
}
