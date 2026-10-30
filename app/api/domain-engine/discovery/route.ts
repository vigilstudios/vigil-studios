import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrgContextOrThrow } from "@/lib/vigil/auth/session";
import { isVigilError } from "@/lib/vigil/auth/errors";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";
import { enforceRateLimit } from "@/lib/vigil/rate-limit";
import { boundedDomainBody } from "@/lib/vigil/domain-engine/request-body";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { discoverProductionDomains } from "@/lib/vigil/domain-engine/discovery";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
const bodySchema = z.object({ action: z.enum(["search", "quote"]), websiteId: z.string().uuid(), input: z.string().max(253).optional(), fqdn: z.string().max(253).optional() }).strict();
export async function POST(request: NextRequest) {
  const config = readDomainEngineConfig();
  if (!config.enabled || !config.searchEnabled || config.registrar !== "namecom") return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Open your Vigil dashboard directly." }, { status: 403 });
    const ctx = await requireOrgContextOrThrow();
    const body = bodySchema.parse(JSON.parse(await boundedDomainBody(request, 2000)));
    const admin = createAdminClient();
    const { data, error } = await admin.from("websites").select("id").eq("id", body.websiteId).eq("organization_id", ctx.organization.id).single();
    if (error || !data) return NextResponse.json({ error: "Website unavailable." }, { status: 404 });
    await enforceRateLimit(`domain-discovery:${ctx.organization.id}`, { limit: 40, windowSeconds: 3600 });
    const results = await discoverProductionDomains(admin, body.action === "quote" ? body.fqdn ?? "" : body.input ?? "", body.action === "quote");
    if (body.action === "quote" && results[0]?.availability !== "available") throw new DomainEngineError("domain_unavailable", "This name is no longer available. Search again.", 409);
    return NextResponse.json(body.action === "quote" ? { ok: true, quote: { ...results[0], id: "discovery-only" } } : { ok: true, results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isVigilError(error))
      return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ error: error instanceof DomainEngineError ? error.message : "Domain search could not be completed." }, { status: error instanceof DomainEngineError ? error.status : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 503 });
  }
}
