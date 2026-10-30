import "server-only";
import type { DbClient, Tables } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { DomainEngineError } from "./errors";
import type {
  DomainOrderPatch,
  DomainOrderStore,
  OrderContext,
} from "./orchestrator";
import type {
  RegistrarDomain,
  RegistrarOrder,
  RegistrantContact,
} from "./contracts";
import { createDomainSecretCodec } from "./secrets";
import { registrantSchema } from "./validation";
import { domainRegistrarAccountScope } from "./provider-scope";

type PrivateContext = {
  order: Tables<"domain_orders">;
  quote: Tables<"domain_quotes">;
  acceptance: Tables<"domain_acceptances">;
  contact: { id: string; encrypted_payload: string };
  registrar_cost_minor: number;
};

export class SupabaseDomainOrderStore implements DomainOrderStore {
  constructor(private readonly admin: DbClient) {}
  async load(id: string): Promise<OrderContext> {
    const { data, error } = await this.admin.rpc(
      "domain_engine_order_context",
      { p_order_id: id },
    );
    if (error || !data)
      throw new DomainEngineError(
        "domain_order_missing",
        "The domain order could not be loaded.",
        404,
      );
    const context = data as unknown as PrivateContext;
    const { order, quote, acceptance, contact } = context;
    if (order.operation !== "register")
      throw new DomainEngineError(
        "renewal_unapproved",
        "Paid renewal requires an approved lifecycle implementation.",
        403,
      );
    const decoded = createDomainSecretCodec().decrypt<RegistrantContact>(
      contact.encrypted_payload,
      {
        organizationId: order.organization_id,
        recordId: contact.id,
        purpose: "registrant",
      },
    );
    const { data: links, error: linksError } = await this.admin
      .from("provider_links")
      .select("resource_kind,external_id,metadata")
      .eq("entity_type", "domain_order")
      .eq("entity_id", id);
    if (linksError)
      throw new DomainEngineError(
        "domain_reference_unavailable",
        "The domain order references could not be loaded.",
        503,
      );
    const references = (links ?? []).filter(
      (link) =>
        (link.metadata as { environment?: string })?.environment ===
        order.environment,
    );
    const registrarScope = domainRegistrarAccountScope(
      order.registrar as OrderContext["registrar"],
      order.environment as OrderContext["environment"],
    );
    const registrarReferences = references.filter(
      (link) => link.resource_kind === "registrar_order",
    );
    if (
      registrarReferences.some(
        (link) =>
          (link.metadata as { account_scope?: string })?.account_scope !==
          registrarScope,
      )
    )
      throw new DomainEngineError(
        "registrar_scope_mismatch",
        "Reconcile this order with its original registrar account.",
        503,
      );
    if (order.environment === "live" && references.some(link => link.resource_kind === "domain_checkout" && ((link.metadata as {account_scope?:string})?.account_scope !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID)))
      throw new DomainEngineError("payment_scope_mismatch", "Reconcile this order with its original billing account.", 503);
    return {
      id,
      organizationId: order.organization_id,
      fqdn: order.fqdn,
      years: quote.years,
      autoRenew: acceptance.auto_renew_consent,
      acceptanceId: acceptance.id,
      registrar: order.registrar as OrderContext["registrar"],
      environment: order.environment as OrderContext["environment"],
      registrarAmountMinor: context.registrar_cost_minor,
      totalMinor: quote.total_minor,
      billingBreakdown: { registrationMinor: context.registrar_cost_minor, serviceFeeMinor: quote.subtotal_minor - context.registrar_cost_minor, taxMinor: quote.tax_minor },
      currency: quote.currency,
      quoteExpiresAt: quote.expires_at,
      registrationState:
        order.registration_state as OrderContext["registrationState"],
      paymentState: order.payment_state as OrderContext["paymentState"],
      connectionState: order.connection_state as DomainOrderPatch["connectionState"],
      reason: order.reason_code as DomainOrderPatch["reason"],
      paymentCaptureBefore: order.payment_capture_before,
      paymentRef:
        references.find((link) => link.resource_kind === "domain_checkout")
          ?.external_id ?? null,
      registrarOrderRef:
        references.find((link) => link.resource_kind === "registrar_order")
          ?.external_id ?? null,
      contact: registrantSchema.parse(decoded),
    };
  }
  async claimRegistration(id: string): Promise<boolean> {
    const { data, error } = await this.admin.rpc("claim_domain_registration", {
      p_order_id: id,
    });
    if (error)
      throw new DomainEngineError(
        "domain_claim_failed",
        "The domain order could not be claimed.",
        503,
      );
    return data === true;
  }
  async update(id: string, patch: DomainOrderPatch) {
    const values: Record<string, Json> = {};
    if (patch.registrationState !== undefined)
      values.registration_state = patch.registrationState;
    if (patch.paymentState !== undefined)
      values.payment_state = patch.paymentState;
    if (patch.connectionState !== undefined)
      values.connection_state = patch.connectionState;
    if (patch.reason !== undefined) values.reason_code = patch.reason;
    const { error } = await this.admin.rpc("transition_domain_order", {
      p_order_id: id,
      p_patch: values,
    });
    if (error)
      throw new DomainEngineError(
        "domain_update_failed",
        "The domain order update could not be saved.",
        503,
      );
  }
  async linkRegistrarOrder(id: string, order: RegistrarOrder) {
    const context = await this.load(id);
    const { error } = await this.admin.from("provider_links").insert({
      provider: context.registrar === "vercel" ? "vercel" : "other",
      resource_kind: "registrar_order",
      external_id: order.externalId,
      entity_type: "domain_order",
      entity_id: id,
      metadata: {
        environment: context.environment,
        account_scope: domainRegistrarAccountScope(
          context.registrar,
          context.environment,
        ),
      },
    });
    if (error)
      throw new DomainEngineError(
        "domain_reference_failed",
        "The registrar response needs reconciliation.",
        503,
      );
  }
  async registered(id: string, domain: RegistrarDomain) {
    const context = await this.load(id);
    const { error } = await this.admin.rpc("record_domain_registration", {
      p_order_id: id,
      p_domain: domain as unknown as Json,
      p_external_id: domain.externalId,
      p_account_scope: domainRegistrarAccountScope(
        context.registrar,
        context.environment,
      ),
    });
    if (error)
      throw new DomainEngineError(
        "domain_registration_save_failed",
        "The registered domain needs reconciliation.",
        503,
      );
  }
}

export class LiveDomainOrderStore extends SupabaseDomainOrderStore {
 constructor(private readonly liveAdmin: DbClient){super(liveAdmin);}
 async registered(id:string,domain:RegistrarDomain){
  const context=await this.load(id);
  const {error}=await this.liveAdmin.rpc("record_live_domain_registration",{p_order_id:id,p_domain:domain as unknown as Json,p_external_id:domain.externalId,p_account_scope:domainRegistrarAccountScope(context.registrar,"live")});
  if(error)throw new DomainEngineError("domain_registration_save_failed","The registered domain needs reconciliation.",503);
 }
}
