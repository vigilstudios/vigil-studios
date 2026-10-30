import { describe, expect, it, vi } from "vitest";
import { NamecomProductionRegistrar, namecomAccountScope, type NamecomLiveAuthority } from "../domain-engine/namecom-production";
import { NamecomSandboxRegistrar, namecomContactPayload } from "../domain-engine/namecom-sandbox";
import type { VerifiedRegistrationRequest } from "../domain-engine/contracts";

const request: VerifiedRegistrationRequest = {
  intentId: "10000000-0000-4000-8000-000000000001", organizationId: "org", acceptanceId: "approval", fqdn: "fixture.com", years: 1, autoRenew: false,
  expectedRegistrarPrice: { amountMinor: 1200, currency: "usd" },
  contact: { firstName: "Test", lastName: "Owner", email: "owner@example.test", phone: "+12125550100", address: { line1: "1 Example Street", city: "Example", region: "NY", postalCode: "10001", country: "US" } },
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const discovery = { results: [{ domainName: request.fqdn, purchasable: true, premium: false, purchaseType: "registration" }] };
const pricing = { premium: false, purchasePrice: 12, renewalPrice: 14 };
const domain = { domainName: request.fqdn, expireDate: "2099-10-25T00:00:00Z", autorenewEnabled: false, nameservers: ["ns1.name.com", "ns2.name.com"], locks: [], contacts: { registrant: { ...namecomContactPayload(request.contact), isVerified: true } } };
const plan = (accountScope: string) => ({ fqdn: request.fqdn, accountScope, snapshotDigest: "a".repeat(64), expected: [{ type: "A" as const, name: "@", value: "76.76.21.21", ttl: 300 }], creates: [{ type: "A" as const, host: "", answer: "76.76.21.21", ttl: 300 }] });

describe("prepared Name.com production transport", () => {
  it("uses only the fixed production origin for read-only discovery and separates account references", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing));
    const registrar = new NamecomProductionRegistrar("fixture", "fake-live-token", 2500, undefined, fetcher);
    const [quote] = await registrar.searchAndPrice([request.fqdn]);
    expect(quote.registration?.amountMinor).toBe(1200);
    expect(registrar.environment).toBe("live");
    expect(registrar.accountScope).not.toBe(namecomAccountScope("fixture-test", "test"));
    expect(fetcher.mock.calls.every(([url]) => new URL(url).origin === "https://api.name.com")).toBe(true);
    expect(fetcher.mock.calls[0][1].redirect).toBe("error");
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(`Basic ${Buffer.from("fixture:fake-live-token").toString("base64")}`);
  });
  it("refuses the wrong environment username without any request", () => {
    const fetcher = vi.fn();
    expect(() => new NamecomProductionRegistrar("fixture-test", "fake", 2500, undefined, fetcher)).toThrow();
    expect(() => new NamecomSandboxRegistrar("fixture", "fake", 2500, fetcher)).toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("denies registration and DNS before any network call when authority is absent", async () => {
    const fetcher = vi.fn();
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, undefined, fetcher);
    await expect(registrar.register(request)).rejects.toThrow("separately approved");
    await expect(registrar.applyWebsiteDns(request, plan(registrar.accountScope))).rejects.toThrow("exact saved plan");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([0, 11.99, -1, null, "25", 12.001])(
    "refuses insufficient or invalid prepaid credit (%s) before registration",
    async (balance) => {
      const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing)).mockResolvedValueOnce(reply({ balance }));
      const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, { registration: vi.fn(), dns: vi.fn() }, fetcher);
      await expect(registrar.register(request)).rejects.toThrow("review registrar funding");
      expect(fetcher.mock.calls.some(([url]) => new URL(url).pathname === "/core/v1/domains")).toBe(false);
    },
  );
  it("fails closed when the funding read is unavailable and never submits a purchase", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing)).mockResolvedValue(reply({}, 503));
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, { registration: vi.fn(), dns: vi.fn() }, fetcher);
    await expect(registrar.register(request)).rejects.toThrow("review registrar funding");
    expect(fetcher.mock.calls.every(([url]) => new URL(url).pathname !== "/core/v1/domains")).toBe(true);
  });
  it("accepts exact available cents and refuses an invalid requirement without a request", async () => {
    const fetcher = vi.fn().mockResolvedValue(reply({ balance: 12.99 }));
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, undefined, fetcher);
    await registrar.assertRegistrationFunding(1299);
    expect(new URL(fetcher.mock.calls[0][0]).pathname).toBe("/core/v1/accountinfo/balance");
    fetcher.mockClear();
    await expect(registrar.assertRegistrationFunding(2501)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rechecks spending authority after preflight and does not buy after it expires", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing));
    fetcher.mockResolvedValueOnce(reply({ balance: 25 }));
    const registration = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("approval expired"));
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, { registration, dns: vi.fn() }, fetcher);
    await expect(registrar.register(request)).rejects.toThrow("approval expired");
    expect(registration).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.some(([url]) => new URL(url).pathname === "/core/v1/domains")).toBe(false);
  });
  it("sends approved client contacts, exact expected wholesale price and stable idempotency only in a mocked purchase", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing)).mockResolvedValueOnce(reply({ balance: 25 })).mockResolvedValueOnce(reply({ order: 123, totalPaid: 12, domain }));
    const registration = vi.fn(async () => {});
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, { registration, dns: vi.fn() }, fetcher);
    expect((await registrar.register(request)).externalId).toBe(`${registrar.accountScope}:order:123`);
    const options = fetcher.mock.calls[3][1];
    const body = JSON.parse(options.body);
    expect(body.domain.contacts.registrant).toEqual(namecomContactPayload(request.contact));
    expect(body.domain.autorenewEnabled).toBe(false);
    expect(body.purchasePrice).toBe(12);
    expect(options.headers["X-Idempotency-Key"]).toBe(`vigil-register-${request.intentId}`);
  });
  it("retains a known order reference when a purchase unexpectedly enables renewal", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(discovery)).mockResolvedValueOnce(reply(pricing)).mockResolvedValueOnce(reply({ balance: 25 })).mockResolvedValueOnce(reply({ order: 123, totalPaid: 12, domain: { ...domain, autorenewEnabled: true } }));
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, { registration: vi.fn(), dns: vi.fn() }, fetcher);
    const result = await registrar.register(request);
    expect(result.externalId).toBe(`${registrar.accountScope}:order:123`);
    expect(result.status).toBe("unknown");
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it("rechecks exact DNS authority immediately before each create", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input, options) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/records')) {
        expect(options?.method).toBe("GET");
        return reply({ records: [], totalCount: 0 });
      }
      return reply(domain);
    });
    const dns = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("approval expired"));
    const authority: NamecomLiveAuthority = { registration: vi.fn(), dns };
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, authority, fetcher);
    const approved = { ...request, registrarOrderRef: `${registrar.accountScope}:order:123` };
    // The real planner's digest is needed; all provider replies are fixtures.
    const prepared = await registrar.prepareWebsiteDns(approved, plan(registrar.accountScope).expected, `${registrar.accountScope}:domain:${request.fqdn}`);
    await expect(registrar.applyWebsiteDns(approved, prepared, `${registrar.accountScope}:domain:${request.fqdn}`)).rejects.toThrow();
    expect(dns).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([, options]) => options?.method === "GET")).toBe(true);
  });
  it("keeps renewals, automatic renewal and transfer-code disclosure disabled", async () => {
    const fetcher = vi.fn();
    const registrar = new NamecomProductionRegistrar("fixture", "fake", 2500, undefined, fetcher);
    await expect(registrar.renew()).rejects.toThrow("Paid renewal");
    await expect(registrar.setAutoRenew()).rejects.toThrow("explicit approval");
    expect(await registrar.requestTransferOut()).toEqual({ authCode: null, manualReview: true });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
