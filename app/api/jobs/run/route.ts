import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { runDueJobs } from "@/lib/vigil/jobs";
import { reconcileContactSetup } from "@/lib/vigil/contact/provision";
import { reconcileOrders } from "@/lib/vigil/services/reconcile";
import { authorizedJobRequest } from "@/lib/vigil/auth/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Drain the provisioning queue, then reconcile orders (skip with
 * ?reconcile=0). Called by Vercel Cron (GET) or by hand (POST).
 * Authenticated with a bearer secret; there is no session here.
 */
function authorized(request: NextRequest): boolean {
  // Vercel Cron sends CRON_SECRET; staff tooling sends VIGIL_JOBS_SECRET. Either opens the door.
  return authorizedJobRequest(request);
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "SUPABASE_SECRET_KEY is not configured" },
      { status: 503 },
    );
  }

  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10),
  );
  const worker = `runner:${process.env.VERCEL_REGION ?? "local"}:${Date.now().toString(36)}`;
  const heartbeatStartedAt = new Date().toISOString();

  try {
    const admin = createAdminClient();
    if (process.env.VIGIL_MEASUREMENTS_ENABLED === "true") {
      const { error } = await admin.from("measurement_runner_health").upsert({runner:"jobs",started_at:heartbeatStartedAt,finished_at:null,status:"running"});
      if (error) console.error("Job heartbeat could not be recorded.");
    }
    await reconcileContactSetup(admin).catch(() => console.error("Contact setup reconciliation could not run; queued jobs will continue."));
    // Disabling DNS admission must not extend the lifetime of saved credentials.
    await admin.rpc("expire_external_dns_tokens").then(result=>{if(result.error)console.error("Expired DNS token cleanup needs retry.");});
    const outcomes = await runDueJobs(admin, { worker, limit });
    if(process.env.VIGIL_GOOGLE_CALENDAR_ENABLED === "true") {
      const {syncBookingCalendars}=await import("@/lib/vigil/bookings/google/service");
      await syncBookingCalendars().catch(()=>console.error("Booking calendar sync needs retry."));
    }

    const reconcile =
      request.nextUrl.searchParams.get("reconcile") === "0"
        ? null
        : await reconcileOrders(admin).catch((error) => ({
            error: error instanceof Error ? error.message : String(error),
          }));
    let domainSync: unknown = null;
    if (
      process.env.VIGIL_DOMAIN_ENGINE_ENABLED === "true" &&
      process.env.VIGIL_DOMAIN_LIFECYCLE_SYNC_ENABLED === "true"
    ) {
      const { syncManagedRegistrations } =
        await import("@/lib/vigil/domain-engine/registrar-sync");
      domainSync = await syncManagedRegistrations(admin, {environment:process.env.VIGIL_DOMAIN_LIVE_ENABLED === "true" ? "live" : "test"}).catch(() => ({
        error: "domain_registrar_sync_failed",
      }));
    }
    let domainLifecycle: unknown = null;
    if (
      process.env.VIGIL_DOMAIN_ENGINE_ENABLED === "true" &&
      process.env.VIGIL_DOMAIN_LIFECYCLE_NOTIFICATIONS_ENABLED === "true"
    ) {
      const { reconcileDomainLifecycle } =
        await import("@/lib/vigil/domain-engine/lifecycle");
      domainLifecycle = await reconcileDomainLifecycle(admin).catch(() => ({
        error: "domain_lifecycle_failed",
      }));
    }
    let domainTax: unknown = null;
    if (process.env.VIGIL_DOMAIN_ENGINE_ENABLED === "true" && process.env.VIGIL_DOMAIN_LIVE_ENABLED === "true") {
      const { reconcileDomainTax } = await import("@/lib/vigil/domain-engine/tax");
      domainTax = await reconcileDomainTax(admin).catch(() => ({ error: "domain_tax_reconciliation_failed" }));
    }
    const domainRecords = process.env.VIGIL_DOMAIN_ENGINE_ENABLED === "true"
      ? await admin.rpc("domain_record_review_queue", { p_limit: 100 }).then(r => r.error ? { error: "domain_records_review_failed" } : { reviewDue: Array.isArray(r.data) ? r.data.length : 0 })
      : null;
    if (process.env.VIGIL_MEASUREMENTS_ENABLED === "true") {
      const { error } = await admin.from("measurement_runner_health").update({finished_at:new Date().toISOString(),status:outcomes.some(row=>row.status==="failed")?"error":"ok"}).eq("runner","jobs").eq("started_at",heartbeatStartedAt);
      if (error) console.error("Job heartbeat completion could not be recorded.");
    }
    return NextResponse.json({
      domainRecords,
      domainTax,
      worker,
      ran: outcomes.length,
      outcomes,
      reconcile,
      domainLifecycle,
      domainSync,
    });
  } catch (error) {
    console.error("job runner failed:", error);
    return NextResponse.json({ error: "runner_failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
