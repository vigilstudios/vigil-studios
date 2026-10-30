import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { NextResponse, type NextRequest } from "next/server";
import { domainTestPrice } from "@/lib/vigil/domain-engine/test-pricing";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { isSameOriginRequest, requestOrigin } from "@/lib/vigil/auth/origin";
import {
  assertDomainTestDatabase,
  runDomainPurchase,
  domainTestPayments,
} from "@/lib/vigil/domain-engine/runtime";
import { prepareTestDomainCheckout } from "@/lib/vigil/domain-engine/test-checkout";
import { domainTestRegistrar } from "@/lib/vigil/domain-engine/test-registrar";
import { syncManagedRegistration } from "@/lib/vigil/domain-engine/registrar-sync";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import { domainCandidates } from "@/lib/vigil/domain-engine/search";
import { SupabaseDomainOrderStore } from "@/lib/vigil/domain-engine/store";
import { enqueueJob, JOB_KINDS } from "@/lib/vigil/jobs";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";

export async function POST(request: NextRequest) {
  try {
    assertDomainTestDatabase();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isSameOriginRequest(request))
      throw new DomainEngineError(
        "invalid_origin",
        "Open this test page directly.",
        403,
      );
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner"]);
    if (ctx.isImpersonating)
      throw new DomainEngineError(
        "customer_consent_required",
        "Test payment consent must come from the customer owner account.",
        403,
      );
    await enforceRateLimit(`domain-test:${ctx.organization.id}`, {
      limit: 30,
      windowSeconds: 3600,
    });
    const raw = await boundedDomainBody(request, 16000);
    if (Buffer.byteLength(raw) > 16000)
      throw new DomainEngineError(
        "request_too_large",
        "The request is too large.",
        413,
      );
    const body = JSON.parse(raw) as Record<string, unknown>;
    const admin = createAdminClient();
    const registrar = domainTestRegistrar(admin);
    if (body.action === "search") {
      const results = await registrar.searchAndPrice(
        domainCandidates(String(body.input ?? "")),
      );
      const { data: managed, error: managedError } = await admin
        .from("domain_registrations")
        .select("fqdn")
        .eq("environment", "test")
        .neq("registration_status", "released")
        .in(
          "fqdn",
          results.map((row) => row.fqdn),
        );
      if (managedError)
        throw new DomainEngineError(
          "domain_status_unavailable",
          "Domain availability could not be confirmed.",
          503,
        );
      const names = new Set((managed ?? []).map((row) => row.fqdn));
      return NextResponse.json({
        ok: true,
        results: results.map((row) =>
          names.has(row.fqdn)
            ? {
                ...row,
                availability: "unavailable",
                registration: null,
                renewal: null,
              }
            : row.registration
              ? {
                  ...row,
                  registration: {
                    ...row.registration,
                    amountMinor: domainTestPrice(row.registration.amountMinor)
                      .totalMinor,
                  },
                }
              : row,
        ),
      });
    }
    if (body.action === "quote") {
      const [quote] = await registrar.searchAndPrice([String(body.fqdn ?? "")]);
      if (!quote.registration || quote.availability !== "available")
        throw new DomainEngineError(
          "domain_unavailable",
          "Choose an available test domain.",
        );
      const price = domainTestPrice(quote.registration.amountMinor);
      const { data: id, error } = await admin.rpc("create_domain_quote", {
        p_organization_id: ctx.organization.id,
        p_quote: {
          fqdn: quote.fqdn,
          registrar: registrar.name,
          environment: "test",
          years: quote.years,
          currency: "usd",
          subtotal_minor: price.subtotalMinor,
          tax_minor: 0,
          total_minor: price.totalMinor,
          renewal_estimate_minor: quote.renewal?.amountMinor ?? null,
          premium: quote.premium,
          expires_at: quote.expiresAt,
        },
        p_registrar_cost: quote.registration.amountMinor,
      });
      if (error || !id)
        throw new DomainEngineError(
          "test_quote_failed",
          "The test quote could not be saved.",
        );
      return NextResponse.json({
        ok: true,
        quote: {
          ...quote,
          ...price,
          registration: {
            ...quote.registration,
            amountMinor: price.totalMinor,
          },
          id,
          contactSchema: await registrar.getContactSchema(quote.fqdn, "US"),
        },
      });
    }
    if (body.action === "purchase") {
      const result = await prepareTestDomainCheckout(
        admin,
        ctx.organization.id,
        ctx.user.id,
        body.approval,
        `${requestOrigin(request)}/domain-engine-test`,
      );
      return NextResponse.json({ ok: true, ...result });
    }
    if (
      !["status", "reconcile", "resume_checkout"].includes(String(body.action))
    )
      throw new DomainEngineError(
        "invalid_action",
        "Choose a supported test action.",
      );
    const id =
      body.orderId === undefined ? null : z.string().uuid().parse(body.orderId);
    const client = await createClient();
    let query = client
      .from("domain_orders")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .eq("environment", "test");
    if (id) query = query.eq("id", id);
    const { data: order, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || (!order && id))
      throw new DomainEngineError(
        "order_not_found",
        "The domain order was not found.",
        404,
      );
    if (!order) return NextResponse.json({ ok: true, order: null });
    if (body.action === "resume_checkout") {
      const context = await new SupabaseDomainOrderStore(admin).load(order.id);
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        ...(await domainTestPayments().resumeCheckout(context)),
      });
    }
    if (body.action === "reconcile") {
      await enqueueJob(admin, {
        kind: JOB_KINDS.domainPurchase,
        idempotencyKey: `domain.purchase:${order.id}`,
        organizationId: ctx.organization.id,
        payload: { domain_order_id: order.id },
        maxAttempts: 200,
        requeueFailed: true,
      });
      await runDomainPurchase(admin, order.id);
    }
    const { data: initial, error: readError } = await client
      .from("domain_orders")
      .select("*,domain_quotes(total_minor,currency)")
      .eq("id", order.id)
      .eq("organization_id", ctx.organization.id)
      .single();
    let current = initial;
    if (readError || !current) throw new Error();
    if (
      body.action === "reconcile" &&
      current.registration_id &&
      registrar.name === "namecom"
    ) {
      await syncManagedRegistration(
        admin,
        current.registration_id,
        ctx.organization.id,
      );
      const fresh = await client
        .from("domain_orders")
        .select("*,domain_quotes(total_minor,currency)")
        .eq("id", current.id)
        .eq("organization_id", ctx.organization.id)
        .single();
      if (fresh.error || !fresh.data) throw new Error();
      current = fresh.data;
    }
    const { data: registration, error: registrationError } =
      current.registration_id
        ? await client
            .from("domain_registrations")
            .select(
              "expires_at,renewal_mode,contact_verification,registration_status",
            )
            .eq("id", current.registration_id)
            .eq("organization_id", ctx.organization.id)
            .maybeSingle()
        : { data: null, error: null };
    if (registrationError) throw new Error();
    return NextResponse.json({
      ok: true,
      registrationId: current.registration_id,
      registration: registration
        ? {
            status: registration.registration_status,
            expiresAt: registration.expires_at,
            autoRenew: registration.renewal_mode === "auto",
            contactVerification: registration.contact_verification,
          }
        : null,
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError
            ? error.message
            : "The test domain request could not be completed.",
      },
      { status: error instanceof DomainEngineError ? error.status : 422 },
    );
  }
}
