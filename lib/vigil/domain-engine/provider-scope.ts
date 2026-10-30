import "server-only";
import type { DomainEnvironment, RegistrarName } from "./contracts";
import { DomainEngineError } from "./errors";
import { namecomAccountScope } from "./namecom-production";
import { namecomSandboxScope } from "./namecom-sandbox";
export function domainRegistrarAccountScope(
  registrar: RegistrarName,
  environment: DomainEnvironment,
  env: Record<string, string | undefined> = process.env,
) {
  if (registrar === "mock" && environment === "test") return "mock:test";
  if (registrar === "namecom" && environment === "test")
    return namecomSandboxScope(env.VIGIL_NAMECOM_SANDBOX_USERNAME ?? "");
  if (registrar === "namecom" && environment === "live") return namecomAccountScope(env.VIGIL_NAMECOM_USERNAME ?? "", "live");
  if (
    registrar === "openprovider" &&
    environment === "test" &&
    /^\d+$/.test(env.VIGIL_OPENPROVIDER_SANDBOX_ACCOUNT_ID ?? "")
  )
    return `openprovider:test:${env.VIGIL_OPENPROVIDER_SANDBOX_ACCOUNT_ID}`;
  throw new DomainEngineError(
    "registrar_scope_unapproved",
    "The registrar account and environment need explicit configuration.",
    503,
  );
}
