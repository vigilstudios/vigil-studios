import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import {
  readDomainEngineConfig,
  assertDomainSearchEnabled,
  assertLiveDomainOperationAllowed,
} from "@/lib/vigil/domain-engine/config";
import { searchVercelDomains } from "@/lib/vigil/domain-engine/search";
import { normalizeDomain } from "@/lib/vigil/domain-engine/normalize";
import { detectRegistrar } from "@/lib/vigil/services/dns";
import { domainKind } from "@/lib/vigil/domains";
import { logAuditEvent } from "@/lib/vigil/audit";

/** Existing authorization/RLS remains the entry point. No purchase or DNS mutation is exposed. */
export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request))
      return NextResponse.json(
        { error: "Open this page directly from your Vigil dashboard." },
        { status: 403 },
      );
    const config = readDomainEngineConfig();
    if (!config.enabled)
      throw new DomainEngineError(
        "domain_disabled",
        "Domain setup is not enabled yet.",
        503,
      );
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    await enforceRateLimit(`domain-engine:${ctx.organization.id}`, {
      limit: 30,
      windowSeconds: 3600,
    });
    const text = await request.text();
    if (Buffer.byteLength(text) > 16000)
      throw new DomainEngineError(
        "request_too_large",
        "This request is too large.",
        413,
      );
    const body = JSON.parse(text) as Record<string, unknown>;
    if (body.action === "search") {
      assertDomainSearchEnabled(config);
      return NextResponse.json(
        {
          ok: true,
          results: await searchVercelDomains(String(body.input ?? "")),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (["purchase", "renewal", "authorize_dns"].includes(String(body.action)))
      assertLiveDomainOperationAllowed();
    if (body.action === "existing") {
      const normalized = normalizeDomain(String(body.fqdn ?? ""));
      const supabase = await createClient();
      let websiteId: string | null = null;
      if (body.projectId !== undefined) {
        const projectId = z.string().uuid().parse(body.projectId);
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("organization_id", ctx.organization.id)
          .single();
        if (projectError || !project)
          throw new DomainEngineError(
            "project_unavailable",
            "Choose a project in your account.",
            403,
          );
        const { data: website, error: websiteError } = await supabase
          .from("websites")
          .select("id")
          .eq("project_id", projectId)
          .eq("organization_id", ctx.organization.id)
          .maybeSingle();
        if (websiteError) throw new Error();
        websiteId = website?.id ?? null;
      }
      const { data: prior, error: priorError } = await supabase
        .from("domains")
        .select("id,status,website_id")
        .eq("organization_id", ctx.organization.id)
        .eq("hostname", normalized.fqdn)
        .maybeSingle();
      if (priorError) throw new Error();
      if (prior?.website_id && websiteId && prior.website_id !== websiteId)
        throw new DomainEngineError(
          "domain_project_conflict",
          "This domain already belongs to another website. Ask Vigil to review the connection.",
          409,
        );
      if (prior && !prior.website_id && websiteId) {
        const { error } = await supabase
          .from("domains")
          .update({ website_id: websiteId })
          .eq("id", prior.id)
          .eq("organization_id", ctx.organization.id);
        if (error) throw new Error();
      }
      let domainId = prior?.id;
      if (!domainId) {
        const { data, error } = await supabase
          .from("domains")
          .insert({
            organization_id: ctx.organization.id,
            hostname: normalized.fqdn,
            website_id: websiteId,
            kind: domainKind(normalized.fqdn),
            source: "customer_owned",
            status: "pending",
          })
          .select("id")
          .single();
        if (error) throw new Error();
        domainId = data.id;
      }
      const discovery = await detectRegistrar(normalized.fqdn);
      const { error: supportError } = await supabase.rpc(
        "request_domain_assistance",
        { p_domain_id: domainId },
      );
      if (supportError)
        throw new DomainEngineError(
          "domain_assistance_unavailable",
          "Your domain was saved, but the assistance request needs a retry.",
          503,
        );
      await logAuditEvent(supabase, {
        action: "domain.assistance_requested",
        organizationId: ctx.organization.id,
        entityType: "domain",
        entityId: domainId,
        after: {
          hostname: normalized.fqdn,
          dns_provider: discovery.registrar,
          via: "domain-engine-v2",
        },
      });
      return NextResponse.json(
        {
          ok: true,
          existing: {
            id: domainId,
            fqdn: normalized.fqdn,
            status:
              prior?.status === "connected"
                ? "ready_for_launch"
                : "assistance_required",
            supported: false,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (body.action === "transfer") {
      if (ctx.isImpersonating)
        throw new DomainEngineError(
          "owner_required",
          "The customer owner must request domain release.",
          403,
        );
      const client = await createClient();
      const registrationId = z.string().uuid().parse(body.registrationId);
      const { error } = await client.rpc("request_domain_release", {
        p_registration_id: registrationId,
      });
      if (error)
        throw new DomainEngineError(
          "release_request_failed",
          "The domain owner must request release of their managed registration.",
          403,
        );
      return NextResponse.json(
        { ok: true, transferRequested: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (body.action === "status") {
      const client = await createClient();
      const { data: order, error } = await client
        .from("domain_orders")
        .select(
          "*,domain_quotes(total_minor,currency),domain_registrations(expires_at,renewal_mode,contact_verification,registration_status)",
        )
        .eq("organization_id", ctx.organization.id)
        .eq("environment", "live")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error)
        throw new DomainEngineError(
          "domain_status_unavailable",
          "Domain status could not be loaded. Please try again.",
          503,
        );
      if (!order)
        return NextResponse.json(
          { ok: true, order: null },
          { headers: { "Cache-Control": "no-store" } },
        );
      const asset = order.domain_registrations;
      return NextResponse.json(
        {
          ok: true,
          registrationId: order.registration_id,
          order: {
            id: order.id,
            fqdn: order.fqdn,
            totalMinor: order.domain_quotes.total_minor,
            currency: order.domain_quotes.currency,
            registrationState: order.registration_state,
            paymentState: order.payment_state,
            connectionState: order.connection_state,
            reason: order.reason_code,
          },
          registration: asset
            ? {
                status: asset.registration_status,
                expiresAt: asset.expires_at,
                autoRenew: asset.renewal_mode === "auto",
                contactVerification: asset.contact_verification,
              }
            : null,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    throw new DomainEngineError(
      "domain_action_unavailable",
      "This domain action is awaiting service approval.",
      403,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError
            ? error.message
            : "The domain request could not be completed. Please try again.",
      },
      { status: error instanceof DomainEngineError ? error.status : 422 },
    );
  }
}
