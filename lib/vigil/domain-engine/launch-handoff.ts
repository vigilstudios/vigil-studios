import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { ProviderError, ValidationError } from "@/lib/vigil/auth/errors";
import { bindManagedDomain, prepareManagedDns, applyManagedDns } from "./managed-connection";
import { syncManagedRegistration } from "./registrar-sync";

const contextSchema = z.object({
  ownerId: z.string().uuid(), orderId: z.string().uuid(), registrationId: z.string().uuid(),
  organizationId: z.string().uuid(), websiteId: z.string().uuid(),
});

/** Server-only, saved customer permission. This cannot authorize a website deployment. */
export async function managedLaunchContext(admin: DbClient, registrationId: string, organizationId: string, websiteId: string) {
  if (process.env.VIGIL_DOMAIN_ENGINE_ENABLED !== "true" || process.env.VIGIL_DOMAIN_LIVE_ENABLED !== "true") return null;
  const { data, error } = await admin.rpc("managed_domain_launch_context", {
    p_registration_id: registrationId, p_organization_id: organizationId, p_website_id: websiteId,
  });
  if (error) throw error;
  if (!data) return null;
  const ctx = contextSchema.parse(data);
  if (ctx.registrationId !== registrationId || ctx.organizationId !== organizationId || ctx.websiteId !== websiteId)
    throw new ValidationError("The domain launch permission does not match this website.");
  return ctx;
}

/** Bind only opted-in registrations before the existing admin production preflight. */
export async function prepareManagedWebsiteLaunch(admin: DbClient, websiteId: string) {
  if (process.env.VIGIL_DOMAIN_ENGINE_ENABLED !== "true" || process.env.VIGIL_DOMAIN_LIVE_ENABLED !== "true") return;
  const { data, error } = await admin.rpc("managed_website_launch_requests", { p_website_id: websiteId });
  if (error) throw error;
  const requests = z.array(z.object({ registrationId: z.string().uuid().nullable(), organizationId: z.string().uuid() })).parse(data);
  for (const request of requests) {
    if (!request.registrationId) throw new ValidationError("Complete the saved domain registration before deploying this website.");
    await syncManagedRegistration(admin, request.registrationId, request.organizationId);
    const ctx = await managedLaunchContext(admin, request.registrationId, request.organizationId, websiteId);
    if (!ctx) throw new ValidationError("The domain needs attention before Vigil can deploy this website. Check payment, owner email verification and the approved connection scope.");
    await bindManagedDomain(admin, request.registrationId, websiteId, request.organizationId, ctx.ownerId);
  }
}

/** Runs only after an approved production build. Existing exact-plan, registrar,
 * account, website-only, conflict and once-only submission guards still apply. */
export async function connectManagedDomainAtLaunch(admin: DbClient, domain: {
  managed_registration_id: string | null; organization_id: string; website_id: string | null;
}, provider: DeploymentProvider) {
  if (!domain.managed_registration_id || !domain.website_id) return;
  const ctx = await managedLaunchContext(admin, domain.managed_registration_id, domain.organization_id, domain.website_id);
  if (!ctx) return; // Legacy owner-approved connection remains available separately.
  const { data, error } = await admin.rpc("managed_dns_plan_status", {
    p_registration_id: ctx.registrationId, p_organization_id: ctx.organizationId, p_actor_id: ctx.ownerId,
  });
  if (error) throw error;
  const saved = z.object({ id: z.string().uuid(), status: z.string() }).nullable().parse(data);
  // Never create a new submission while an earlier write has an uncertain result.
  const pending = saved && ["claimed", "review"].includes(saved.status) ? saved : null;
  const plan = pending ?? await prepareManagedDns(admin, ctx.registrationId, ctx.organizationId, ctx.ownerId, provider, ctx.orderId);
  // This permission was recorded at purchase, explicitly for this website's future
  // approved launch. It is not inferred from email verification or impersonation.
  const result = await applyManagedDns(admin, plan.id, ctx.organizationId, ctx.ownerId, true, "live");
  if (!result.applied) throw new ProviderError("domain", "Vigil is reconciling the saved website connection. No duplicate DNS changes were submitted.", { retryable: true });
}
