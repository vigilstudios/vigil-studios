import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertDomainTestDatabase } from "@/lib/vigil/domain-engine/runtime";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import {
  assertDomainLiveRuntime,
  liveRegistrarScope,
} from "@/lib/vigil/domain-engine/live-policy";
import { namecomSandboxScope } from "@/lib/vigil/domain-engine/namecom-sandbox";
import { verifyNamecomWebhook } from "@/lib/vigil/domain-engine/namecom-webhook";

export async function handleNamecomWebhook(
  request: NextRequest,
  environment: "test" | "live",
) {
  try {
    if (environment === "test") assertDomainTestDatabase();
    else assertDomainLiveRuntime();
    const config = readDomainEngineConfig();
    if (!config.enabled || config.registrar !== "namecom") throw new Error();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const token =
    environment === "test"
      ? process.env.VIGIL_NAMECOM_SANDBOX_WEBHOOK_TOKEN
      : process.env.VIGIL_NAMECOM_WEBHOOK_TOKEN;
  const url =
    environment === "test"
      ? process.env.VIGIL_NAMECOM_SANDBOX_WEBHOOK_URL
      : process.env.VIGIL_NAMECOM_WEBHOOK_URL;
  if (!token || !url)
    return NextResponse.json(
      { error: "Registrar notifications are not configured." },
      { status: 503 },
    );
  let digest: string, scope: string;
  try {
    // Bounded stream read: do not buffer an arbitrary unauthenticated body.
    const reader = request.body?.getReader();
    if (!reader) throw Error();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 65536) {
        await reader.cancel();
        throw Error();
      }
      chunks.push(next.value);
    }
    digest = verifyNamecomWebhook(
      Buffer.concat(chunks).toString("utf8"),
      request.headers.get("x-namecom-signature"),
      token,
      url,
    ).payloadDigest;
    scope =
      environment === "live"
        ? liveRegistrarScope()
        : namecomSandboxScope(process.env.VIGIL_NAMECOM_SANDBOX_USERNAME ?? "");
  } catch {
    return NextResponse.json(
      { error: "Invalid registrar notification." },
      { status: 400 },
    );
  }
  try {
    const { data, error } = await createAdminClient().rpc(
      "record_managed_domain_signal",
      { p_account_scope: scope, p_payload_digest: digest },
    );
    // A verified account can send a balance event before its first purchase
    // policy exists. There are no managed assets to reconcile in that case.
    // Keep the database's account guard intact; acknowledge only this exact
    // pre-admission condition, never a failed inbox write for an admitted account.
    if (
      environment === "live" &&
      error?.code === "42501" &&
      error.message === "Unknown registrar account"
    )
      return NextResponse.json(
        { received: true, ignored: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (error)
      return NextResponse.json(
        { error: "Registrar notification could not be saved." },
        { status: 503 },
      );
    return NextResponse.json(
      { received: true, duplicate: data !== true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Registrar notification could not be saved." },
      { status: 503 },
    );
  }
}
