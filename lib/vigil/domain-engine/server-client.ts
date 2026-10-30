import "server-only";
import { DomainEngineError } from "./errors";
import { normalizeDomain } from "./normalize";

/** Read-only allowlist; buying, renewal, transfer and DNS mutations are not representable. */
export class VercelRegistrarReadClient {
  constructor(private readonly request: typeof fetch = fetch) {}
  async search(domains: string[], years = 1): Promise<unknown> {
    if (years !== 1 || domains.length < 1 || domains.length > 20)
      throw new DomainEngineError(
        "invalid_search",
        "Search up to twenty domains for a one-year term.",
      );
    return this.call("/v1/registrar/domains/search", {
      domains: domains.map(
        (domain) => normalizeDomain(domain, { registration: true }).fqdn,
      ),
    });
  }
  async contactSchema(domain: string): Promise<unknown> {
    return this.call(
      `/v1/registrar/domains/${encodeURIComponent(normalizeDomain(domain, { registration: true }).fqdn)}/contact-info/schema`,
    );
  }
  private async call(path: string, body?: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await this.request(new URL(path, "https://api.vercel.com"), {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new DomainEngineError(
        "domain_provider_unavailable",
        "Domain information is temporarily unavailable. Try again shortly.",
        503,
      );
    }
    // Never surface a raw error payload or URL to the client or application logs.
    if (!response.ok)
      throw new DomainEngineError(
        response.status === 429
          ? "domain_rate_limited"
          : "domain_provider_unavailable",
        "Domain information is temporarily unavailable. Try again shortly.",
        response.status === 429 ? 429 : 503,
      );
    const length = Number(response.headers.get("content-length"));
    if (length > 1_000_000)
      throw new DomainEngineError(
        "domain_provider_response",
        "Domain information could not be read.",
        502,
      );
    try {
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > 1_000_000) {
          await reader.cancel();
          throw new Error();
        }
        chunks.push(next.value);
      }
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new DomainEngineError(
        "domain_provider_response",
        "Domain information could not be read.",
        502,
      );
    }
  }
}
