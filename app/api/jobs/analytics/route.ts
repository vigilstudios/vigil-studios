import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { authorizedJobRequest } from "@/lib/vigil/auth/jobs";
import { runMeasurementBatch } from "@/lib/vigil/measurements/service";

export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function GET(request: NextRequest) {
  if (!authorizedJobRequest(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.VIGIL_MEASUREMENTS_ENABLED !== "true")
    return NextResponse.json({ enabled: false });
  if (!hasAdminClient())
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  try {
    return NextResponse.json(
      await runMeasurementBatch(createAdminClient(), { limit: 2 }),
    );
  } catch {
    console.error("Website measurement runner requires attention.");
    return NextResponse.json(
      { error: "measurement_runner_failed" },
      { status: 500 },
    );
  }
}
export const POST = GET;
