import { describe, expect, it, vi } from "vitest";
import {
  NamecomSandboxRegistrar,
  namecomContactPayload,
  namecomSandboxScope,
} from "../domain-engine/namecom-sandbox";
import { domainRegistrarAccountScope } from "../domain-engine/provider-scope";
import type { VerifiedRegistrationRequest } from "../domain-engine/contracts";
import { prepareTestDomainCheckout } from "../domain-engine/test-checkout";
import { FakeAdmin } from "./fake-admin";

const username = "vigil-fixture-test";
const scope = namecomSandboxScope(username);
const ref = `${scope}:order:123`;
const approved: VerifiedRegistrationRequest = {
  intentId: "10000000-0000-4000-8000-000000000001",
  organizationId: "org",
  fqdn: "fixture.com",
  years: 1,
  autoRenew: false,
  acceptanceId: "acceptance",
  expectedRegistrarPrice: { amountMinor: 1200, currency: "usd" },
  registrarOrderRef: ref,
  contact: {
    firstName: "Test",
    lastName: "Owner",
    organization: "Fictional Client",
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
const domain = () => ({
  domainName: "fixture.com",
  expireDate: "2027-10-25T00:00:00Z",
  autorenewEnabled: false,
  contacts: {
    registrant: {
      ...namecomContactPayload(approved.contact),
      isVerified: false,
    },
  },
  locks: [] as string[],
});
const receipt = () => ({
  id: 123,
  currency: "USD",
  status: "success",
  finalAmount: 12,
  totalCapture: 12,
  totalRefund: 0,
  orderItems: [
    {
      name: "fixture.com",
      type: "registration",
      status: "success",
      duration: 1,
      interval: "year",
      price: 12,
      quantity: 1,
      taxAmount: 0,
    },
  ],
});
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
function receiptReply(value = receipt()) {
  return reply({ orders: [value], totalCount: 1 });
}
function setup() {
  const fetcher = vi.fn<typeof fetch>();
  return {
    fetcher,
    adapter: new NamecomSandboxRegistrar(
      username,
      "secret-sandbox-token",
      2500,
      fetcher,
    ),
  };
}
function quotes(fetcher: ReturnType<typeof setup>["fetcher"], price = 12) {
  fetcher
    .mockResolvedValueOnce(
      reply({
        results: [
          {
            domainName: "fixture.com",
            purchasable: true,
            purchaseType: "registration",
            premium: false,
          },
        ],
      }),
    )
    .mockResolvedValueOnce(
      reply({ purchasePrice: price, renewalPrice: 14, premium: false }),
    );
}
describe("Name.com sandbox trust boundaries", () => {
  it("rejects a prior registrar's quote before creating any payment or purchase", async () => {
    vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
    vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
    vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "namecom");
    const id = "10000000-0000-4000-8000-000000000002";
    const db = new FakeAdmin({
      domain_quotes: [
        { id, organization_id: "org", environment: "test", registrar: "mock" },
      ],
    });
    const rpc = vi.spyOn(db, "rpc");
    try {
      await expect(
        prepareTestDomainCheckout(
          db.asClient(),
          "org",
          "owner",
          {
            quoteId: id,
            intentId: approved.intentId,
            totalMinor: 1200,
            currency: "usd",
            contact: approved.contact,
            autoRenew: false,
            acceptTerms: true,
            acceptContactTransmission: true,
          },
          "http://localhost:3187/domain-engine-test",
        ),
      ).rejects.toThrow("fresh quote");
      expect(rpc).not.toHaveBeenCalled();
      expect(db.rows("provider_links")).toHaveLength(0);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("rejects live usernames, malformed auth and missing cost ceilings", () => {
    for (const name of ["vigil", "vigil:test", "bad\n-test", ""])
      expect(() => namecomSandboxScope(name)).toThrow();
    expect(() => new NamecomSandboxRegistrar(username, "token", NaN)).toThrow();
    expect(
      domainRegistrarAccountScope("namecom", "test", {
        VIGIL_NAMECOM_SANDBOX_USERNAME: username,
      }),
    ).toBe(scope);
    expect(() => domainRegistrarAccountScope("namecom", "live", {})).toThrow();
    expect(scope).not.toContain(username);
  });
  it("quotes exact USD cents from authoritative pricing, never a discovery estimate", async () => {
    const { fetcher, adapter } = setup();
    quotes(fetcher);
    expect(
      (await adapter.searchAndPrice(["fixture.com", "fixture.org"]))[0],
    ).toMatchObject({
      availability: "available",
      registration: { amountMinor: 1200, currency: "usd" },
      renewal: { amountMinor: 1400 },
    });
    expect(
      fetcher.mock.calls.every(
        ([u, o]) =>
          new URL(String(u)).origin === "https://api.dev.name.com" &&
          o?.redirect === "error",
      ),
    ).toBe(true);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      domainNames: ["fixture.com"],
      purchaseType: "registration",
    });
  });
  it.each([
    { premium: true, purchaseType: "registration" },
    { premium: false, purchaseType: "aftermarket_s" },
    { premium: false, purchaseType: "backorder" },
  ])("excludes premium and acquisition orders %j", async (flags) => {
    const { fetcher, adapter } = setup();
    fetcher.mockResolvedValue(
      reply({
        results: [{ domainName: "fixture.com", purchasable: true, ...flags }],
      }),
    );
    expect(
      (await adapter.searchAndPrice(["fixture.com"]))[0].availability,
    ).toBe("unsupported");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("refuses quotes above the sandbox limit and prices with fractional cents", async () => {
    const { fetcher, adapter } = setup();
    quotes(fetcher, 50);
    expect(
      (await adapter.searchAndPrice(["fixture.com"]))[0].availability,
    ).toBe("unsupported");
    quotes(fetcher, 12.001);
    await expect(adapter.searchAndPrice(["fixture.com"])).rejects.toThrow();
  });
  it("submits explicit client ownership, expected price and one stable idempotency key", async () => {
    const { fetcher, adapter } = setup();
    quotes(fetcher);
    fetcher.mockResolvedValueOnce(
      reply({ domain: domain(), order: 123, totalPaid: 12 }),
    );
    expect(await adapter.register(approved)).toEqual({
      externalId: ref,
      fqdn: "fixture.com",
      status: "succeeded",
      reason: null,
    });
    const options = fetcher.mock.calls[2][1]!;
    expect(options.headers).toMatchObject({
      "X-Idempotency-Key": `vigil-register-${approved.intentId}`,
    });
    expect(JSON.parse(String(options.body))).toMatchObject({
      years: 1,
      purchaseType: "registration",
      purchasePrice: 12,
      domain: {
        autorenewEnabled: false,
        contacts: {
          registrant: {
            companyName: "Fictional Client",
            email: "owner@example.test",
          },
        },
      },
    });
  });
  it.each(["price", "owner", "malformed"])(
    "preserves the submitted order reference after unexpected %s evidence",
    async (kind) => {
      const { fetcher, adapter } = setup();
      quotes(fetcher);
      const d = domain();
      if (kind === "owner")
        d.contacts.registrant.companyName = "Unexpected Owner";
      fetcher.mockResolvedValueOnce(
        reply({
          order: 123,
          totalPaid: kind === "price" ? 13 : 12,
          domain: kind === "malformed" ? {} : d,
        }),
      );
      expect(await adapter.register(approved)).toEqual({
        externalId: ref,
        fqdn: "fixture.com",
        status: "unknown",
        reason: null,
      });
      expect(fetcher).toHaveBeenCalledTimes(3);
    },
  );
  it("does not submit if price changes or renewal standing consent is requested", async () => {
    const { fetcher, adapter } = setup();
    quotes(fetcher, 13);
    await expect(adapter.register(approved)).rejects.toThrow(
      "fresh registrar quote",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
    await expect(
      adapter.register({ ...approved, autoRenew: true }),
    ).rejects.toThrow("renewal off");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("never retries a timed-out create or exposes provider error details", async () => {
    const { fetcher, adapter } = setup();
    quotes(fetcher);
    fetcher.mockRejectedValueOnce(
      new Error("secret-sandbox-token private contact"),
    );
    await expect(adapter.register(approved)).rejects.toThrow(
      "needs reconciliation",
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
    fetcher.mockResolvedValueOnce(
      reply({ message: "secret-sandbox-token private contact" }, 401),
    );
    await expect(adapter.getOrderStatus(ref)).rejects.toThrow("sandbox access");
  });
  it("retries only safe transient reads, with no auth or purchase retry", async () => {
    const { fetcher, adapter } = setup();
    fetcher
      .mockRejectedValueOnce(new Error("temporary timeout"))
      .mockResolvedValueOnce(receiptReply());
    expect(await adapter.getOrderStatus(ref)).toMatchObject({
      status: "succeeded",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    fetcher
      .mockResolvedValueOnce(reply({}, 503))
      .mockResolvedValueOnce(receiptReply());
    expect(await adapter.getOrderStatus(ref)).toMatchObject({
      status: "succeeded",
    });
    expect(fetcher).toHaveBeenCalledTimes(4);
    fetcher.mockResolvedValueOnce(reply({}, 401));
    await expect(adapter.getOrderStatus(ref)).rejects.toThrow("sandbox access");
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
  it("rejects another account's receipt before contacting the provider", async () => {
    const { fetcher, adapter } = setup();
    await expect(
      adapter.getOrderStatus(
        `${namecomSandboxScope("another-test")}:order:123`,
      ),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reconciles order and exact client owner before accepting an asset", async () => {
    const { fetcher, adapter } = setup();
    fetcher
      .mockResolvedValueOnce(receiptReply())
      .mockResolvedValueOnce(reply(domain()));
    expect(
      await adapter.getDomainStatus("fixture.com", approved),
    ).toMatchObject({
      externalId: `${scope}:domain:fixture.com`,
      status: "registered",
      contactVerification: "pending",
      autoRenew: false,
    });
  });
  it.each([
    "price",
    "owner",
    "domain",
    "tax",
    "term",
    "currency",
    "final",
    "capture",
    "refund",
  ])("refuses mismatched %s evidence", async (mismatch) => {
    const { fetcher, adapter } = setup();
    const r = receipt();
    const d = domain();
    if (mismatch === "price") r.orderItems[0].price = 13;
    if (mismatch === "owner")
      d.contacts.registrant.companyName = "Vigil Agency";
    if (mismatch === "domain") r.orderItems[0].name = "someone-else.com";
    if (mismatch === "tax") r.orderItems[0].taxAmount = 1;
    if (mismatch === "term") r.orderItems[0].duration = 2;
    if (mismatch === "currency") r.currency = "CNY";
    if (mismatch === "final") r.finalAmount = 13;
    if (mismatch === "capture") r.totalCapture = 0;
    if (mismatch === "refund") r.totalRefund = 12;
    fetcher
      .mockResolvedValueOnce(receiptReply(r))
      .mockResolvedValueOnce(reply(d));
    await expect(
      adapter.getDomainStatus("fixture.com", approved),
    ).rejects.toThrow();
  });
  it("finds only the exact saved receipt across bounded pages", async () => {
    const { fetcher, adapter } = setup();
    fetcher
      .mockResolvedValueOnce(
        reply({ orders: [{ ...receipt(), id: 124 }], nextPage: 2 }),
      )
      .mockResolvedValueOnce(receiptReply());
    expect(await adapter.getOrderStatus(ref)).toMatchObject({
      externalId: ref,
      status: "succeeded",
    });
    expect(String(fetcher.mock.calls[1][0])).toContain("page=2&perPage=100");
  });
  it.each(["missing", "duplicate", "bad-pagination"])(
    "rejects %s receipt lookup",
    async (kind) => {
      const { fetcher, adapter } = setup();
      const list =
        kind === "duplicate"
          ? { orders: [receipt(), receipt()] }
          : kind === "bad-pagination"
            ? { orders: [], nextPage: 3 }
            : { orders: [{ ...receipt(), id: 124 }] };
      fetcher.mockResolvedValueOnce(reply(list));
      await expect(adapter.getOrderStatus(ref)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("uses a saved account-scoped registration for ongoing owner reads without fetching historical orders", async () => {
    const { fetcher, adapter } = setup();
    fetcher.mockResolvedValueOnce(reply(domain()));
    expect(
      await adapter.getRegisteredDomainStatus(
        "fixture.com",
        approved,
        `${scope}:domain:fixture.com`,
      ),
    ).toMatchObject({ status: "registered" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toContain("/domains/fixture.com");
    await expect(
      adapter.getRegisteredDomainStatus(
        "fixture.com",
        approved,
        `${namecomSandboxScope("other-test")}:domain:fixture.com`,
      ),
    ).rejects.toThrow();
    await expect(
      adapter.getRegisteredDomainStatus(
        "fixture.com",
        { ...approved, registrarOrderRef: undefined },
        `${scope}:domain:fixture.com`,
      ),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("requires receipt binding even when a same-name domain exists in the account", async () => {
    const { fetcher, adapter } = setup();
    await expect(
      adapter.getDomainStatus("fixture.com", {
        ...approved,
        registrarOrderRef: undefined,
      }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("preserves external nameservers and rechecks ownership before DNS preparation", async () => {
    for (const changedOwner of [false, true]) {
      const { fetcher, adapter } = setup();
      const current = {
        ...domain(),
        nameservers: changedOwner
          ? ["ns1.name.com", "ns2.name.com"]
          : ["ns1.other.example", "ns2.other.example"],
      };
      if (changedOwner)
        current.contacts.registrant.companyName = "Another Owner";
      fetcher
        .mockResolvedValueOnce(receiptReply())
        .mockResolvedValueOnce(reply(domain()))
        .mockResolvedValueOnce(reply(current));
      await expect(
        adapter.prepareWebsiteDns(approved, [
          { type: "A", name: "@", value: "76.76.21.21", ttl: 300 },
        ]),
      ).rejects.toThrow();
      expect(fetcher.mock.calls.every(([, o]) => o?.method === "GET")).toBe(
        true,
      );
    }
  });
  it("surfaces holds and expiry without declaring the website live", async () => {
    const { fetcher, adapter } = setup();
    const d = domain();
    d.locks = ["clientHold"];
    fetcher
      .mockResolvedValueOnce(receiptReply())
      .mockResolvedValueOnce(reply(d));
    expect(
      (await adapter.getDomainStatus("fixture.com", approved))?.status,
    ).toBe("contact_hold");
    d.expireDate = "2020-01-01T00:00:00Z";
    fetcher
      .mockResolvedValueOnce(receiptReply())
      .mockResolvedValueOnce(reply(d));
    expect(
      (await adapter.getDomainStatus("fixture.com", approved))?.status,
    ).toBe("expired");
    await expect(adapter.renew()).rejects.toThrow("approved lifecycle");
    await expect(adapter.setAutoRenew()).rejects.toThrow("approval");
  });
});
