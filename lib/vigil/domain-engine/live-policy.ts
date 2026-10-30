import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import { DomainEngineError } from "./errors";
import { readDomainEngineConfig } from "./config";
import { namecomAccountScope } from "./namecom-production";

export const livePolicySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  website_id: z.string().uuid(),
  fqdn: z.string().nullable(),
  registrar_tax_confirmation: z.string().min(5),
  registrar_scope: z.string().regex(/^namecom:live:[a-f0-9]{64}$/),
  stripe_account: z.string().regex(/^acct_[A-Za-z0-9]+$/),
  max_registrar_minor: z.number().int().positive().max(100000),
  max_client_minor: z.number().int().positive().max(100000000),
  service_fee_minor: z.number().int().nonnegative(),
  tax_rate_bps: z.number().int().min(0).max(10000),
  tax_description: z.string(),
  registrant_country: z.string().regex(/^[A-Z]{2}$/),
  registrant_region: z.string().min(1),
  registrant_postal_code: z.string().min(1),
  terms_version: z.string().min(1),
  terms_url: z.string().url(),
  registration_agreement_url: z.string().url(),
  renewal_policy_version: z.string().min(1),
  renewal_model: z.literal("manual"),
  retention_days: z.number().int().positive(),
  dns_approved: z.boolean(),
  valid_until: z.string(),
  revoked_at: z.string().nullable(),
});
export type LiveDomainPolicy = z.infer<typeof livePolicySchema>;
export function liveUnavailable(
  message = "Domain purchasing is not available for this website yet.",
) {
  return new DomainEngineError("domain_live_unavailable", message, 403);
}
export function assertDomainLiveRuntime() {
  const config = readDomainEngineConfig();
  if (
    !config.enabled ||
    config.registrar !== "namecom" ||
    process.env.VIGIL_DOMAIN_LIVE_ENABLED !== "true"
  )
    throw liveUnavailable();
}
export function liveRegistrarScope() {
  return namecomAccountScope(process.env.VIGIL_NAMECOM_USERNAME ?? "", "live");
}
export async function loadLivePolicy(
  admin: DbClient,
  organizationId: string,
  websiteId?: string,
  fqdn?: string,
  policyId?: string,
  active = true,
) {
  assertDomainLiveRuntime();
  const { data, error } = await admin.rpc("domain_live_policy", {
    p_organization_id: organizationId,
    p_website_id: websiteId,
    p_fqdn: fqdn,
    p_policy_id: policyId,
    p_active: active,
  });
  const parsed = livePolicySchema.safeParse(data);
  if (error || !parsed.success) throw liveUnavailable();
  const p = parsed.data;
  if (
    p.registrar_scope !== liveRegistrarScope() ||
    p.stripe_account !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID ||
    p.organization_id !== organizationId ||
    (websiteId && p.website_id !== websiteId) ||
    (fqdn && p.fqdn && p.fqdn !== fqdn)
  )
    throw liveUnavailable(
      "The domain service account or website needs review.",
    );
  for (const url of [p.terms_url, p.registration_agreement_url])
    if (new URL(url).protocol !== "https:") throw liveUnavailable();
  return p;
}
export function retailDomainAmount(cost: number, policy: LiveDomainPolicy) {
  if (
    !Number.isSafeInteger(cost) ||
    cost <= 0 ||
    cost > policy.max_registrar_minor
  )
    throw liveUnavailable(
      "That domain exceeds the approved registrar cost limit.",
    );
  const subtotal = cost + policy.service_fee_minor,
    tax = Math.ceil((subtotal * policy.tax_rate_bps) / 10000),
    total = subtotal + tax;
  if (!Number.isSafeInteger(total) || total > policy.max_client_minor)
    throw liveUnavailable(
      "That domain exceeds the approved total price limit.",
    );
  return { subtotalMinor: subtotal, taxMinor: tax, totalMinor: total };
}
export async function authorizeLiveAction(
  admin: DbClient,
  orderId: string,
  action: string,
) {
  assertDomainLiveRuntime();
  const { data, error } = await admin.rpc("authorize_live_domain_action", {
    p_order_id: orderId,
    p_action: action,
    p_registrar_scope: liveRegistrarScope(),
    p_stripe_account: process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID ?? "",
  });
  const parsed = livePolicySchema.safeParse(data);
  if (error || !parsed.success)
    throw liveUnavailable(
      "This domain operation needs an approved policy and matching account.",
    );
  return parsed.data;
}
export function publicDomainPolicy(p: LiveDomainPolicy) {
  return {
    termsVersion: p.terms_version,
    termsUrl: p.terms_url,
    registrationAgreementUrl: p.registration_agreement_url,
    renewalPolicyVersion: p.renewal_policy_version,
    renewalModel: p.renewal_model,
    taxDescription: p.tax_description,
  };
}

/** Restrict the new client surface to explicitly approved websites during rollout.
 * Historical policies keep existing orders accessible after new spending is revoked. */
export async function hasLiveWebsitePolicy(
  admin: DbClient,
  organizationId: string,
  websiteId: string,
) {
  try {
    await loadLivePolicy(
      admin,
      organizationId,
      websiteId,
      undefined,
      undefined,
      false,
    );
    return true;
  } catch {
    return false;
  }
}
