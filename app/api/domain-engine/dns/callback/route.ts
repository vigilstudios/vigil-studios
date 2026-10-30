import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertDomainTestDatabase } from "@/lib/vigil/domain-engine/runtime";
// Test callbacks only until template onboarding and a release have been approved.
export async function GET(request: NextRequest) {
  try {
    assertDomainTestDatabase();
    const ctx = await requireOrgContextOrThrow();
    await assertOrgRole(ctx, ["owner", "manager"]);
    if (ctx.isImpersonating) throw new Error();
    const id = z
      .string()
      .uuid()
      .parse(request.nextUrl.searchParams.get("request"));
    const nonce = z
      .string()
      .regex(/^[A-Za-z0-9_-]{43}$/)
      .parse(request.nextUrl.searchParams.get("nonce"));
    const admin = createAdminClient();
    const { data: authorization, error: readError } = await admin
      .from("dns_authorizations")
      .select("environment")
      .eq("id", id)
      .eq("organization_id", ctx.organization.id)
      .single();
    if (readError || authorization?.environment !== "test") throw new Error();
    const { error } = await admin.rpc("consume_domain_dns_callback", {
      p_authorization_id: id,
      p_organization_id: ctx.organization.id,
      p_nonce_digest: createHash("sha256").update(nonce).digest("hex"),
      p_approved: !request.nextUrl.searchParams.has("error"),
    });
    if (error) throw new Error();
    const destination = new URL("/dashboard/domain", request.url);
    destination.searchParams.set("dns", "verification_pending");
    const response = NextResponse.redirect(destination, 303);
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "This DNS authorization is unavailable, expired or already handled.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }
}
