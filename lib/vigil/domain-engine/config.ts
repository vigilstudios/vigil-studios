import "server-only";
import { DomainEngineError } from "./errors";
import type { RegistrarName } from "./contracts";

export type DomainEngineConfig = {
  enabled: boolean;
  searchEnabled: boolean;
  registrar: RegistrarName | "disabled";
  mockAllowed: boolean;
  // Phase 1 deliberately has no environment-variable escape hatch for live writes.
  liveRegistrationEnabled: false;
  livePaymentsEnabled: false;
  dnsWritesEnabled: false;
};

export function readDomainEngineConfig(
  env: Record<string, string | undefined> = process.env,
): DomainEngineConfig {
  const registrar = env.VIGIL_DOMAIN_REGISTRAR ?? "disabled";
  if (
    !["disabled", "mock", "vercel", "openprovider", "namecom"].includes(
      registrar,
    )
  )
    throw new DomainEngineError(
      "domain_configuration",
      "The domain registrar configuration is invalid.",
      503,
    );
  const enabled = env.VIGIL_DOMAIN_ENGINE_ENABLED === "true";
  const production =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  return {
    enabled,
    searchEnabled: enabled && env.VIGIL_DOMAIN_SEARCH_ENABLED === "true",
    registrar: registrar as DomainEngineConfig["registrar"],
    mockAllowed: !production && env.VIGIL_DOMAIN_MOCK_ENABLED === "true",
    liveRegistrationEnabled: false,
    livePaymentsEnabled: false,
    dnsWritesEnabled: false,
  };
}

export function assertDomainSearchEnabled(config: DomainEngineConfig): void {
  if (!config.enabled || !config.searchEnabled)
    throw new DomainEngineError(
      "domain_disabled",
      "Domain search is not enabled yet.",
      503,
    );
}

export function assertMockAllowed(config = readDomainEngineConfig()): void {
  if (!config.enabled || !config.mockAllowed || config.registrar !== "mock")
    throw new DomainEngineError(
      "domain_mock_disabled",
      "Domain simulation is not enabled in this environment.",
      503,
    );
}

export function assertLiveDomainOperationAllowed(): never {
  throw new DomainEngineError(
    "domain_live_operation_disabled",
    "Live domain operations require a separately approved provider and release.",
    403,
  );
}
