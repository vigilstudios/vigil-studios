import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import {
  findExternalId,
  providerEnum,
} from "@/lib/vigil/services/provider-links";
import { managedDomainConfigs } from "@/lib/vigil/services/domain";
import { normalizeDomain } from "./normalize";
import { validatedWebsiteDnsRecords } from "./cloudflare-dns";
import { liveUnavailable } from "./live-policy";
import type { ExpectedDnsRecord } from "./contracts";
export async function deploymentWebsiteRecords(
  admin: DbClient,
  provider: DeploymentProvider,
  d: { hostname: string; website_id: string; verification_token: string },
) {
  const site = await findExternalId(admin, {
    provider: providerEnum(provider.name),
    resourceKind: "site",
    entityType: "website",
    entityId: d.website_id,
  });
  if (!site || !provider.getRecommendedDnsRecords)
    throw liveUnavailable(
      "Create the website preview before preparing its connection.",
    );
  const expected: ExpectedDnsRecord[] = [];
  for (const host of managedDomainConfigs(
    d.hostname,
    normalizeDomain(d.hostname).registrableDomain === d.hostname
      ? "apex"
      : "subdomain",
  )) {
    for (const r of await provider.getRecommendedDnsRecords(
      site,
      host.hostname,
    )) {
      if (r.type !== "A" && r.type !== "CNAME")
        throw liveUnavailable(
          "The deployment requires an additional verification record for review.",
        );
      expected.push({ type: r.type, name: r.name, value: r.value, ttl: 300 });
    }
  }
  expected.push({
    type: "TXT",
    name: `_vigil.${d.hostname}`,
    value: `vigil-verify=${d.verification_token}`,
    ttl: 300,
  });
  validatedWebsiteDnsRecords(d.hostname, expected);
  return expected;
}
export function sameWebsiteRecords(
  fqdn: string,
  a: ExpectedDnsRecord[],
  b: ExpectedDnsRecord[],
) {
  const canonical = (r: ExpectedDnsRecord[]) =>
    validatedWebsiteDnsRecords(fqdn, r)
      .map((v) => JSON.stringify(v))
      .sort();
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
