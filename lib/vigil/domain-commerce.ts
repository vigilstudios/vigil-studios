import { parse } from "tldts";

/** Exact registrable names only; URLs, ports, paths and subdomains are not searches. */
export function normalizeRegistrationName(input: string): string | null {
  const raw = input.trim().replace(/\.$/, "");
  if (!raw || /[\s/:@?#\\%]/u.test(raw)) return null;
  let name: string;
  try { name = new URL(`https://${raw}`).hostname.toLowerCase(); } catch { return null; }
  if (!name || name.length > 253 || !name.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  const result = parse(name, { allowPrivateDomains: false });
  return result.isIcann && result.domain === name ? name : null;
}

export function vercelDomainUrl(name: string): string {
  const hostname = normalizeRegistrationName(name);
  if (!hostname) throw new Error("Invalid registration name");
  const url = new URL("https://vercel.com/domains/search");
  url.searchParams.set("q", hostname);
  return url.toString();
}

export type DomainQuote = {
  hostname: string; available: boolean; currency: "USD"; years: number | null;
  registration: number | null; renewal: number | null; premium: boolean | null; quotedAt: string;
};
export type DomainIntent = {
  id: string; websiteId: string; hostname: string; version: number;
  phase: "handoff_started" | "action_required" | "cancelled";
  handoffAt: string; quote: DomainQuote | null;
};
export const QUOTE_MAX_AGE_MS = 10 * 60_000;
export function quoteIsFresh(quote: DomainQuote, now = Date.now()): boolean {
  const age = now - Date.parse(quote.quotedAt);
  return Number.isFinite(age) && age >= 0 && age <= QUOTE_MAX_AGE_MS;
}
