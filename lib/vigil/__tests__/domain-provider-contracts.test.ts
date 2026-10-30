import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, verify } from "node:crypto";
import {
  createDomainConnectApplyUrl,
  createDnsCallbackNonce,
  discoverDomainDns,
} from "../domain-engine/domain-connect";
import { OpenproviderSandboxRegistrar } from "../domain-engine/openprovider-sandbox";
import { StripeTestDomainPayments } from "../domain-engine/stripe-test";
import type { OrderContext } from "../domain-engine/orchestrator";

const stripe = vi.hoisted(() => ({
  checkout: {
    sessions: { create: vi.fn(), retrieve: vi.fn(), expire: vi.fn() },
  },
  paymentIntents: { capture: vi.fn(), cancel: vi.fn() },
  refunds: { list: vi.fn(), create: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
}));
vi.mock("stripe", () => ({
  default: class {
    constructor() {
      return stripe;
    }
  },
}));
const order: OrderContext = {
  id: "order",
  organizationId: "org",
  fqdn: "fixture.com",
  years: 1,
  autoRenew: false,
  acceptanceId: "approval",
  registrar: "mock",
  environment: "test",
  registrarAmountMinor: 1200,
  totalMinor: 1500,
  currency: "usd",
  quoteExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  registrationState: "ready",
  paymentState: "authorized",
  paymentRef: "cs_test_fixture",
  registrarOrderRef: null,
  contact: {
    firstName: "Test",
    lastName: "Owner",
    email: "owner@example.test",
    phone: "+12125550100",
    address: {
      line1: "1 Example Street",
      city: "Example",
      region: "NY",
      postalCode: "10001",
      country: "US",
    },
  },
};
function session() {
  return {
    livemode: false,
    mode: "payment",
    metadata: {
      domain_order_id: order.id,
      organization_id: order.organizationId,
    },
    amount_total: 1500,
    currency: "usd",
    payment_intent: {
      id: "pi_test",
      livemode: false,
      metadata: {
        domain_order_id: order.id,
        organization_id: order.organizationId,
      },
      status: "requires_capture",
      amount: 1500,
      amount_capturable: 1500,
      amount_received: 0,
      currency: "usd",
      latest_charge: {
        refunded: false,
        amount_refunded: 0,
        payment_method_details: {
          card: { capture_before: Math.floor(Date.now() / 1000) + 3600 },
        },
      },
    },
  };
}
beforeEach(() => vi.resetAllMocks());
describe("Stripe domain transaction contract", () => {
  it("rejects live keys and mismatched tenant/amount before capture", async () => {
    expect(() => new StripeTestDomainPayments("sk_live_fixture")).toThrow(
      "isolated Stripe test",
    );
    const s = session();
    s.metadata.organization_id = "another-org";
    stripe.checkout.sessions.retrieve.mockResolvedValue(s);
    await expect(
      new StripeTestDomainPayments("sk_test_fixture").capture(order),
    ).rejects.toThrow("does not match");
    expect(stripe.paymentIntents.capture).not.toHaveBeenCalled();
  });
  it("does not mark a succeeded payment paid when its actual capture is short", async () => {
    const value = session();
    value.payment_intent.status = "succeeded";
    value.payment_intent.amount_received = order.totalMinor - 100;
    stripe.checkout.sessions.retrieve.mockResolvedValue(value);
    await expect(new StripeTestDomainPayments("sk_test_fixture").snapshot(order)).rejects.toThrow("captured amount");
    expect(stripe.paymentIntents.capture).not.toHaveBeenCalled();
  });
  it("accepts the independently confirmed exact captured total", async () => {
    const value = session();
    value.payment_intent.status = "succeeded";
    value.payment_intent.amount_received = order.totalMinor;
    stripe.checkout.sessions.retrieve.mockResolvedValue(value);
    expect((await new StripeTestDomainPayments("sk_test_fixture").snapshot(order)).state).toBe("paid");
  });
  it("blocks purchase eligibility after a partial refund", async () => {
    const value = session();
    value.payment_intent.latest_charge.amount_refunded = 500;
    stripe.checkout.sessions.retrieve.mockResolvedValue(value);
    expect(
      (await new StripeTestDomainPayments("sk_test_fixture").snapshot(order))
        .state,
    ).toBe("refund_pending");
  });
  it("creates an embedded, manually captured, idempotent checkout for the immutable total", async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_fixture",
      client_secret: "test_secret",
      livemode: false,
    });
    await new StripeTestDomainPayments("sk_test_fixture").createCheckout(
      { ...order, paymentRef: null },
      "https://vigil.example.com/dashboard/domain",
    );
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ui_mode: "embedded",
        payment_method_types: ["card"],
        wallet_options: { link: { display: "never" } },
        payment_intent_data: expect.objectContaining({
          capture_method: "manual",
        }),
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 1500 }),
          }),
        ],
      }),
      { idempotencyKey: "domain-checkout:order" },
    );
  });
  it("reuses the existing Checkout and restores its secret without creating another payment", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...session(),
      id: "cs_test_fixture",
      status: "open",
      client_secret: "existing_secret",
    });
    expect(
      await new StripeTestDomainPayments("sk_test_fixture").createCheckout(
        order,
        "https://vigil.example.com/dashboard/domain",
      ),
    ).toEqual({
      sessionId: "cs_test_fixture",
      clientSecret: "existing_secret",
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it("uses stable Checkout parameters across retries", async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_fixture",
      client_secret: "existing_secret",
      livemode: false,
    });
    const payments = new StripeTestDomainPayments("sk_test_fixture");
    await payments.createCheckout(
      { ...order, paymentRef: null },
      "https://vigil.example.com/dashboard/domain",
    );
    const first = stripe.checkout.sessions.create.mock.calls[0];
    await payments.createCheckout(
      { ...order, paymentRef: null },
      "https://vigil.example.com/dashboard/domain",
    );
    expect(stripe.checkout.sessions.create.mock.calls[1]).toEqual(first);
    expect(first[0].expires_at).toBe(
      Math.floor(Date.parse(order.quoteExpiresAt) / 1000) + 30 * 60,
    );
  });
  it("reports an unpaid or expired Checkout without inventing a card authorization", async () => {
    const payments = new StripeTestDomainPayments("sk_test_fixture");
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...session(),
      status: "open",
      payment_intent: null,
    });
    expect(await payments.snapshot(order)).toEqual({
      state: "awaiting_payment",
      captureBefore: null,
    });
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...session(),
      status: "expired",
      payment_intent: null,
    });
    expect(await payments.snapshot(order)).toEqual({
      state: "canceled",
      captureBefore: null,
    });
    expect(stripe.paymentIntents.capture).not.toHaveBeenCalled();
  });
  it("expires an unpaid checkout but never closes a completed payment", async () => {
    const payments = new StripeTestDomainPayments("sk_test_fixture");
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...session(),
      id: "cs_test_fixture",
      status: "complete",
    });
    await expect(payments.expireUnpaidCheckout(order)).rejects.toThrow(
      /Reconcile/,
    );
    expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...session(),
      id: "cs_test_fixture",
      status: "open",
      payment_intent: null,
    });
    stripe.checkout.sessions.expire.mockResolvedValue({
      status: "expired",
      livemode: false,
    });
    await payments.expireUnpaidCheckout(order);
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledExactlyOnceWith(
      "cs_test_fixture",
    );
  });
  it("captures the exact authorized amount and refuses expired authorization", async () => {
    const s = session();
    stripe.checkout.sessions.retrieve.mockResolvedValue(s);
    const payments = new StripeTestDomainPayments("sk_test_fixture");
    stripe.paymentIntents.capture.mockResolvedValue({ ...s.payment_intent, status: "succeeded", amount_received: order.totalMinor });
    await payments.capture(order);
    expect(stripe.paymentIntents.capture).toHaveBeenCalledExactlyOnceWith(
      "pi_test",
      { amount_to_capture: 1500 },
      { idempotencyKey: "domain-capture:order" },
    );
    s.payment_intent.latest_charge.payment_method_details.card.capture_before = 1;
    await expect(payments.capture(order)).rejects.toThrow("expired");
    expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1);
  });
  it("keeps an uncertain capture response in reconciliation instead of reporting success", async () => {
    const value = session();
    stripe.checkout.sessions.retrieve.mockResolvedValue(value);
    stripe.paymentIntents.capture.mockResolvedValue({ ...value.payment_intent, status: "processing", amount_received: 0 });
    await expect(new StripeTestDomainPayments("sk_test_fixture").capture(order)).rejects.toThrow("capture result");
  });
  it("does not release an authorization until the cancellation response confirms it", async () => {
    const value = session();
    stripe.checkout.sessions.retrieve.mockResolvedValue(value);
    stripe.paymentIntents.cancel.mockResolvedValue(value.payment_intent);
    await expect(new StripeTestDomainPayments("sk_test_fixture").cancel(order)).rejects.toThrow("authorization needs reconciliation");
    stripe.paymentIntents.cancel.mockResolvedValue({ ...value.payment_intent, status: "canceled" });
    await expect(new StripeTestDomainPayments("sk_test_fixture").cancel(order)).resolves.toBeUndefined();
  });
  it("does not mark pending or partial refunds complete", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue(session());
    stripe.refunds.list.mockResolvedValue({
      data: [
        {
          metadata: { domain_order_id: "order" },
          amount: 1500,
          currency: "usd",
          status: "pending",
        },
      ],
    });
    const payments = new StripeTestDomainPayments("sk_test_fixture");
    await expect(payments.refund(order)).rejects.toThrow("processing");
    expect(stripe.refunds.create).not.toHaveBeenCalled();
    stripe.refunds.list.mockResolvedValue({
      data: [
        {
          metadata: { domain_order_id: "order" },
          amount: 500,
          currency: "usd",
          status: "succeeded",
        },
      ],
    });
    await expect(payments.refund(order)).rejects.toThrow();
  });
  it("rejects unsigned, invalid and live webhooks", () => {
    const payments = new StripeTestDomainPayments(
      "sk_test_fixture",
      "whsec_fixture",
    );
    expect(() => payments.verifyWebhook("{}", null)).toThrow("signature");
    stripe.webhooks.constructEvent.mockReturnValue({ livemode: true });
    expect(() => payments.verifyWebhook("{}", "signature")).toThrow(
      "signature",
    );
    stripe.webhooks.constructEvent.mockReturnValue({
      livemode: false,
      id: "evt_test",
    });
    expect(payments.verifyWebhook("{}", "signature").id).toBe("evt_test");
  });
});

