import { NextResponse } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { readProviderConfig } from "@/lib/vigil/providers/registry";

export const dynamic = "force-dynamic";

/** Liveness plus which providers are wired. No customer data, no secrets. */
export function GET() {
  return NextResponse.json({
    ok: true,
    supabase: Boolean(getPublicSupabaseEnv()),
    providers: readProviderConfig(),
    time: new Date().toISOString(),
  });
}
