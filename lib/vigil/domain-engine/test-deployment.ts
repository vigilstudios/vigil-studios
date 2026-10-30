import "server-only";
import type { DeploymentProvider } from "@/lib/vigil/providers/types";
import { assertDomainTestDatabase } from "./runtime";
import { DomainEngineError } from "./errors";
import { normalizeDomain } from "./normalize";

/** Read-only fixture recommendations. This object cannot create projects, deploy or attach names. */
export function domainTestDeploymentProvider(): DeploymentProvider {
  assertDomainTestDatabase();
  const denied = async (): Promise<never> => {
    throw new DomainEngineError(
      "test_deployment_disabled",
      "Use the established review and Deploy Live workflow.",
      403,
    );
  };
  return {
    name: "mock",
    provisionSite: denied,
    triggerDeployment: denied,
    getDeployment: denied,
    addDomain: denied,
    removeDomain: denied,
    getDomainConfig: denied,
    deleteSite: denied,
    async getRecommendedDnsRecords(siteId, hostname) {
      assertDomainTestDatabase();
      if (!/^mock-domain-site:[0-9a-f-]{36}$/.test(siteId))
        throw new DomainEngineError(
          "test_site_missing",
          "Choose the isolated test website preview.",
          409,
        );
      const name = normalizeDomain(hostname);
      return name.fqdn === name.registrableDomain
        ? [{ type: "A", name: name.fqdn, value: "76.76.21.21" }]
        : [
            {
              type: "CNAME",
              name: name.fqdn,
              value: "fixture.vercel-dns-017.com",
            },
          ];
    },
  };
}
