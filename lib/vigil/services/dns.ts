import "server-only";

import { promises as dns } from "node:dns";
import { registrarFromNameservers } from "@/lib/vigil/domain-guides";
import { domainKind, registrableDomain, relativeDnsName } from "@/lib/vigil/domains";
import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";

export type DnsRecord = { type: string; name: string; value: string };

/**
 * DNS helpers that need no provider account. They read public DNS only, so
 * they are safe to call from a customer-triggered action.
 *
 * The platform's own targets are environment configuration
 * (VIGIL_DNS_APEX_A, VIGIL_DNS_CNAME_TARGET, VIGIL_DNS_TXT_PREFIX): the
 * deployment provider overrides them with exact values once a site exists.
 */
export function platformDnsRecords(hostname: string): DnsRecord[] {
  const apexA = process.env.VIGIL_DNS_APEX_A?.trim();
  const cname = process.env.VIGIL_DNS_CNAME_TARGET?.trim();
  if (!apexA && !cname) return [];
  const isApex = domainKind(hostname) === "apex";
  const records: DnsRecord[] = [];
  if (isApex) {
    if (apexA) records.push({ type: "A", name: "@", value: apexA });
    if (cname) records.push({ type: "CNAME", name: "www", value: cname });
  } else if (cname) {
    records.push({ type: "CNAME", name: relativeDnsName(hostname), value: cname });
  } else if (apexA) {
    records.push({ type: "A", name: relativeDnsName(hostname), value: apexA });
  }
  return records;
}

/**
 * The records a customer must add: what the provider (or connect job) stored
 * on the row, else the platform's standard targets. Never empty while the
 * platform targets are configured, so the guide can always be completed.
 */
export function requiredRecords(hostname: string, verification: unknown): DnsRecord[] {
  const stored = ((verification as { required_records?: DnsRecord[] } | null)?.required_records ?? []).filter((r) => r && r.type && r.value);
  return stored.length > 0 ? stored : platformDnsRecords(hostname);
}

function fqdn(hostname: string, name: string): string {
  if (!name || name === "@" || name === hostname) return hostname;
  const zone = registrableDomain(hostname);
  if (name === zone || name.endsWith(`.${zone}`)) return name.replace(/\.$/, "");
  return `${name}.${zone}`;
}

export type DnsCheck = { record: DnsRecord; found: string[]; ok: boolean };

/** The slice of node:dns these helpers use; tests pass a fake. */
export type RecordResolver = {
  resolve4(hostname: string): Promise<string[]>;
  resolve6(hostname: string): Promise<string[]>;
  resolveCname(hostname: string): Promise<string[]>;
  resolveTxt(hostname: string): Promise<string[][]>;
};
export type NsResolver = { resolveNs(hostname: string): Promise<string[]> };

/** Resolve each required record and compare. Never throws; missing = not ok. */
export async function checkDnsRecords(hostname: string, records: DnsRecord[], resolver: RecordResolver = dns): Promise<DnsCheck[]> {
  const out: DnsCheck[] = [];
  for (const record of records) {
    const target = fqdn(hostname, record.name);
    let found: string[] = [];
    try {
      switch (record.type.toUpperCase()) {
        case "A":
          found = await resolver.resolve4(target);
          break;
        case "AAAA":
          found = await resolver.resolve6(target);
          break;
        case "CNAME":
          found = await resolver.resolveCname(target);
          break;
        case "TXT":
          found = (await resolver.resolveTxt(target)).map((chunks) => chunks.join(""));
          break;
        default:
          found = [];
      }
    } catch {
      found = [];
    }
    const want = record.value.toLowerCase().replace(/\.$/, "");
    const ok = found.some((v) => v.toLowerCase().replace(/\.$/, "") === want);
    out.push({ record, found, ok });
  }
  return out;
}

/**
 * A provider can report DNS and certificate configuration before the public
 * hostname is actually serving the site. Confirm the customer-facing HTTPS
 * address answers before exposing it as connected.
 */
export async function checkHttpsReachable(hostname: string, request: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await request(`https://${hostname}`, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

/** Which registrar's default nameservers the domain uses, when it is one we know. */
export async function detectRegistrar(hostname: string, resolver: NsResolver = dns): Promise<{ registrar: RegistrarKey | null; nameservers: string[] }> {
  const apex = registrableDomain(hostname);
  try {
    const nameservers = await resolver.resolveNs(apex);
    return { registrar: registrarFromNameservers(nameservers), nameservers };
  } catch {
    return { registrar: null, nameservers: [] };
  }
}
