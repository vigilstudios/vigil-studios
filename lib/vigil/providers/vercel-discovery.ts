import "server-only";
import { ProviderError, ValidationError } from "@/lib/vigil/auth/errors";
import { normalizeRegistrationName, type DomainQuote } from "@/lib/vigil/domain-commerce";

/** Public research only: no platform token, account scope, DNS or spending capability. */
export async function searchVercelDomain(input: string, request: typeof fetch = fetch): Promise<DomainQuote> {
  const hostname = normalizeRegistrationName(input);
  if (!hostname) throw new ValidationError("Enter an exact domain like yourbusiness.com, without a link or subdomain.");
  const unavailable = () => new ProviderError("vercel", "Domain search is unavailable. Please retry.", { retryable: true });
  try {
    const response = await request("https://api.vercel.com/v1/registrar/domains/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: [hostname] }), cache: "no-store", signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw unavailable();
    const body = await response.json();
    const row = body?.results?.[0];
    if (!Array.isArray(body?.results) || body.results.length !== 1 || row?.domain !== hostname || typeof row.available !== "boolean") throw unavailable();
    const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
    if (row.available && (!money(row.price) || !money(row.renewalPrice) || !Number.isInteger(row.years) || row.years < 1 || row.years > 10 || typeof row.premium !== "boolean")) throw unavailable();
    return { hostname, available: row.available, currency: "USD", years: row.available ? row.years : null,
      registration: row.available ? row.price : null, renewal: row.available ? row.renewalPrice : null,
      premium: row.available ? row.premium : null, quotedAt: new Date().toISOString() };
  } catch {
    // Never retain or log provider response bodies, tokens or raw exceptions.
    throw unavailable();
  }
}
