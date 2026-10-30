import "server-only";
import Stripe from "stripe";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { NamecomProductionRegistrar } from "./namecom-production";
import { StripeProductionDomainPayments } from "./stripe-production";
import {
  assertDomainLiveRuntime,
  authorizeLiveAction,
  liveRegistrarScope,
  liveUnavailable,
  loadLivePolicy,
  type LiveDomainPolicy,
} from "./live-policy";
import { SupabaseDomainOrderStore } from "./store";

export function liveRegistrar(
  admin: DbClient,
  policy: LiveDomainPolicy,
  registrationId?: string,
) {
  assertDomainLiveRuntime();
  return new NamecomProductionRegistrar(
    process.env.VIGIL_NAMECOM_USERNAME ?? "",
    process.env.VIGIL_NAMECOM_TOKEN ?? "",
    policy.max_registrar_minor,
    {
      registration: async (request) => {
        const saved = await new SupabaseDomainOrderStore(admin).load(
          request.intentId,
        );
        if (
          saved.environment !== "live" ||
          saved.organizationId !== request.organizationId ||
          saved.fqdn !== request.fqdn ||
          saved.acceptanceId !== request.acceptanceId ||
          saved.registrarAmountMinor !==
            request.expectedRegistrarPrice.amountMinor ||
          JSON.stringify(saved.contact) !== JSON.stringify(request.contact)
        )
          throw liveUnavailable();
        await authorizeLiveAction(admin, request.intentId, "registration");
      },
      dns: async (request, plan) => {
        if (
          !registrationId ||
          request.fqdn !== plan.fqdn ||
          plan.accountScope !== policy.registrar_scope
        )
          throw liveUnavailable();
        const { error } = await admin.rpc("authorize_live_domain_dns", {
          p_registration_id: registrationId,
          p_plan: plan as unknown as Json,
          p_account_scope: liveRegistrarScope(),
        });
        if (error)
          throw liveUnavailable(
            "The exact DNS plan requires current customer and release approval.",
          );
      },
    },
  );
}
export async function assertLiveStripeAccount() {
  assertDomainLiveRuntime();
  const key = process.env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? "";
  if (!/^(sk|rk)_live_/.test(key))
    throw liveUnavailable("Production domain billing is not configured.");
  const stripe = new Stripe(key, {
    apiVersion: "2025-08-27.basil",
    timeout: 8000,
    maxNetworkRetries: 1,
  });
  const account = await stripe.accounts.retrieve();
  if (
    account.id !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID ||
    !account.charges_enabled ||
    !account.details_submitted
  )
    throw liveUnavailable(
      "The configured Stripe account does not match the approved billing account.",
    );
}
export async function livePayments(admin: DbClient) {
  await assertLiveStripeAccount();
  return new StripeProductionDomainPayments(
    process.env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? "",
    async (order, action) => {
      await authorizeLiveAction(admin, order.id, action);
    },
    process.env.VIGIL_DOMAIN_STRIPE_LIVE_WEBHOOK_SECRET,
  );
}
export async function liveOrderPolicy(
  admin: DbClient,
  orderId: string,
  active = false,
) {
  const { data, error } = await admin
    .from("domain_orders")
    .select("organization_id,domain_quotes(website_id,live_policy_id),fqdn")
    .eq("id", orderId)
    .eq("environment", "live")
    .single();
  if (error || !data) throw liveUnavailable();
  const q = data.domain_quotes as unknown as {
    website_id: string;
    live_policy_id: string;
  };
  return loadLivePolicy(
    admin,
    data.organization_id,
    q.website_id,
    data.fqdn,
    q.live_policy_id,
    active,
  );
}
