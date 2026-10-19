import "server-only";
import { domainHandoffEnabled } from "@/lib/vigil/domain-commerce-config";
import type { Json } from "@/types/database.types";
import type { DbClient, Tables } from "@/lib/vigil/types";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import type { OrgContext } from "@/lib/vigil/auth/session";
import { normalizeRegistrationName, type DomainIntent, type DomainQuote } from "@/lib/vigil/domain-commerce";
import { searchVercelDomain } from "@/lib/vigil/providers/vercel-discovery";
import { canManageDomainSetup } from "@/lib/vigil/domain-access";

export function assertDomainSetupActor(ctx: OrgContext): void {
  if (!canManageDomainSetup(ctx)) throw new ForbiddenError("A customer owner, manager or Vigil administrator is required to manage domain setup.");
}

export function assertHandoffActor(ctx: OrgContext): void {
  if (ctx.isImpersonating || !["owner", "manager"].includes(ctx.role)) throw new ForbiddenError("Only a customer owner or manager can save a domain choice. Staff viewing this account cannot provide customer authorization.");
}
export function intentDto(row: Tables<"domain_purchase_intents">): DomainIntent {
  return { id: row.id, websiteId: row.website_id, hostname: row.hostname, version: row.version,
    phase: row.phase as DomainIntent["phase"], handoffAt: row.handoff_at, quote: row.quote as unknown as DomainQuote };
}
export async function loadDomainIntent(client: DbClient, orgId: string, websiteId: string): Promise<DomainIntent | null> {
  if (!domainHandoffEnabled()) return null;
  const { data, error } = await client.from("domain_purchase_intents").select("*").eq("organization_id", orgId).eq("website_id", websiteId).maybeSingle();
  if (error) throw error;
  return data ? intentDto(data) : null;
}
export async function assertHandoffWebsite(client: DbClient, orgId: string, websiteId: string): Promise<void> {
  const { data, error } = await client.from("websites").select("id").eq("organization_id", orgId).eq("id", websiteId).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError("Website not found.");
}
export async function saveHandoff(admin: DbClient, ctx: OrgContext, input: { websiteId: string; version: number; action: "handoff" | "help" | "cancel"; hostname?: string }, search = searchVercelDomain): Promise<DomainIntent> {
  assertDomainSetupActor(ctx);
  await assertHandoffWebsite(admin, ctx.organization.id, input.websiteId);
  if (!Number.isSafeInteger(input.version) || input.version < 0 || !["handoff", "help", "cancel"].includes(input.action)) throw new ValidationError("Refresh the domain selection and try again.");
  // Requote server-side. Browser prices/timestamps are never accepted as authority.
  const hostname = input.action === "handoff" ? normalizeRegistrationName(input.hostname ?? "") : null;
  if (input.action === "handoff" && !hostname) throw new ValidationError("Enter an exact domain like yourbusiness.com.");
  const quote = hostname ? await search(hostname) : null;
  if (quote && !quote.available) throw new ValidationError("That name is unavailable. Choose another domain.");
  const { data, error } = await admin.rpc("save_domain_handoff", { p_organization: ctx.organization.id, p_website: input.websiteId, p_actor: ctx.user.id,
    p_expected_version: input.version, p_hostname: hostname ?? "", p_quote: (quote ?? {}) as unknown as Json,
    p_quoted_at: quote?.quotedAt ?? new Date().toISOString(), p_action: input.action });
  if (error) {
    if (error.code === "40001") throw new ValidationError("This selection changed in another tab or device. Refresh and try again.");
    if (error.code === "23505") throw new ValidationError("That domain is already connected. Contact Vigil for help.");
    // Database/provider internals never go to browser or action logs.
    throw new ValidationError("The domain choice could not be saved. Refresh and try again.");
  }
  if (!data) throw new ValidationError("The domain choice could not be saved. Please retry.");
  return intentDto(data);
}
