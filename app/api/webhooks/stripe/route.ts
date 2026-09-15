import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { ProviderError } from "@/lib/vigil/auth/errors";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
import { receiveBillingEvent } from "@/lib/vigil/services/webhook";
import type { BillingEvent } from "@/lib/vigil/providers/types";

export const dynamic = "force-dynamic";

/**
 * Billing webhook. The provider verifies the signature and normalizes the
 * event; receiveBillingEvent records it (idempotent) and handles it. A
 * failure returns 500 so the provider retries.
 */
export async function POST(request: NextRequest) {
  if (!hasAdminClient()) return NextResponse.json({ error: "service role not configured" }, { status: 503 });
  const provider = getBillingProvider();
  const rawBody = await request.text();

  let event: BillingEvent;
  try {
    event = await provider.parseWebhook(rawBody, request.headers.get("stripe-signature"));
  } catch (err) {
    const status = err instanceof ProviderError ? err.status : 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "bad webhook" }, { status });
  }

  try {
    const result = await receiveBillingEvent(createAdminClient(), event, provider);
    return NextResponse.json(result.duplicate ? { received: true, duplicate: true } : { received: true, outcome: result.outcome });
  } catch (err) {
    console.error("webhook handling failed:", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}
