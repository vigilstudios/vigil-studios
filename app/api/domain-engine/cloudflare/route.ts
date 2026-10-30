import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";
import {
  assertCloudflareIntegration,
  prepareExternalDns,
  applyExternalDns,
} from "@/lib/vigil/domain-engine/external-dns";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
const id = z.string().uuid();
const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("prepare"),
      domainId: id,
      token: z.string().min(20).max(500),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("apply"),
      planId: id,
      consent: z.literal(true),
    })
    .strict(),
  z.object({ action: z.literal("status"), domainId: id }).strict(),
]);
export async function POST(request: NextRequest) {
  try {
    assertCloudflareIntegration();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isSameOriginRequest(request))
      throw new DomainEngineError(
        "invalid_origin",
        "Open your Vigil dashboard directly.",
        403,
      );
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner"]);
    if (ctx.isImpersonating)
      throw new DomainEngineError(
        "owner_required",
        "The customer owner must authorize DNS access.",
        403,
      );
    await enforceRateLimit(`cloudflare-domain:${ctx.organization.id}`, {
      limit: 20,
      windowSeconds: 3600,
    });
    const raw = await boundedDomainBody(request, 4000);
    if (Buffer.byteLength(raw) > 4000)
      throw new DomainEngineError(
        "request_too_large",
        "The request is too large.",
        413,
      );
    const body = input.parse(JSON.parse(raw)),
      admin = createAdminClient();
    let result: unknown;
    if (body.action === "prepare")
      result = await prepareExternalDns(
        admin,
        body.domainId,
        ctx.organization.id,
        ctx.user.id,
        body.token,
      );
    else if (body.action === "apply")
      result = await applyExternalDns(
        admin,
        body.planId,
        ctx.organization.id,
        ctx.user.id,
      );
    else {
      const { data: domain, error } = await admin
        .from("domains")
        .select("id")
        .eq("id", body.domainId)
        .eq("organization_id", ctx.organization.id)
        .single();
      if (error || !domain)
        throw new DomainEngineError(
          "domain_unavailable",
          "Domain unavailable.",
          404,
        );
      const { data, error: planError } = await admin.rpc("external_dns_plan", {
        p_domain_id: domain.id,
        p_actor_id: ctx.user.id,
      });
      if (planError) throw new Error();
      result = data;
    }
    return NextResponse.json(
      { ok: true, result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError
            ? error.message
            : "The authorized DNS operation needs review. No duplicate submission was made.",
      },
      {
        status: error instanceof DomainEngineError ? error.status : 422,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
