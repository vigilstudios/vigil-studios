import "server-only";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import type {
  RegistrarAdapter,
  VerifiedRegistrationRequest,
} from "./contracts";
import { readDomainEngineConfig, assertMockAllowed } from "./config";
import { MockRegistrarAdapter } from "./mock";
import { DEMO_FIXTURES } from "./demo";
import { OpenproviderSandboxRegistrar } from "./openprovider-sandbox";
import { NamecomSandboxRegistrar } from "./namecom-sandbox";
import { DomainEngineError } from "./errors";
import { domainRegistrarAccountScope } from "./provider-scope";

let mock: MockRegistrarAdapter | null = null;
/** The provider for search, quote, contact and registration must be the same. */
export function domainTestRegistrar(admin: DbClient): RegistrarAdapter {
  const config = readDomainEngineConfig();
  if (!config.enabled)
    throw new DomainEngineError(
      "domain_disabled",
      "The domain engine is disabled.",
      503,
    );
  if (config.registrar === "mock") {
    assertMockAllowed(config);
    return (mock ??= new MockRegistrarAdapter(DEMO_FIXTURES, config));
  }
  if (config.registrar === "namecom")
    return new NamecomSandboxRegistrar(
      process.env.VIGIL_NAMECOM_SANDBOX_USERNAME ?? "",
      process.env.VIGIL_NAMECOM_SANDBOX_TOKEN ?? "",
      Number(process.env.VIGIL_NAMECOM_SANDBOX_MAX_COST_MINOR),
    );
  if (config.registrar !== "openprovider")
    throw new DomainEngineError(
      "domain_provider_unapproved",
      "Choose an approved test registrar.",
      403,
    );
  const account = process.env.VIGIL_OPENPROVIDER_SANDBOX_ACCOUNT_ID;
  if (!account || !/^\d+$/.test(account))
    throw new DomainEngineError(
      "sandbox_account_missing",
      "Configure the Openprovider sandbox account before testing.",
      503,
    );
  const accountScope = domainRegistrarAccountScope("openprovider", "test");
  const registrar: OpenproviderSandboxRegistrar =
    new OpenproviderSandboxRegistrar(
      process.env.VIGIL_OPENPROVIDER_SANDBOX_TOKEN ?? "",
      async (request) =>
        provisionContact(admin, registrar, request, accountScope),
    );
  return registrar;
}
async function provisionContact(
  admin: DbClient,
  registrar: OpenproviderSandboxRegistrar,
  request: VerifiedRegistrationRequest,
  accountScope: string,
) {
  const { data, error } = await admin.rpc("claim_domain_sandbox_contact", {
    p_acceptance_id: request.acceptanceId,
    p_account_scope: accountScope,
  });
  const claim = z
    .object({
      claimed: z.boolean(),
      contactId: z.string().uuid(),
      handle: z
        .string()
        .regex(/^[A-Z0-9-]{5,40}$/)
        .optional(),
    })
    .safeParse(data);
  if (error || !claim.success)
    throw new DomainEngineError(
      "contact_claim_failed",
      "The approved registrant could not be prepared.",
      503,
    );
  if (claim.data.handle) return claim.data.handle;
  if (!claim.data.claimed)
    throw new DomainEngineError(
      "contact_outcome_unknown",
      "A previous contact submission needs reconciliation. No second contact or purchase was submitted.",
      503,
    );
  // Keep the claim on any timeout/save failure. A worker must never invent a new owner.
  const handle = await registrar.createRegistrantContact(request);
  const { error: saveError } = await admin.rpc(
    "finish_domain_sandbox_contact",
    {
      p_acceptance_id: request.acceptanceId,
      p_account_scope: accountScope,
      p_handle: handle,
    },
  );
  if (saveError)
    throw new DomainEngineError(
      "contact_outcome_unknown",
      "The registrant response needs reconciliation before registration.",
      503,
    );
  return handle;
}
