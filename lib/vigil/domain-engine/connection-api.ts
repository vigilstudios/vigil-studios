import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";
import { assertDomainLiveRuntime } from "@/lib/vigil/domain-engine/live-policy";
import { getDeploymentProvider } from "@/lib/vigil/providers/registry";
import { assertDomainTestDatabase } from "@/lib/vigil/domain-engine/runtime";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import {
  bindManagedDomain,
  prepareManagedDns,
  applyManagedDns,
} from "@/lib/vigil/domain-engine/managed-connection";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { domainTestDeploymentProvider } from "@/lib/vigil/domain-engine/test-deployment";

const id = z.string().uuid();
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), registrationId: id }).strict(),
  z
    .object({ action: z.literal("bind"), registrationId: id, websiteId: id })
    .strict(),
  z.object({ action: z.literal("plan"), registrationId: id }).strict(),
  z
    .object({
      action: z.literal("apply"),
      planId: id,
      consent: z.literal(true),
    })
    .strict(),
]);

export async function handleManagedConnection(
  request: NextRequest,
  environment: "test" | "live",
) {
  try {
    if (environment === "test") assertDomainTestDatabase();
    else assertDomainLiveRuntime();
    const config = readDomainEngineConfig();
    if (!config.enabled || config.registrar !== "namecom") throw new Error();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isSameOriginRequest(request))
      throw new DomainEngineError(
        "invalid_origin",
        "Open this test workspace directly.",
        403,
      );
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner"]);
    if (ctx.isImpersonating)
      throw new DomainEngineError(
        "owner_required",
        "The customer owner must approve DNS changes.",
        403,
      );
    await enforceRateLimit(`managed-dns-test:${ctx.organization.id}`, {
      limit: 40,
      windowSeconds: 3600,
    });
    const raw = await boundedDomainBody(request, 8000);
    if (Buffer.byteLength(raw) > 8000)
      throw new DomainEngineError(
        "request_too_large",
        "The request is too large.",
        413,
      );
    const body = input.parse(JSON.parse(raw));
    const admin = createAdminClient();
    const organizationId = ctx.organization.id,
      actorId = ctx.user.id;
    let result: unknown;
    if (body.action !== "apply") {
      const { data: scoped, error: scopeError } = await admin
        .from("domain_registrations")
        .select("id")
        .eq("id", body.registrationId)
        .eq("organization_id", organizationId)
        .eq("environment", environment)
        .single();
      if (scopeError || !scoped)
        throw new DomainEngineError(
          "registration_unavailable",
          "The registration is unavailable.",
          404,
        );
    }
    if (body.action === "bind")
      result = await bindManagedDomain(
        admin,
        body.registrationId,
        body.websiteId,
        organizationId,
        actorId,
      );
    else if (body.action === "plan")
      result = await prepareManagedDns(
        admin,
        body.registrationId,
        organizationId,
        actorId,
        environment === "test"
          ? domainTestDeploymentProvider()
          : getDeploymentProvider(),
      );
    else if (body.action === "apply")
      result = await applyManagedDns(
        admin,
        body.planId,
        organizationId,
        actorId,
        body.consent,
        environment,
      );
    else {
      const { data: registration, error } = await admin
        .from("domain_registrations")
        .select("id,website_id,registration_status,contact_verification")
        .eq("id", body.registrationId)
        .eq("organization_id", organizationId)
        .eq("environment", environment)
        .eq("registrar", "namecom")
        .single();
      if (error || !registration)
        throw new DomainEngineError(
          "registration_unavailable",
          "The registration is unavailable.",
          404,
        );
      const { data: domain, error: readError } = await admin
        .from("domains")
        .select("id,dns_ok,ssl_ok,status_reason")
        .eq("managed_registration_id", registration.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (readError) throw new Error();
      const { data: plan, error: planError } = await admin.rpc(
        "managed_dns_plan_status",
        {
          p_registration_id: registration.id,
          p_organization_id: organizationId,
          p_actor_id: actorId,
        },
      );
      if (planError) throw new Error();
      result = {
        plan,
        websiteId: registration.website_id,
        bound: Boolean(domain),
        dnsVerified: domain?.dns_ok === true,
        sslVerified: domain?.ssl_ok === true,
        reason: domain?.status_reason ?? null,
      };
    }
    if (
      environment === "live" &&
      body.action === "apply" &&
      (result as { applied?: boolean })?.applied
    ) {
      const domainId = (result as { domainId?: string }).domainId;
      const { data: domain } = await admin
        .from("domains")
        .select("id,website_id")
        .eq("id", domainId!)
        .eq("organization_id", organizationId)
        .single();
      if (!domain?.website_id) throw new Error();
      const { enqueueJob, JOB_KINDS } = await import("@/lib/vigil/jobs");
      await enqueueJob(admin, {
        kind: JOB_KINDS.domainVerify,
        idempotencyKey: `domain.verify:managed:${domain.id}:${body.planId}`,
        organizationId,
        websiteId: domain.website_id,
        domainId: domain.id,
        maxAttempts: 200,
        requeueFailed: true,
      });
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
            : "The test connection could not be completed.",
      },
      {
        status: error instanceof DomainEngineError ? error.status : 422,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
