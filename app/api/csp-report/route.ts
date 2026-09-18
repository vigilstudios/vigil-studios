import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;

/**
 * Browsers post Content-Security-Policy-Report-Only violations here. The
 * report is summarised into one log line (directive, blocked source, page)
 * so the policy can be tightened from the platform logs before it is
 * enforced. Anyone can post to this URL, so the body is capped and nothing
 * in it is trusted or stored.
 */
export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
  const text = (await request.text()).slice(0, MAX_BODY_BYTES);
  let report: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(text) as { "csp-report"?: Record<string, unknown> } | Record<string, unknown>[];
    report = Array.isArray(parsed) ? ((parsed[0] as { body?: Record<string, unknown> } | undefined)?.body ?? null) : parsed["csp-report"] ?? null;
  } catch {
    report = null;
  }
  if (report) {
    const field = (name: string) => String(report?.[name] ?? "").slice(0, 300);
    console.warn(`[csp] ${field("effective-directive") || field("effectiveDirective") || field("violated-directive")} blocked ${field("blocked-uri") || field("blockedURL")} on ${field("document-uri") || field("documentURL")}`);
  }
  return new NextResponse(null, { status: 204 });
}
