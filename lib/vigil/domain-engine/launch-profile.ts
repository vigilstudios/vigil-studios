import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import { livePolicySchema, liveRegistrarScope, liveUnavailable } from "./live-policy";

const schema = z.object({
  id: z.string().uuid(), registrar_scope: z.string(), stripe_account: z.string(),
  max_registrar_minor: z.number().int().positive(), max_client_minor: z.number().int().positive(),
  service_fee_minor: z.number().int().nonnegative(), allowed_country: z.literal("US"),
  terms_version: z.string().min(1), terms_url: z.string().url(), registration_agreement_url: z.string().url(),
  renewal_policy_version: z.string().min(1), retention_days: z.number().int().min(2557),
  purchasing_enabled: z.boolean(), tax_code: z.string().nullable(), fee_tax_code: z.string().nullable(),
  tax_review_reference: z.string().nullable(), supplier_tax_reference: z.string().nullable(),
  valid_until: z.string(), revoked_at: z.string().nullable(),
});
export type DomainLaunchProfile = z.infer<typeof schema>;
export async function getDomainLaunchProfile(admin: DbClient): Promise<DomainLaunchProfile | null> {
  const { data, error } = await admin.rpc("domain_launch_profile");
  const parsed = schema.safeParse(data);
  if (error || !parsed.success) return null;
  const p = parsed.data;
  if (p.registrar_scope !== liveRegistrarScope() || p.stripe_account !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID || p.revoked_at || !Number.isFinite(Date.parse(p.valid_until)) || Date.parse(p.valid_until) <= Date.now()) return null;
  if ([p.terms_url, p.registration_agreement_url].some(url => new URL(url).protocol !== "https:")) return null;
  return p;
}
export async function ensureDomainWebsitePolicy(admin: DbClient, org: string, website: string, actor: string) {
  const profile = await getDomainLaunchProfile(admin);
  if (!profile?.purchasing_enabled || !profile.tax_code || !profile.fee_tax_code || !profile.tax_review_reference || !profile.supplier_tax_reference) throw liveUnavailable();
  const { data, error } = await admin.rpc("ensure_domain_website_policy", {
    p_organization_id: org, p_website_id: website, p_actor_id: actor, p_profile_id: profile.id,
  });
  const parsed = livePolicySchema.safeParse(data);
  if (error || !parsed.success) throw liveUnavailable();
  return parsed.data;
}
