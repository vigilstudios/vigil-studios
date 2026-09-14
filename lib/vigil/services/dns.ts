import "server-only";

import { promises as dns } from "node:dns";
import { registrarFromNameservers } from "@/lib/vigil/domain-guides";
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
  const parts = hostname.split(".");
  const isApex = parts.length === 2;
  const records: DnsRecord[] = [];
  if (isApex) {
    if (apexA) records.push({ type: "A", name: "@", value: apexA });
    if (cname) records.push({ type: "CNAME", name: "www", value: cname });
  } else if (cname) {
    records.push({ type: "CNAME", name: parts[0], value: cname });
  } else if (apexA) {
    records.push({ type: "A", name: parts[0], value: apexA });
  }
  return records;
}

function fqdn(hostname: string, name: string): string {
  if (!name || name === "@" || name === hostname) return hostname;
  if (name.endsWith(hostname)) return name;
  return `${name}.${hostname}`;
}

export type DnsCheck = { record: DnsRecord; found: string[]; ok: boolean };

/** Resolve each required record and compare. Never throws; missing = not ok. */
export async function checkDnsRecords(hostname: string, records: DnsRecord[], resolver: Pick<typeof dns, "resolve4" | "resolve6" | "resolveCname" | "resolveTxt"> = dns): Promise<DnsCheck[]> {
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

/** Which registrar's default nameservers the domain uses, when it is one we know. */
export async function detectRegistrar(hostname: string, resolver: Pick<typeof dns, "resolveNs"> = dns): Promise<{ registrar: RegistrarKey | null; nameservers: string[] }> {
  const apex = hostname.split(".").slice(-2).join(".");
  try {
    const nameservers = await resolver.resolveNs(apex);
    return { registrar: registrarFromNameservers(nameservers), nameservers };
  } catch {
    return { registrar: null, nameservers: [] };
  }
}
