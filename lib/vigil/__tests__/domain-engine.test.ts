import { describe, expect, it, vi } from "vitest";
import {
  readDomainEngineConfig,
  assertLiveDomainOperationAllowed,
  assertMockAllowed,
} from "../domain-engine/config";
import { MockRegistrarAdapter } from "../domain-engine/mock";
import { normalizeDomain } from "../domain-engine/normalize";
import {
  DomainSecretCodec,
  createDomainSecretCodec,
} from "../domain-engine/secrets";
import { VercelRegistrarReadClient } from "../domain-engine/server-client";
import type { VerifiedRegistrationRequest } from "../domain-engine/contracts";

const config = readDomainEngineConfig({
  VIGIL_DOMAIN_ENGINE_ENABLED: "true",
  VIGIL_DOMAIN_REGISTRAR: "mock",
  VIGIL_DOMAIN_MOCK_ENABLED: "true",
  NODE_ENV: "test",
});
const context = {
  organizationId: "10000000-0000-0000-0000-000000000001",
  recordId: "20000000-0000-0000-0000-000000000001",
  purpose: "registrant" as const,
};
const contact = {
  firstName: "Test",
  lastName: "Owner",
  email: "test@example.test",
  phone: "+12125550100",
  address: {
    line1: "1 Test Street",
    city: "Test",
    region: "NY",
    postalCode: "10001",
    country: "US",
  },
};
function request(): VerifiedRegistrationRequest {
  return {
    intentId: "intent",
    organizationId: context.organizationId,
    fqdn: "vigil-fixture.com",
    years: 1,
    autoRenew: false,
    expectedRegistrarPrice: { amountMinor: 1200, currency: "usd" },
    acceptanceId: "acceptance",
    contact,
  };
}

describe("domain engine boundaries", () => {
  it("defaults off and cannot enable live mutations through environment flags", () => {
    expect(readDomainEngineConfig({})).toMatchObject({
      enabled: false,
      searchEnabled: false,
      registrar: "disabled",
      liveRegistrationEnabled: false,
      livePaymentsEnabled: false,
      dnsWritesEnabled: false,
    });
    expect(() => assertLiveDomainOperationAllowed()).toThrow(
      "separately approved",
    );
    expect(() =>
      assertMockAllowed(
        readDomainEngineConfig({
          ...process.env,
          NODE_ENV: "production",
          VIGIL_DOMAIN_ENGINE_ENABLED: "true",
          VIGIL_DOMAIN_REGISTRAR: "mock",
          VIGIL_DOMAIN_MOCK_ENABLED: "true",
        }),
      ),
    ).toThrow("not enabled");
    expect(() =>
      readDomainEngineConfig({ VIGIL_DOMAIN_REGISTRAR: "typo" }),
    ).toThrow("configuration");
  });
  it.each([
    "co.uk",
    "localhost",
    "example.local",
    "127.0.0.1",
    "https://user:pass@example.com",
    "example.com:443",
    "https://example.com/path",
    "a".repeat(64) + ".com",
    "example.com\\evil",
  ])("rejects invalid or reserved input %s", (input) => {
    expect(() => normalizeDomain(input)).toThrow("valid public domain");
  });
  it("normalizes case, IDNA and public suffixes without treating subdomains as registrations", () => {
    expect(normalizeDomain(" HTTPS://EXAMPLE.CO.UK/ ")).toMatchObject({
      fqdn: "example.co.uk",
      registrableDomain: "example.co.uk",
    });
    expect(normalizeDomain("münchen.de")).toMatchObject({
      fqdn: "xn--mnchen-3ya.de",
      requiresIdnReview: true,
    });
    expect(() =>
      normalizeDomain("www.example.com", { registration: true }),
    ).toThrow();
    expect(normalizeDomain("www.example.com").registrableDomain).toBe(
      "example.com",
    );
  });
});

