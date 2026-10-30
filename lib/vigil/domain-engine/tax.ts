import "server-only";
import { createHash } from "node:crypto";
import Stripe from "stripe";
import { z } from "zod";
import type { DbClient } from "@/lib/vigil/types";
import { registrantSchema } from "./validation";
import { liveUnavailable, type LiveDomainPolicy } from "./live-policy";

const states = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "));
export const usTaxAddressSchema = registrantSchema.shape.address.extend({
  country: z.literal("US"),
  region: z.string().trim().toUpperCase().refine(value => states.has(value), "Use a two-letter US state or DC."),
  postalCode: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/, "Use a US ZIP code."),
});
export type UsTaxAddress = z.infer<typeof usTaxAddressSchema>;
export function taxAddressDigest(input: unknown) {
  const a = usTaxAddressSchema.parse(input);
  return createHash("sha256").update(JSON.stringify([a.line1.trim().toUpperCase(), (a.line2 ?? "").trim().toUpperCase(), a.city.trim().toUpperCase(), a.region, a.postalCode.replace(/-/g, ""), a.country])).digest("hex");
}
function taxClient() {
  const key = process.env.VIGIL_DOMAIN_STRIPE_LIVE_KEY ?? "";
  if (!/^(sk|rk)_live_/.test(key)) throw liveUnavailable("Domain tax calculation is not configured.");
  return new Stripe(key, { apiVersion: "2025-08-27.basil", timeout: 10000, maxNetworkRetries: 1 });
}

/** A saved business classification is required; the account-wide default is never used. */
export async function calculateDomainTax(policy: LiveDomainPolicy, address: unknown, registrarMinor: number, quoteId: string, stripe: Stripe = taxClient(), environment: "live" | "test" = "live") {
  const a = usTaxAddressSchema.parse(address);
  if (policy.tax_mode !== "stripe" || !/^txcd_\d{8}$/.test(policy.tax_code ?? "") || !/^txcd_\d{8}$/.test(policy.fee_tax_code ?? "") || !Number.isSafeInteger(registrarMinor) || registrarMinor <= 0 || registrarMinor > policy.max_registrar_minor) throw liveUnavailable("This domain needs a reviewed tax classification.");
  const account = await stripe.accounts.retrieve();
  if (account.id !== policy.stripe_account) throw liveUnavailable("Domain billing account needs review.");
  const digest = taxAddressDigest(a);
  const calculation = await stripe.tax.calculations.create({
    currency: "usd",
    customer_details: { address: { country: "US", state: a.region, postal_code: a.postalCode, city: a.city, line1: a.line1, line2: a.line2 }, address_source: "billing" },
    line_items: [
      { amount: registrarMinor, reference: "registration", tax_code: policy.tax_code!, tax_behavior: "exclusive" },
      { amount: policy.service_fee_minor, reference: "service_fee", tax_code: policy.fee_tax_code!, tax_behavior: "exclusive" },
    ],
    expand: ["line_items"],
  }, { idempotencyKey: `domain-tax-quote:${quoteId}:${digest}` });
  const subtotal = registrarMinor + policy.service_fee_minor;
  const lines = calculation.line_items;
  if (!calculation.id || !/^taxcalc_[A-Za-z0-9_]+$/.test(calculation.id) || !calculation.expires_at || calculation.expires_at * 1000 <= Date.now() || calculation.currency !== "usd" || calculation.livemode !== (environment === "live") || calculation.tax_amount_inclusive !== 0 || !Number.isSafeInteger(calculation.tax_amount_exclusive) || calculation.tax_amount_exclusive < 0 || calculation.amount_total !== subtotal + calculation.tax_amount_exclusive || calculation.amount_total > policy.max_client_minor || !lines || lines.has_more || lines.data.length !== 2 || lines.data.some(line => line.tax_behavior !== "exclusive" || !Number.isSafeInteger(line.amount_tax) || line.amount_tax < 0 || line.tax_code !== (line.reference === "registration" ? policy.tax_code : policy.fee_tax_code)) || lines.data.find(line => line.reference === "registration")?.amount !== registrarMinor || lines.data.find(line => line.reference === "service_fee")?.amount !== policy.service_fee_minor || lines.data.reduce((sum, line) => sum + line.amount_tax, 0) !== calculation.tax_amount_exclusive || calculation.tax_breakdown.some(item => ["not_supported", "taxability_override"].includes(item.taxability_reason))) throw liveUnavailable("The final tax quote is unavailable or exceeds the approved total. No payment was created.");
  return { calculationId: calculation.id, addressDigest: digest, taxMinor: calculation.tax_amount_exclusive, totalMinor: calculation.amount_total, providerExpiresAt: new Date(calculation.expires_at * 1000).toISOString(), breakdown: calculation.tax_breakdown.map(item => ({ amount: item.amount, inclusive: item.inclusive, reason: item.taxability_reason, taxableAmount: item.taxable_amount, rate: { country: item.tax_rate_details.country, state: item.tax_rate_details.state, percentageDecimal: item.tax_rate_details.percentage_decimal, taxType: item.tax_rate_details.tax_type, rateType: item.tax_rate_details.rate_type } })) };
}

const taxWorkSchema = z.object({
  order_id: z.string().uuid(), organization_id: z.string().uuid(), quote_id: z.string().uuid(),
  payment_state: z.enum(["paid", "refunded"]), total_minor: z.number().int().positive(), tax_minor: z.number().int().nonnegative(), currency: z.literal("usd"),
  calculation_id: z.string().regex(/^taxcalc_/), stripe_account: z.string(), provider_expires_at: z.string(),
  transaction_id: z.string().nullable(), reversal_id: z.string().nullable(), checkout_id: z.string().regex(/^cs_live_/),
});