describe("signed DNS consent", () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const input = {
    provider: "cloudflare" as const,
    urlSyncUX: "https://dash.cloudflare.com/domainconnect",
    fqdn: "fixture.com",
    records: [
      { type: "A" as const, name: "@", ttl: 300, value: "76.76.21.21" },
      {
        type: "CNAME" as const,
        name: "www",
        ttl: 300,
        value: "project.vercel-dns-017.com",
      },
      {
        type: "TXT" as const,
        name: "_vigil",
        ttl: 300,
        value: `vigil-verify=${"a".repeat(32)}`,
      },
    ],
    callbackOrigin: "https://vigilstudios.co",
    authorizationId: "10000000-0000-0000-0000-000000000001",
    nonce: createDnsCallbackNonce().nonce,
    privateKeyPem: keys.privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
    keyHost: "_domainconnect",
    providerTemplateApproved: true,
  };
  it("signs exact records and a nonce-bound fixed callback; signature is last", () => {
    const url = new URL(createDomainConnectApplyUrl(input));
    expect([...url.searchParams.keys()].at(-1)).toBe("sig");
    const signature = url.searchParams.get("sig")!;
    url.searchParams.delete("sig");
    url.searchParams.delete("key");
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(url.searchParams.toString()),
        keys.publicKey,
        Buffer.from(signature, "base64"),
      ),
    ).toBe(true);
    const callback = new URL(url.searchParams.get("redirect_uri")!);
    expect(callback.origin).toBe("https://vigilstudios.co");
    expect(callback.searchParams.get("nonce")).toBe(input.nonce);
    url.searchParams.set("wwwCname", "attacker.com");
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(url.searchParams.toString()),
        keys.publicKey,
        Buffer.from(signature, "base64"),
      ),
    ).toBe(false);
  });
  it("refuses unapproved templates, arbitrary provider origins and nonwebsite records", () => {
    expect(() =>
      createDomainConnectApplyUrl({
        ...input,
        providerTemplateApproved: false,
      }),
    ).toThrow("assisted setup");
    expect(() =>
      createDomainConnectApplyUrl({
        ...input,
        urlSyncUX: "https://attacker.com",
      }),
    ).toThrow();
    expect(() =>
      createDomainConnectApplyUrl({
        ...input,
        records: [
          ...input.records,
          { type: "TXT", name: "_dmarc", ttl: 300, value: "v=DMARC1" },
        ],
      }),
    ).toThrow("exact website records");
  });
  it("never fetches an arbitrary URL advertised by DNS", async () => {
    const resolver = {
      resolveNs: vi.fn().mockResolvedValue(["alice.ns.cloudflare.com"]),
      resolveTxt: vi.fn().mockResolvedValue([["http://127.0.0.1/internal"]]),
    };
    expect(await discoverDomainDns("fixture.com", resolver)).toMatchObject({
      dnsProvider: "cloudflare",
      domainConnectAdvertised: true,
    });
    expect(resolver.resolveTxt).toHaveBeenCalledExactlyOnceWith(
      "_domainconnect.fixture.com",
    );
  });
});

