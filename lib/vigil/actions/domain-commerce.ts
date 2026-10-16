"use server";

import { domainHandoffEnabled } from "@/lib/vigil/domain-commerce-config";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { ProviderNotConfiguredError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/vigil/rate-limit";
import { searchVercelDomain } from "@/lib/vigil/providers/vercel-discovery";
import { assertHandoffActor, assertHandoffWebsite, loadDomainIntent, saveHandoff } from "@/lib/vigil/services/domain-handoff";
import type { DomainIntent, DomainQuote } from "@/lib/vigil/domain-commerce";

export async function getDomainHandoff(websiteId: string): Promise<ActionResult<DomainIntent | null>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const client = await createClient();
    await assertHandoffWebsite(client, ctx.organization.id, z.string().uuid().parse(websiteId));
    return { ok: true, data: await loadDomainIntent(client, ctx.organization.id, websiteId) };
  } catch (error) { return toActionError(error); }
}
export async function findVercelDomain(websiteId: string, hostname: string): Promise<ActionResult<DomainQuote>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    if (!domainHandoffEnabled()) throw new ProviderNotConfiguredError("Domain handoff");
    // Discovery is read-only and uses no customer/provider credential. Staff
    // viewing a tenant may search; saving a choice still requires its owner.
    await assertHandoffWebsite(await createClient(), ctx.organization.id, z.string().uuid().parse(websiteId));
    await enforceRateLimit(`domain-search:org:${ctx.organization.id}`, RATE_LIMITS.domainSearchOrg, true);
    return { ok: true, data: await searchVercelDomain(hostname) };
  } catch (error) { return toActionError(error); }
}
export async function updateDomainHandoff(input: { websiteId: string; version: number; action: "handoff" | "help" | "cancel"; hostname?: string }): Promise<ActionResult<DomainIntent>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    if (!domainHandoffEnabled()) throw new ProviderNotConfiguredError("Domain handoff");
    assertHandoffActor(ctx);
    z.string().uuid().parse(input.websiteId);
    await enforceRateLimit(`domain-handoff:org:${ctx.organization.id}`, RATE_LIMITS.domainHandoffOrg, true);
    if (!hasAdminClient()) throw new ProviderNotConfiguredError("Domain handoff");
    const intent = await saveHandoff(createAdminClient(), ctx, input);
    for (const path of ["/dashboard", "/dashboard/domain", "/dashboard/onboarding"]) revalidatePath(path);
    return { ok: true, data: intent };
  } catch (error) { return toActionError(error); }
}