/** Tax reporting is independent of ownership/payment success. It never moves money. */
export async function reconcileDomainTax(admin: DbClient, stripe: Stripe = taxClient()) {
  const { data, error } = await admin.rpc("domain_tax_reconciliation", { p_limit: 10 });
  if (error) throw liveUnavailable("Domain tax reconciliation could not be loaded.");
  const work = z.array(taxWorkSchema).parse(data);
  if (!work.length) return { checked: 0, recorded: 0, failed: 0 };
  const account = await stripe.accounts.retrieve();
  let recorded = 0, failed = 0;
  for (const row of work) {
    let transaction = row.transaction_id, reversal = row.reversal_id;
    try {
      if (account.id !== row.stripe_account || row.stripe_account !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID) throw Error();
      const session = await stripe.checkout.sessions.retrieve(row.checkout_id, { expand: ["payment_intent.latest_charge.balance_transaction"] });
      const pi = session.payment_intent;
      if (!session.livemode || session.mode !== "payment" || session.payment_status !== "paid" || session.amount_total !== row.total_minor || session.currency !== "usd" || session.metadata?.domain_order_id !== row.order_id || session.metadata?.organization_id !== row.organization_id || !pi || typeof pi === "string" || !pi.livemode || pi.status !== "succeeded" || pi.amount !== row.total_minor || pi.currency !== "usd" || pi.amount_received !== row.total_minor || pi.metadata?.domain_order_id !== row.order_id || pi.metadata?.organization_id !== row.organization_id) throw Error();
      const charge = pi.latest_charge;
      if (!charge || typeof charge === "string" || !charge.paid || !charge.captured || charge.amount !== row.total_minor || charge.currency !== "usd") throw Error();
      const balance = charge.balance_transaction;
      if (!balance || typeof balance === "string") throw Error();
      if (!transaction) {
        if (Date.parse(row.provider_expires_at) <= Date.now()) throw Error();
        const claim = await admin.rpc("claim_domain_tax_submission", { p_quote_id: row.quote_id, p_stripe_account: row.stripe_account, p_reversal: false });
        if (claim.error || claim.data !== true) throw Error();
        const tx = await stripe.tax.transactions.createFromCalculation({ calculation: row.calculation_id, reference: `vigil-domain:${row.order_id}`, posted_at: balance.created, metadata: { domain_order_id: row.order_id }, expand: ["line_items"] }, { idempotencyKey: `domain-tax-commit:${row.order_id}` });
        if (!tx.livemode || tx.currency !== "usd" || tx.reference !== `vigil-domain:${row.order_id}` || tx.type !== "transaction" || !tx.line_items || tx.line_items.has_more || tx.line_items.data.reduce((sum, line) => sum + line.amount + line.amount_tax, 0) !== row.total_minor || tx.line_items.data.reduce((sum, line) => sum + line.amount_tax, 0) !== row.tax_minor) throw Error();
        transaction = tx.id;
        const saved = await admin.rpc("record_domain_tax_result", { p_quote_id: row.quote_id, p_stripe_account: row.stripe_account, p_transaction_id: transaction });
        if (saved.error) throw Error();
      }
      if (row.payment_state === "refunded" && !reversal) {
        if (!charge.refunded || charge.amount_refunded !== row.total_minor) throw Error();
        const claim = await admin.rpc("claim_domain_tax_submission", { p_quote_id: row.quote_id, p_stripe_account: row.stripe_account, p_reversal: true });
        if (claim.error || claim.data !== true) throw Error();
        const tx = await stripe.tax.transactions.createReversal({ mode: "full", original_transaction: transaction, reference: `vigil-domain-refund:${row.order_id}`, metadata: { domain_order_id: row.order_id }, expand: ["line_items"] }, { idempotencyKey: `domain-tax-reversal:${row.order_id}` });
        if (!tx.livemode || tx.currency !== "usd" || tx.reference !== `vigil-domain-refund:${row.order_id}` || tx.type !== "reversal" || tx.reversal?.original_transaction !== transaction || !tx.line_items || tx.line_items.has_more || tx.line_items.data.reduce((sum, line) => sum + line.amount + line.amount_tax, 0) !== -row.total_minor || tx.line_items.data.reduce((sum, line) => sum + line.amount_tax, 0) !== -row.tax_minor) throw Error();
        reversal = tx.id;
      }
      const saved = await admin.rpc("record_domain_tax_result", { p_quote_id: row.quote_id, p_stripe_account: row.stripe_account, p_transaction_id: transaction ?? undefined, p_reversal_id: reversal ?? undefined });
      if (saved.error) throw Error();
      recorded++;
    } catch {
      failed++;
      await admin.rpc("record_domain_tax_result", { p_quote_id: row.quote_id, p_stripe_account: row.stripe_account, p_transaction_id: transaction ?? undefined, p_reversal_id: reversal ?? undefined, p_failure_code: "tax_reconciliation_needs_review" });
    }
  }
  return { checked: work.length, recorded, failed };
}

export async function assertTaxQuoteContact(admin: DbClient, quoteId: string, organizationId: string, address: unknown) {
  const { data, error } = await admin.rpc("domain_tax_quote", { p_quote_id: quoteId, p_organization_id: organizationId });
  const parsed = z.object({ address_digest: z.string(), provider_expires_at: z.string(), stripe_account: z.string() }).safeParse(data);
  if (error || !parsed.success || parsed.data.address_digest !== taxAddressDigest(address) || Date.parse(parsed.data.provider_expires_at) <= Date.now() || parsed.data.stripe_account !== process.env.VIGIL_DOMAIN_STRIPE_ACCOUNT_ID) throw liveUnavailable("Confirm your current address and calculate the final price again.");
}
