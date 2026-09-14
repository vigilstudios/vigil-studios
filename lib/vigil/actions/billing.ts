"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/vigil/audit";
import { NotFoundError, ProviderNotConfiguredError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { assertOrgRole, requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import { findExternalId, providerEnum } from "@/lib/vigil/services/provider-links";

/**
 * "Manage billing": open the provider's customer portal for this
 * organization. The customer id comes from provider_links (customers cannot
 * read that table, so the lookup uses the service role after the membership
 * check). Redirects on success; returns an error the page can show otherwise.
 */
export async function openBillingPortal(): Promise<ActionResult<never> | never> {
  let url: string;
  try {
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Billing");
    const provider = getBillingProvider();
    const customerId = await findExternalId(createAdminClient(), {
      provider: providerEnum(provider.name),
      resourceKind: "customer",
      entityType: "organization",
      entityId: ctx.organization.id,
    });
    if (!customerId) throw new NotFoundError("Online billing is not set up for this account yet. Write to hello@vigilstudios.co for any billing change.");

    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const session = await provider.createPortalSession(customerId, `${origin}/dashboard/billing`);
    url = session.url;
    await logAuditEvent(await createClient(), { action: "billing.portal_opened", entityType: "organization", entityId: ctx.organization.id, organizationId: ctx.organization.id });
  } catch (error) {
    return toActionError(error);
  }
  redirect(url);
}
