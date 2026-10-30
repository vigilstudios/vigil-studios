import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DomainEngineError } from "./errors";

/** Name.com signs the configured full URL and recursively sorted JSON, not timestamp/nonce. */
export function verifyNamecomWebhook(
  raw: string,
  header: string | null,
  token: string,
  subscriptionUrl: string,
  now = new Date(),
) {
  const invalid = () =>
    new DomainEngineError(
      "registrar_signature_invalid",
      "The registrar notification could not be verified.",
      400,
    );
  if (!token || !subscriptionUrl || Buffer.byteLength(raw) > 65536)
    throw invalid();
  const parts =
    /^sha256=([a-f0-9]{64}),([0-9]{10}),([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.exec(
      header ?? "",
    );
  if (!parts || Math.abs(now.getTime() / 1000 - Number(parts[2])) > 300)
    throw invalid();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw invalid();
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw invalid();
  let count = 0;
  function canonical(value: unknown, depth = 0): string {
    if (++count > 5000 || depth > 32) throw invalid();
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) ||
        (Number.isInteger(value) && !Number.isSafeInteger(value)))
    )
      throw invalid();
    if (Array.isArray(value))
      return `[${value.map((item) => canonical(item, depth + 1)).join(",")}]`;
    if (value && typeof value === "object")
      return `{${Object.keys(value)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key], depth + 1)}`,
        )
        .join(",")}}`;
    return JSON.stringify(value);
  }
  const json = canonical(payload);
  const expected = createHmac("sha256", token)
    .update(`${subscriptionUrl}|${json}`)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(parts[1], "hex"))) throw invalid();
  // Deduplicate the signed content, never the unsigned nonce or timestamp.
  // Notifications never authorize mutations; workers re-read saved assets from Name.com.
  return {
    payloadDigest: createHash("sha256")
      .update(`${subscriptionUrl}|${json}`)
      .digest("hex"),
  };
}
