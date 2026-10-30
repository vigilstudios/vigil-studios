import { describe, expect, it, vi, afterEach } from "vitest";
import { openproviderContactPayload } from "../domain-engine/openprovider-contact";
import { OpenproviderSandboxRegistrar } from "../domain-engine/openprovider-sandbox";
import { domainTestRegistrar } from "../domain-engine/test-registrar";
import { FakeAdmin } from "./fake-admin";
import type { VerifiedRegistrationRequest } from "../domain-engine/contracts";
const acceptanceId = "10000000-0000-4000-8000-000000000001";
const request: VerifiedRegistrationRequest = {
  acceptanceId,
  intentId: "10000000-0000-4000-8000-000000000002",
  organizationId: "10000000-0000-4000-8000-000000000003",
  fqdn: "fixture.com",
  years: 1,
  autoRenew: false,
  expectedRegistrarPrice: { amountMinor: 1000, currency: "usd" },
  contact: {
    firstName: "Alex",
    lastName: "Example",
    organization: "Client Example",
    email: "client@example.test",
    phone: "+12125550100",
    address: {
      line1: "1 Example Street",
      city: "Example",
      region: "NY",
      postalCode: "10001",
      country: "US",
    },
    additional: {
      street_name: "Example Street",
      house_number: "1",
      phone_country_code: "+1",
      phone_area_code: "212",
      phone_subscriber_number: "5550100",
    },
  },
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("client-owned Openprovider sandbox contacts", () => {
  it("uses the exact approved client identity and explicitly supplied address/phone parts", () => {
    expect(openproviderContactPayload(request.contact, acceptanceId)).toEqual({
      name: {
        first_name: "Alex",
        last_name: "Example",
        full_name: "Alex Example",
      },
      company_name: "Client Example",
      email: "client@example.test",
      address: {
        street: "Example Street",
        number: "1",
        city: "Example",
        state: "NY",
        country: "US",
        zipcode: "10001",
      },
      phone: {
        country_code: "+1",
        area_code: "212",
        subscriber_number: "5550100",
      },
      comments: `Vigil consent ${acceptanceId}`,
    });
  });
  it("refuses to guess street/phone parts or mismatch the approved phone", () => {
    expect(() =>
      openproviderContactPayload(
        { ...request.contact, additional: {} },
        acceptanceId,
      ),
    ).toThrow(/Confirm/);
    expect(() =>
      openproviderContactPayload(
        { ...request.contact, phone: "+12125550101" },
        acceptanceId,
      ),
    ).toThrow(/must match/);
  });
  it("creates the client contact only on the fixed sandbox API", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ code: 0, data: { handle: "AE123456-US" } }),
        ),
      );
    const registrar = new OpenproviderSandboxRegistrar(
      "sandbox-token",
      async () => "unused",
      fetcher,
    );
    expect(await registrar.createRegistrantContact(request)).toBe(
      "AE123456-US",
    );
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(
      "https://api.sandbox.openprovider.nl/v1beta/customers",
    );
    expect(init).toMatchObject({ method: "POST", redirect: "error" });
    expect(JSON.parse(init.body).email).toBe("client@example.test");
  });
  it("requires the exact order correlation and approved owner before confirming registration", async () => {
    const domain = {
      id: 123,
      domain: { name: "fixture", extension: "com" },
      status: "ACT",
      owner_handle: "AE123456-US",
      comments: `Vigil order ${request.intentId}`,
      registry_expiration_date: "2027-10-24T00:00:00Z",
      autorenew: "off",
      verification_email_status: "verified",
    };
    const fetcher = vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({ code: 0, data: { results: [domain] } }),
          ),
      );
    const registrar = new OpenproviderSandboxRegistrar(
      "sandbox-token",
      async () => "AE123456-US",
      fetcher,
    );
    expect(
      await registrar.getDomainStatus(request.fqdn, request),
    ).toMatchObject({
      externalId: "123",
      contactVerification: "verified",
      expiresAt: "2027-10-24T00:00:00.000Z",
    });
    domain.owner_handle = "ZZ123456-US";
    await expect(
      registrar.getDomainStatus(request.fqdn, request),
    ).rejects.toThrow(/exact order/);
    domain.owner_handle = "AE123456-US";
    domain.comments = "Unrelated agency order";
    await expect(
      registrar.getDomainStatus(request.fqdn, request),
    ).rejects.toThrow(/exact order/);
  });
  it("does not allow production or disabled registrar configuration into the test runtime", () => {
    const admin = new FakeAdmin({});
    vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true");
    vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "vercel");
    expect(() => domainTestRegistrar(admin.asClient())).toThrow(
      /approved test registrar/,
    );
    vi.stubEnv("VIGIL_DOMAIN_REGISTRAR", "openprovider");
    vi.stubEnv("VIGIL_OPENPROVIDER_SANDBOX_ACCOUNT_ID", "");
    expect(() => domainTestRegistrar(admin.asClient())).toThrow(
      /sandbox account/,
    );
  });
});