describe("encrypted domain contacts", () => {
  const codec = new DomainSecretCodec({ k1: Buffer.alloc(32, 1) }, "k1");
  it("uses a fresh nonce and binds decryption to tenant, record and purpose", () => {
    const value = codec.encrypt(contact, context);
    expect(value).not.toContain(contact.email);
    expect(codec.encrypt(contact, context)).not.toBe(value);
    expect(codec.decrypt(value, context)).toEqual(contact);
    for (const changed of [
      { ...context, organizationId: "10000000-0000-0000-0000-000000000002" },
      { ...context, recordId: "20000000-0000-0000-0000-000000000002" },
      { ...context, purpose: "dns_authorization" as const },
    ])
      expect(() => codec.decrypt(value, changed)).toThrow(
        "protected domain information",
      );
  });
  it("rejects tampering, missing keys and malformed secrets without leaking values", () => {
    const envelope = JSON.parse(codec.encrypt(contact, context));
    envelope.tag = Buffer.alloc(16).toString("base64");
    expect(() => codec.decrypt(JSON.stringify(envelope), context)).toThrow(
      "protected domain information",
    );
    expect(() =>
      createDomainSecretCodec({ VIGIL_DOMAIN_ENCRYPTION_KEYS: "bad-secret" }),
    ).toThrow("protected domain information");
    expect(
      () => new DomainSecretCodec({ bad: Buffer.alloc(16) }, "bad"),
    ).toThrow();
  });
  it("can read an older key while writing with a new key", () => {
    const old = codec.encrypt(contact, context);
    const rotated = new DomainSecretCodec(
      { k1: Buffer.alloc(32, 1), k2: Buffer.alloc(32, 2) },
      "k2",
    );
    expect(rotated.decrypt(old, context)).toEqual(contact);
    expect(JSON.parse(rotated.encrypt(contact, context)).keyId).toBe("k2");
  });
});

describe("mock registrar contract", () => {
  it("returns exact names and an unavailable/unsupported distinction", async () => {
    const adapter = new MockRegistrarAdapter(
      {
        "vigil-fixture.com": { amountMinor: 1200, renewalMinor: 1400 },
        "taken.com": {
          amountMinor: 1200,
          renewalMinor: 1400,
          available: false,
        },
      },
      config,
    );
    const result = await adapter.searchAndPrice([
      "vigil-fixture.com",
      "taken.com",
      "unknown.com",
    ]);
    expect(result.map((quote) => quote.availability)).toEqual([
      "available",
      "unavailable",
      "unsupported",
    ]);
    expect(result[0].renewal?.amountMinor).toBe(1400);
  });
  it("deduplicates concurrent approved intents and rejects changed intent payloads", async () => {
    const adapter = new MockRegistrarAdapter(
      { "vigil-fixture.com": { amountMinor: 1200, renewalMinor: 1400 } },
      config,
    );
    const orders = await Promise.all([
      adapter.register(request()),
      adapter.register(request()),
    ]);
    expect(orders[0].externalId).toBe(orders[1].externalId);
    expect(await adapter.getDomainStatus("vigil-fixture.com")).toMatchObject({
      status: "registered",
      contactVerification: "pending",
    });
    await expect(adapter.register({ ...request(), years: 2 })).rejects.toThrow(
      "intent has changed",
    );
  });
  it("does not treat an unknown response as a failed or repeatable purchase", async () => {
    const adapter = new MockRegistrarAdapter(
      {
        "vigil-fixture.com": {
          amountMinor: 1200,
          renewalMinor: 1400,
          outcome: "unknown",
        },
      },
      config,
    );
    const order = await adapter.register(request());
    expect((await adapter.register(request())).externalId).toBe(
      order.externalId,
    );
    expect((await adapter.getOrderStatus(order.externalId))?.status).toBe(
      "unknown",
    );
    expect(await adapter.getDomainStatus("vigil-fixture.com")).toBeNull();
  });
  it("requires a new quote if registrar price changes", async () => {
    const adapter = new MockRegistrarAdapter(
      { "vigil-fixture.com": { amountMinor: 1300, renewalMinor: 1400 } },
      config,
    );
    await expect(adapter.register(request())).rejects.toThrow(
      "price has changed",
    );
  });
});

describe("read-only registrar transport", () => {
  it("uses only the official public search route without credentials or redirects", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ results: [] })));
    await new VercelRegistrarReadClient(fetcher).search(["EXAMPLE.COM"]);
    expect(String(fetcher.mock.calls[0][0])).toBe(
      "https://api.vercel.com/v1/registrar/domains/search",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      redirect: "error",
      cache: "no-store",
      body: '{"domains":["example.com"]}',
    });
    expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  });
  it("sanitizes provider errors and rejects invalid requests before network access", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("private-token", { status: 500 }));
    await expect(
      new VercelRegistrarReadClient(fetcher).search(["example.com"]),
    ).rejects.toThrow("temporarily unavailable");
    await expect(
      new VercelRegistrarReadClient(fetcher).search(["http://127.0.0.1"]),
    ).rejects.toThrow("valid public domain");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
