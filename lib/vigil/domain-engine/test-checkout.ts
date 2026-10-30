import "server-only";
import { checkoutOrderView } from "./client-order-view";
import { createHash, randomUUID } from "node:crypto";
import type { DbClient } from "@/lib/vigil/types";
import { purchaseApprovalSchema } from "./validation";
import { assertDomainTestDatabase, domainTestPayments } from "./runtime";
import { createDomainSecretCodec } from "./secrets";
import { SupabaseDomainOrderStore } from "./store";
import { DomainEngineError } from "./errors";
import { openproviderContactPayload } from "./openprovider-contact";
import { namecomContactPayload } from "./namecom-sandbox";
import { readDomainEngineConfig } from "./config";

/** Only after authenticated owner authorization; SQL verifies membership again. */
export async function prepareTestDomainCheckout(
  admin: DbClient,
  organizationId: string,
  actorId: string,
  raw: unknown,
  returnUrl: string,
) {
  assertDomainTestDatabase();
  const approval = purchaseApprovalSchema.parse(raw);
  const { data: quote, error: quoteError } = await admin
    .from("domain_quotes")
    .select("id,environment,organization_id,registrar")
    .eq("id", approval.quoteId)
    .eq("organization_id", organizationId)
    .single();
  if (quoteError || !quote || quote.environment !== "test")
    throw new DomainEngineError(
      "domain_quote_missing",
      "Choose a current test quote.",
    );
  if (quote.registrar !== readDomainEngineConfig().registrar)
    throw new DomainEngineError(
      "domain_provider_changed",
      "Choose a fresh quote from the current test registrar.",
    );
  if (quote.registrar === "openprovider")
    openproviderContactPayload(approval.contact, approval.intentId);
  if (quote.registrar === "namecom") {
    namecomContactPayload(approval.contact);
    if (approval.autoRenew)
      throw new DomainEngineError(
        "renewal_approval_required",
        "Keep automatic renewal off for the Name.com sandbox.",
      );
  }
  const contactId = randomUUID();
  const canonical = JSON.stringify(approval.contact);
  const encrypted = createDomainSecretCodec().encrypt(approval.contact, {
    organizationId,
    recordId: contactId,
    purpose: "registrant",
  });
  const { data: id, error } = await admin.rpc("create_domain_purchase", {
    p_quote_id: quote.id,
    p_organization_id: organizationId,
    p_actor_id: actorId,
    p_intent_key: approval.intentId,
    p_contact_id: contactId,
    p_contact_encrypted: encrypted,
    p_contact_digest: createHash("sha256").update(canonical).digest("hex"),
    p_total_minor: approval.totalMinor,
    p_currency: approval.currency,
    p_auto_renew: approval.autoRenew,
    p_terms_version: "test-v1",
    p_renewal_policy_version: "test-v1",
  });
  if (error || !id)
    throw new DomainEngineError(
      "domain_approval_failed",
      "The purchase could not be approved. Review a fresh quote.",
    );
  const store = new SupabaseDomainOrderStore(admin);
  const order = await store.load(id);
  const checkout = await domainTestPayments().createCheckout(order, returnUrl);
  const { error: linkError } = await admin.from("provider_links").upsert(
    {
      provider: "stripe",
      resource_kind: "domain_checkout",
      external_id: checkout.sessionId,
      entity_type: "domain_order",
      entity_id: id,
      metadata: { environment: "test", account_scope: "stripe-test" },
    },
    { onConflict: "provider,resource_kind,external_id" },
  );
  if (linkError)
    throw new DomainEngineError(
      "domain_checkout_reconcile",
      "The test checkout needs reconciliation before continuing.",
      503,
    );
  return { orderId: id, clientSecret: checkout.clientSecret, ...checkoutOrderView(order) };
}
