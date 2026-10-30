import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { isSameOriginRequest, requestOrigin } from "@/lib/vigil/auth/origin";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";
import {
  assertDomainLiveRuntime,
  liveUnavailable,
  loadLivePolicy,
  publicDomainPolicy,
} from "@/lib/vigil/domain-engine/live-policy";
import {
  searchLiveDomains,
  quoteLiveDomain,
  prepareLiveCheckout,
  runLiveDomainPurchase,
  calculateLiveDomainQuote,
} from "@/lib/vigil/domain-engine/live-runtime";
import { LiveDomainOrderStore } from "@/lib/vigil/domain-engine/store";
import { livePayments } from "@/lib/vigil/domain-engine/live-providers";
import { syncManagedRegistration } from "@/lib/vigil/domain-engine/registrar-sync";
import { usTaxAddressSchema } from "@/lib/vigil/domain-engine/tax";
import { isVigilError } from "@/lib/vigil/auth/errors";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
const schema = z
  .object({
    action: z.enum([
      "search",
      "quote",
      "tax_quote",
      "purchase",
      "status",
      "reconcile",
      "resume_checkout",
      "support",
    ]),
    websiteId: z.string().uuid(),
    input: z.string().max(253).optional(),
    fqdn: z.string().max(253).optional(),
    approval: z.unknown().optional(),
    orderId: z.string().uuid().optional(),
    quoteId: z.string().uuid().optional(),
    address: usTaxAddressSchema.optional(),
    kind: z
      .enum([
        "renewal",
        "release",
        "contact_verification",
        "payment_reconciliation",
      ])
      .optional(),
  })
  .strict();