describe("Openprovider sandbox fallback", () => {
  const reply = (data: unknown) =>
    new Response(JSON.stringify({ code: 0, data }));
  it("maps current pricing and sends only to the fixed sandbox host", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        reply({
          results: [
            {
              domain: "fixture.com",
              status: "free",
              is_premium: false,
              price: { reseller: { price: 12, currency: "USD" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        reply({ price: { reseller: { price: 14, currency: "USD" } } }),
      );
    const registrar = new OpenproviderSandboxRegistrar(
      "sandbox-token",
      async () => "AB123456-NL",
      fetcher,
    );
    expect((await registrar.searchAndPrice(["fixture.com"]))[0]).toMatchObject({
      registration: { amountMinor: 1200 },
      renewal: { amountMinor: 1400 },
    });
    expect(
      fetcher.mock.calls.every(
        ([url, options]) =>
          new URL(String(url)).origin ===
            "https://api.sandbox.openprovider.nl" &&
          options?.redirect === "error",
      ),
    ).toBe(true);
  });
  it("does not map unsupported TLDs or premium quotes to ordinary purchases", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      reply({
        results: [
          {
            domain: "fixture.com",
            status: "free",
            is_premium: true,
            price: { reseller: { price: 12, currency: "USD" } },
          },
        ],
      }),
    );
    const registrar = new OpenproviderSandboxRegistrar(
      "sandbox-token",
      async () => "AB123456-NL",
      fetcher,
    );
    const quotes = await registrar.searchAndPrice([
      "fixture.com",
      "fixture.org",
    ]);
    expect(quotes.every((q) => q.availability === "unsupported")).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("uses a separately verified client contact, never an agency default", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        reply({
          results: [
            {
              domain: "fixture.com",
              status: "free",
              is_premium: false,
              price: { reseller: { price: 12, currency: "USD" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        reply({ price: { reseller: { price: 14, currency: "USD" } } }),
      )
      .mockResolvedValueOnce(reply({ id: 123, status: "ACT" }));
    const registrar = new OpenproviderSandboxRegistrar(
      "sandbox-token",
      async () => "AB123456-NL",
      fetcher,
    );
    expect(
      await registrar.register({
        intentId: order.id,
        organizationId: order.organizationId,
        fqdn: "fixture.com",
        years: 1,
        autoRenew: false,
        expectedRegistrarPrice: { amountMinor: 1200, currency: "usd" },
        contact: order.contact,
        acceptanceId: order.acceptanceId,
      }),
    ).toMatchObject({ externalId: "123", status: "succeeded" });
    expect(JSON.parse(fetcher.mock.calls[2][1]?.body as string)).toMatchObject({
      owner_handle: "AB123456-NL",
      autorenew: "off",
      period: 1,
    });
  });
});
