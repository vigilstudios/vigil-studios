import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { DbClient } from "@/lib/vigil/types";
import { LiveDomainOrderStore } from "./store";
import { processDomainOrder } from "./orchestrator";
import {
  assertLiveStripeAccount,
  liveOrderPolicy,
  livePayments,
  liveRegistrar,
} from "./live-providers";
import {
  authorizeLiveAction,
  loadLivePolicy,
  publicDomainPolicy,
  retailDomainAmount,
  liveUnavailable,
  assertDomainLiveRuntime,
} from "./live-policy";
import { purchaseApprovalSchema } from "./validation";
import { createDomainSecretCodec } from "./secrets";
import { namecomContactPayload } from "./namecom-sandbox";
import { domainCandidates } from "./search";
import { checkoutOrderView } from "./client-order-view";

export async function searchLiveDomains(
  admin: DbClient,
  org: string,
  website: string,
  input: string,
) {
  const p = await loadLivePolicy(admin, org, website);
  const results = await liveRegistrar(admin, p).searchAndPrice(
    domainCandidates(input),
  );
  const { data: owned, error } = await admin
    .from("domain_registrations")
    .select("fqdn")
    .eq("environment", "live")
    .neq("registration_status", "released")
    .in(
      "fqdn",
      results.map((r) => r.fqdn),
    );
  if (error) throw liveUnavailable();
  return results.map((r) => {
    if ((p.fqdn && p.fqdn !== r.fqdn) || owned?.some((a) => a.fqdn === r.fqdn))
      return {
        ...r,
        availability: "unavailable" as const,
        registration: null,
        renewal: null,
      };
    if (!r.registration) return r;
    try {
      return {
        ...r,
        registration: {
          ...r.registration,
          amountMinor: retailDomainAmount(r.registration.amountMinor, p)
            .totalMinor,
        },
      };
    } catch {
      return {
        ...r,
        availability: "unsupported" as const,
        registration: null,
        renewal: null,
      };
    }
  });
}
export async function quoteLiveDomain(
  admin: DbClient,
  org: string,
  website: string,
  fqdn: string,
) {
  const p = await loadLivePolicy(admin, org, website, fqdn);
  const registrar = liveRegistrar(admin, p);
  const [q] = await registrar.searchAndPrice([fqdn]);
  if (
    q.availability !== "available" ||
    q.premium ||
    !q.registration ||
    !q.renewal
  )
    throw liveUnavailable("Choose an available ordinary .com domain.");
  const amount = retailDomainAmount(q.registration.amountMinor, p);
  const { data: id, error } = await admin.rpc("create_live_domain_quote", {
    p_organization_id: org,
    p_website_id: website,
    p_fqdn: q.fqdn,
    p_cost_minor: q.registration.amountMinor,
    p_renewal_minor: q.renewal.amountMinor,
    p_expires_at: q.expiresAt,
  });
  if (error || !id)
    throw liveUnavailable(
      "The current quote could not be saved. Search again.",
    );
  return {
    ...q,
    id,
    registration: { ...q.registration, amountMinor: amount.totalMinor },
    ...amount,
    serviceFeeMinor: p.service_fee_minor,
    policy: publicDomainPolicy(p),
    contactSchema: await registrar.getContactSchema(q.fqdn),
  };
}
export async function prepareLiveCheckout(
  admin: DbClient,
  org: string,
  actor: string,
  raw: unknown,
  returnUrl: string,
) {
  const approval = purchaseApprovalSchema.parse(raw);
  if (approval.autoRenew)
    throw liveUnavailable(
      "Automatic renewal is not enabled. Renewals require separate approval.",
    );
  namecomContactPayload(approval.contact);
  const { data: q, error: qError } = await admin
    .from("domain_quotes")
    .select("id,website_id,live_policy_id,fqdn")
    .eq("id", approval.quoteId)
    .eq("organization_id", org)
    .eq("environment", "live")
    .single();
  if (qError || !q?.website_id || !q.live_policy_id) throw liveUnavailable();
  const p = await loadLivePolicy(
    admin,
    org,
    q.website_id,
    q.fqdn,
    q.live_policy_id,
  );
  if (
    !process.env.NEXT_PUBLIC_VIGIL_DOMAIN_STRIPE_LIVE_KEY?.startsWith(
      "pk_live_",
    )
  )
    throw liveUnavailable("Secure domain checkout is not configured.");
  if (
    approval.contact.address.country !== p.registrant_country ||
    approval.contact.address.region.toLowerCase() !==
      p.registrant_region.toLowerCase() ||
    approval.contact.address.postalCode.replace(/\s/g, "").toUpperCase() !==
      p.registrant_postal_code.replace(/\s/g, "").toUpperCase()
  )
    throw liveUnavailable(
      "The registrant address needs a matching tax review before checkout.",
    );
  await assertLiveStripeAccount();
  // Check the approved ceiling before creating an order or authorizing a card.
  // The registrar rechecks the actual cost immediately before registration.
  await liveRegistrar(admin, p).assertRegistrationFunding(p.max_registrar_minor);
  const contactId = randomUUID(),
    canonical = JSON.stringify(approval.contact);
  const encrypted = createDomainSecretCodec().encrypt(approval.contact, {
    organizationId: org,
    recordId: contactId,
    purpose: "registrant",
  });
  const { data: id, error } = await admin.rpc("create_domain_purchase", {
    p_quote_id: q.id,
    p_organization_id: org,
    p_actor_id: actor,
    p_intent_key: approval.intentId,
    p_contact_id: contactId,
    p_contact_encrypted: encrypted,
    p_contact_digest: createHash("sha256").update(canonical).digest("hex"),
    p_total_minor: approval.totalMinor,
    p_currency: approval.currency,
    p_auto_renew: false,
    p_terms_version: p.terms_version,
    p_renewal_policy_version: p.renewal_policy_version,
  });
  if (error || !id)
    throw liveUnavailable(
      "Approve a current quote and the displayed registration terms.",
    );
  const store = new LiveDomainOrderStore(admin);
  const order = await store.load(id);
  await authorizeLiveAction(admin, id, "checkout");
  const payments = await livePayments(admin);
  const checkout = await payments.createCheckout(order, returnUrl);
  const { error: linkError } = await admin
    .from("provider_links")
    .upsert(
      {
        provider: "stripe",
        resource_kind: "domain_checkout",
        external_id: checkout.sessionId,
        entity_type: "domain_order",
        entity_id: id,
        metadata: { environment: "live", account_scope: p.stripe_account },
      },
      { onConflict: "provider,resource_kind,external_id" },
    );
  if (linkError)
    throw liveUnavailable(
      "The existing checkout needs reconciliation before continuing.",
    );
  return { orderId: id, clientSecret: checkout.clientSecret, ...checkoutOrderView(order) };
}
export async function runLiveDomainPurchase(admin: DbClient, id: string) {
  assertDomainLiveRuntime();
  const store = new LiveDomainOrderStore(admin),
    order = await store.load(id);
  if (order.environment !== "live" || order.registrar !== "namecom")
    throw liveUnavailable();
  const policy = await liveOrderPolicy(admin, id),
    registrar = liveRegistrar(admin, policy),
    payments = await livePayments(admin);
  if (order.paymentRef) {
    const snapshot = await payments.snapshot(order);
    if (
      snapshot.state === "canceled" &&
      ["awaiting_payment", "ready"].includes(order.registrationState)
    ) {
      await store.update(id, {
        registrationState: "failed",
        paymentState: "canceled",
        reason: "payment_failed",
      });
      return { pending: false, manualReview: false, state: "failed" };
    }
    if (
      snapshot.state === "awaiting_payment" &&
      Date.parse(order.quoteExpiresAt) <= Date.now() &&
      order.registrationState === "awaiting_payment"
    ) {
      await payments.expireUnpaidCheckout(order);
      await store.update(id, {
        registrationState: "failed",
        paymentState: "canceled",
        reason: "quote_expired",
      });
      return { pending: false, manualReview: false, state: "failed" };
    }
    if (snapshot.state === "authorized" && !snapshot.captureBefore)
      throw liveUnavailable(
        "The card authorization deadline needs reconciliation.",
      );
    const { error } = await admin
      .from("domain_orders")
      .update({ payment_capture_before: snapshot.captureBefore })
      .eq("id", id)
      .eq("environment", "live");
    if (error) throw liveUnavailable();
    await store.update(id, { paymentState: snapshot.state });
  }
  await processDomainOrder(store, registrar, payments, id);
  const current = await store.load(id);
  return {
    pending: current.registrationState === "pending",
    manualReview:
      ["unknown", "manual_review"].includes(current.registrationState) ||
      ["capture_failed", "refund_pending"].includes(current.paymentState),
    state: current.registrationState,
  };
}