export async function POST(request: NextRequest) {
  try {
    assertDomainLiveRuntime();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isSameOriginRequest(request))
      throw liveUnavailable("Open your Vigil dashboard directly.");
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner"]);
    if (ctx.isImpersonating)
      throw liveUnavailable(
        "The customer owner must approve domain operations.",
      );
    const text = await boundedDomainBody(request, 16000);
    if (Buffer.byteLength(text) > 16000)
      throw new DomainEngineError(
        "request_too_large",
        "The request is too large.",
        413,
      );
    const body = schema.parse(JSON.parse(text)),
      admin = createAdminClient();
    await enforceRateLimit(
      `domain-live:${body.action === "status" ? "status" : "actions"}:${ctx.organization.id}`,
      { limit: body.action === "status" ? 600 : 40, windowSeconds: 3600 },
    );
    const { data: website, error: websiteError } = await admin
      .from("websites")
      .select("id")
      .eq("id", body.websiteId)
      .eq("organization_id", ctx.organization.id)
      .single();
    if (websiteError || !website) throw liveUnavailable();
    if (body.action === "search")
      return NextResponse.json(
        {
          ok: true,
          results: await searchLiveDomains(
            admin,
            ctx.organization.id,
            body.websiteId,
            body.input ?? "",
            ctx.user.id,
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (body.action === "quote")
      return NextResponse.json(
        {
          ok: true,
          quote: await quoteLiveDomain(
            admin,
            ctx.organization.id,
            body.websiteId,
            body.fqdn ?? "",
            ctx.user.id,
          ),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (body.action === "tax_quote") {
      if (!body.quoteId || !body.address) throw liveUnavailable("Confirm your US address before calculating the final price.");
      return NextResponse.json({ ok: true, quote: await calculateLiveDomainQuote(admin, ctx.organization.id, body.websiteId, ctx.user.id, body.quoteId, body.address) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "purchase") {
      const quoteId = z
        .object({ quoteId: z.string().uuid() })
        .parse(body.approval).quoteId;
      const { data: q } = await admin
        .from("domain_quotes")
        .select("id")
        .eq("id", quoteId)
        .eq("website_id", body.websiteId)
        .eq("organization_id", ctx.organization.id)
        .eq("environment", "live")
        .single();
      if (!q) throw liveUnavailable();
      return NextResponse.json(
        {
          ok: true,
          ...(await prepareLiveCheckout(
            admin,
            ctx.organization.id,
            ctx.user.id,
            body.approval,
            `${requestOrigin(request)}/dashboard/domain?flow=find&website=${body.websiteId}`,
          )),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const client = await createClient();
    let query = client
      .from("domain_orders")
      .select(
        "*,domain_quotes!inner(total_minor,currency,website_id,live_policy_id)",
      )
      .eq("organization_id", ctx.organization.id)
      .eq("environment", "live")
      .eq("domain_quotes.website_id", body.websiteId);
    if (body.orderId) query = query.eq("id", body.orderId);
    const { data: order, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw liveUnavailable();
    if (!order) {
      if (body.orderId) throw liveUnavailable();
      return NextResponse.json(
        { ok: true, order: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (body.action === "support") {
      if (!order.registration_id || !body.kind) throw liveUnavailable();
      const { error: supportError } = await admin.rpc(
        "request_managed_domain_support",
        {
          p_registration_id: order.registration_id,
          p_actor_id: ctx.user.id,
          p_kind: body.kind,
        },
      );
      if (supportError)
        throw liveUnavailable("The support request could not be saved.");
    }
    if (body.action === "resume_checkout")
      return NextResponse.json(
        {
          ok: true,
          orderId: order.id,
          ...(await (
            await livePayments(admin)
          ).resumeCheckout(
            await new LiveDomainOrderStore(admin).load(order.id),
          )),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (body.action === "reconcile") {
      await enqueueJob(admin, {
        kind: JOB_KINDS.domainPurchase,
        idempotencyKey: `domain.purchase:${order.id}`,
        organizationId: ctx.organization.id,
        payload: { domain_order_id: order.id },
        maxAttempts: 200,
        requeueFailed: true,
      });
      await runLiveDomainPurchase(admin, order.id);
      const { data: fresh } = await admin
        .from("domain_orders")
        .select("registration_id")
        .eq("id", order.id)
        .eq("organization_id", ctx.organization.id)
        .single();
      if (fresh?.registration_id)
        await syncManagedRegistration(
          admin,
          fresh.registration_id,
          ctx.organization.id,
        );
    }
    const { data: current, error: currentError } = await client
      .from("domain_orders")
      .select("*,domain_quotes(total_minor,currency,live_policy_id)")
      .eq("id", order.id)
      .eq("organization_id", ctx.organization.id)
      .single();
    if (currentError || !current) throw liveUnavailable();
    const { data: asset, error: assetError } = current.registration_id
      ? await client
          .from("domain_registrations")
          .select(
            "registration_status,expires_at,renewal_mode,contact_verification",
          )
          .eq("id", current.registration_id)
          .eq("organization_id", ctx.organization.id)
          .single()
      : { data: null, error: null };
    if (assetError) throw liveUnavailable();
    const p = await loadLivePolicy(
      admin,
      ctx.organization.id,
      body.websiteId,
      current.fqdn,
      current.domain_quotes.live_policy_id ?? undefined,
      false,
    );
    const { data: support, error: supportError } = current.registration_id
      ? await client
          .from("domain_support_requests")
          .select("kind")
          .eq("registration_id", current.registration_id)
          .eq("organization_id", ctx.organization.id)
          .neq("status", "resolved")
      : { data: [], error: null };
    if (supportError) throw liveUnavailable();
    return NextResponse.json(
      {
        ok: true,
        transferRequested: support?.some((s) => s.kind === "release") ?? false,
        registrationId: current.registration_id,
        policy: publicDomainPolicy(p),
        order: {
          id: current.id,
          fqdn: current.fqdn,
          totalMinor: current.domain_quotes.total_minor,
          currency: current.domain_quotes.currency,
          registrationState: current.registration_state,
          paymentState: current.payment_state,
          connectionState: current.connection_state,
          reason: current.reason_code,
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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError || isVigilError(error)
            ? error.message
            : "The domain operation could not finish. Your existing order is preserved.",
      },
      {
        status: error instanceof DomainEngineError || isVigilError(error) ? error.status : 422,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export const maxDuration = 120;
