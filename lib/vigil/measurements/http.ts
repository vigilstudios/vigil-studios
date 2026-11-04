import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";

export class MeasurementError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MeasurementError";
  }
}
export function publicOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      isIP(url.hostname) ||
      !/^[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i.test(url.hostname) ||
      !url.hostname.includes(".") ||
      /(^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname)
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new MeasurementError("invalid_target");
  }
}
export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return (
      /^[23][\da-f]{3}:/.test(normalized) &&
      !/^2001:(0*:|0?db8:|0?2:|0?1[0-9a-f]:|0?2[0-9a-f]:)/.test(normalized) &&
      !normalized.startsWith("2002:")
    );
  }
  return false;
}

/** Fixed provider endpoints only. Errors never include URLs, secrets, or upstream bodies. */
export async function providerJson(
  url: URL | string,
  init: RequestInit = {},
  request: typeof fetch = fetch,
  timeout = 20_000,
  allowNotFound = false,
): Promise<unknown> {
  let response: Response;
  try {
    response = await request(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new MeasurementError("provider_unavailable");
  }
  if (
    !response.ok &&
    response.status !== 400 &&
    !(allowNotFound && response.status === 404)
  ) {
    await response.body?.cancel();
    throw new MeasurementError(
      response.status === 429
        ? "rate_limited"
        : [401, 403].includes(response.status)
          ? "permission_required"
          : response.status === 402
            ? "plan_required"
            : "provider_unavailable",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw new MeasurementError("invalid_response");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 4_194_304) {
      await reader.cancel();
      throw new MeasurementError("response_too_large");
    }
    chunks.push(value);
  }
  try {
    const result: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (response.status === 400) {
      const code = (result as { error?: { code?: unknown } })?.error?.code;
      throw new MeasurementError(
        code === "web_analytics_not_enabled"
          ? "collection_not_enabled"
          : "invalid_response",
      );
    }
    return result;
  } catch (error) {
    if (error instanceof MeasurementError) throw error;
    throw new MeasurementError("invalid_response");
  }
}

export type PublicResponse = {
  status: number;
  headers: Record<string, string>;
};
/** Pin the resolved public IP. A second DNS lookup cannot redirect a request into a private network. */
export async function publicHeaders(
  origin: string,
  resolve = lookup,
): Promise<PublicResponse> {
  const safe = publicOrigin(origin),
    url = new URL(safe);
  let addresses: { address: string; family: number }[];
  try {
    addresses = await resolve(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new MeasurementError("dns_unavailable");
  }
  if (!addresses.length || addresses.some((row) => !publicAddress(row.address)))
    throw new MeasurementError("private_target");
  const address = addresses[0];
  return new Promise((accept, reject) => {
    const req = httpsRequest(
      {
        hostname: address.address,
        family: address.family,
        servername: url.hostname,
        port: 443,
        path: "/",
        method: "GET",
        agent: false,
        headers: {
          Host: url.hostname,
          "User-Agent": "Vigil-Website-Checks/1.0",
          Accept: "text/html",
        },
        timeout: 10_000,
      },
      (response) => {
        const headers: Record<string, string> = {};
        for (const name of [
          "strict-transport-security",
          "x-content-type-options",
          "content-security-policy",
          "referrer-policy",
          "location",
        ]) {
          const value = response.headers[name];
          if (typeof value === "string") headers[name] = value.slice(0, 4096);
        }
        accept({ status: response.statusCode ?? 0, headers });
        response.destroy();
        req.destroy();
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", () => reject(new MeasurementError("https_unavailable")));
    req.end();
  });
}
