import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { runDueJobs } from "@/lib/vigil/jobs";

export const dynamic = "force-dynamic";

/**
 * Drain the provisioning queue. Called by Vercel Cron (GET) or by hand
 * (POST). Authenticated with a bearer secret; there is no session here.
 */
function authorized(request: NextRequest): boolean {
  // Vercel Cron sends CRON_SECRET; staff tooling sends VIGIL_JOBS_SECRET. Either opens the door.
  const secrets = [process.env.VIGIL_JOBS_SECRET, process.env.CRON_SECRET].filter((s): s is string => Boolean(s));
  if (secrets.length === 0) return false;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return secrets.some((secret) => {
    const expected = Buffer.from(`Bearer ${secret}`);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  });
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not configured" }, { status: 503 });
  }

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10));
  const worker = `runner:${process.env.VERCEL_REGION ?? "local"}:${Date.now().toString(36)}`;

  try {
    const outcomes = await runDueJobs(createAdminClient(), { worker, limit });
    return NextResponse.json({ worker, ran: outcomes.length, outcomes });
  } catch (error) {
    console.error("job runner failed:", error);
    return NextResponse.json({ error: "runner_failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
