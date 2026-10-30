import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import { readDomainEngineConfig } from "./config";
import { DomainEngineError } from "./errors";
import { SupabaseDomainOrderStore } from "./store";
import { processDomainOrder } from "./orchestrator";
import { StripeTestDomainPayments } from "./stripe-test";
import { domainTestRegistrar } from "./test-registrar";

export function assertDomainTestDatabase() {
  const env = process.env;
  if (
    env.NODE_ENV === "production" ||
    env.VERCEL_ENV === "production" ||
    env.VIGIL_DOMAIN_TEST_DATABASE_APPROVED !== "true" ||
    !env.VIGIL_DOMAIN_TEST_SUPABASE_URL ||
    env.VIGIL_DOMAIN_TEST_SUPABASE_URL !== env.NEXT_PUBLIC_SUPABASE_URL
  )
    throw new DomainEngineError(
      "domain_test_database_unapproved",
      "Domain transaction tests require a separately approved test database.",
      403,
    );
}
export function domainTestPayments() {
  return new StripeTestDomainPayments(
    process.env.VIGIL_DOMAIN_STRIPE_TEST_KEY ?? "",
    process.env.VIGIL_DOMAIN_STRIPE_WEBHOOK_SECRET,
  );
}

async function runTestDomainPurchase(admin: DbClient, id: string) {
  assertDomainTestDatabase();
  const config = readDomainEngineConfig();
  if (!config.enabled)
    throw new DomainEngineError(
      "domain_disabled",
      "The domain engine is disabled.",
      503,
    );
  const store = new SupabaseDomainOrderStore(admin);
  const order = await store.load(id);
  if (order.environment !== "test")
    throw new DomainEngineError(
      "domain_live_operation_disabled",
      "Live registration is awaiting service approval.",
      403,
    );
  if (order.registrar !== config.registrar)
    throw new DomainEngineError(
      "domain_provider_changed",
      "Reconcile this order with its original registrar configuration.",
      503,
    );
  const registrar = domainTestRegistrar(admin);
  const payments = domainTestPayments();
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
      throw new DomainEngineError(
        "payment_authorization_unconfirmed",
        "The card authorization deadline needs reconciliation.",
        503,
      );
    const { error: deadlineError } = await admin
      .from("domain_orders")
      .update({ payment_capture_before: snapshot.captureBefore })
      .eq("id", id)
      .eq("environment", "test");
    if (deadlineError)
      throw new DomainEngineError(
        "payment_status_unavailable",
        "The authorization status could not be saved.",
        503,
      );
    await store.update(id, { paymentState: snapshot.state });
  }
  await processDomainOrder(store, registrar, payments, id);
  const current = await store.load(id);
  return {
    pending: current.registrationState === "pending",
    manualReview:
      current.registrationState === "unknown" ||
      current.registrationState === "manual_review" ||
      current.paymentState === "capture_failed" ||
      current.paymentState === "refund_pending",
    state: current.registrationState,
  };
}

export async function runDomainPurchase(admin:DbClient,id:string){
 if(process.env.VIGIL_DOMAIN_LIVE_ENABLED === "true"){
  const {data,error}=await admin.from("domain_orders").select("environment").eq("id",id).single();
  if(error||!data)throw new DomainEngineError("domain_order_missing","The domain order could not be loaded.",404);
  if(data.environment === "live")return (await import("./live-runtime")).runLiveDomainPurchase(admin,id);
 }
 return runTestDomainPurchase(admin,id);
}
