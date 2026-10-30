import "server-only";
import { z } from "zod";
import { DomainEngineError } from "./errors";
import { normalizeDomain } from "./normalize";
import { VercelRegistrarReadClient } from "./server-client";
import type { RegistrarQuote } from "./contracts";

const resultSchema = z.discriminatedUnion("available", [
  z.object({ domain: z.string(), available: z.literal(false) }),
  z.object({
    domain: z.string(),
    available: z.literal(true),
    years: z.number().int().positive(),
    price: z.number().finite().nonnegative(),
    renewalPrice: z.number().finite().nonnegative(),
    premium: z.boolean(),
  }),
]);

export function domainCandidates(input: string): string[] {
  const value = input.trim();
  if (value.includes("."))
    return [normalizeDomain(value, { registration: true }).fqdn];
  const keyword = value.toLowerCase().replace(/\s+/g, "-");
  if (!/^[a-z0-9][a-z0-9-]{0,50}[a-z0-9]$/.test(keyword))
    throw new DomainEngineError(
      "invalid_domain",
      "Enter a domain or a business name using letters and numbers.",
    );
  return ["com", "net", "org"].map(
    (tld) => normalizeDomain(`${keyword}.${tld}`, { registration: true }).fqdn,
  );
}

export async function searchVercelDomains(
  input: string,
  client = new VercelRegistrarReadClient(),
): Promise<RegistrarQuote[]> {
  const names = domainCandidates(input);
  const payload = z
    .object({ results: z.array(resultSchema) })
    .safeParse(await client.search(names));
  if (!payload.success || payload.data.results.length !== names.length)
    throw new DomainEngineError(
      "domain_provider_response",
      "Domain information could not be confirmed. Try again.",
      502,
    );
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  return payload.data.results.map((item, index) => {
    if (normalizeDomain(item.domain).fqdn !== names[index])
      throw new DomainEngineError(
        "domain_provider_response",
        "Domain information could not be confirmed. Try again.",
        502,
      );
    if (!item.available)
      return {
        fqdn: names[index],
        availability: "unavailable",
        registration: null,
        renewal: null,
        premium: false,
        years: 1,
        expiresAt,
      };
    if (item.years !== 1)
      throw new DomainEngineError(
        "domain_provider_response",
        "The registration term could not be confirmed.",
        502,
      );
    return {
      fqdn: names[index],
      availability: "available",
      registration: { amountMinor: usdMinor(item.price), currency: "usd" },
      renewal: { amountMinor: usdMinor(item.renewalPrice), currency: "usd" },
      premium: item.premium,
      years: 1,
      expiresAt,
    };
  });
}

function usdMinor(amount: number): number {
  const minor = Math.round(amount * 100);
  if (
    !Number.isSafeInteger(minor) ||
    minor < 0 ||
    minor > 100_000_000 ||
    Math.abs(amount * 100 - minor) > 0.00001
  )
    throw new DomainEngineError(
      "invalid_domain_price",
      "The domain price could not be confirmed.",
      502,
    );
  return minor;
}
