import { NextResponse, type NextRequest } from "next/server";
import { DomainEngineError } from "@/lib/vigil/domain-engine/errors";
import {
  assertMockAllowed,
  readDomainEngineConfig,
} from "@/lib/vigil/domain-engine/config";
import {
  createDemoSession,
  parseDemoScenario,
  runDemoAction,
} from "@/lib/vigil/domain-engine/demo";
import { isSameOriginRequest } from "@/lib/vigil/auth/origin";

export async function POST(request: NextRequest) {
  try {
    assertMockAllowed(readDomainEngineConfig());
    if (!isSameOriginRequest(request))
      return NextResponse.json(
        { error: "Open the test workspace directly." },
        { status: 403 },
      );
    if (Number(request.headers.get("content-length")) > 16_000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 16_000)
      throw new DomainEngineError(
        "request_too_large",
        "Request too large.",
        413,
      );
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    let id = request.cookies.get("vigil-domain-demo")?.value;
    if (body.action === "reset" || !id)
      id = createDemoSession(parseDemoScenario(body.scenario));
    const result = await runDemoAction(
      id,
      body.action === "reset" ? { action: "status" } : body,
    );
    const response = NextResponse.json({ ok: true, ...result });
    response.cookies.set("vigil-domain-demo", id, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/api/domain-engine/demo",
      maxAge: 3600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof DomainEngineError
            ? error.message
            : "The test request could not be completed.",
      },
      { status: error instanceof DomainEngineError ? error.status : 422 },
    );
  }
}
