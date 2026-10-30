import "server-only";
import { randomUUID } from "node:crypto";
import { assertMockAllowed, type DomainEngineConfig } from "./config";
import { DomainEngineError } from "./errors";
import { normalizeDomain } from "./normalize";
import type {
  ContactSchema,
  DnsConnectionAdapter,
  ConnectionContext,
  RegistrarAdapter,
  RegistrarDomain,
  RegistrarOrder,
  RegistrarQuote,
  VerifiedRegistrationRequest,
} from "./contracts";

export type MockDomainFixture = {
  amountMinor: number;
  renewalMinor: number;
  available?: boolean;
  premium?: boolean;
  outcome?: RegistrarOrder["status"];
};

/** No network or payment client. Construction itself is forbidden in production. */
export class MockRegistrarAdapter implements RegistrarAdapter {
  readonly name = "mock" as const;
  readonly environment = "test" as const;
  private readonly orders = new Map<string, RegistrarOrder>();
  private readonly intents = new Map<
    string,
    { fingerprint: string; order: RegistrarOrder }
  >();
  private readonly domains = new Map<string, RegistrarDomain>();
  constructor(
    private readonly fixtures: Readonly<Record<string, MockDomainFixture>>,
    config: DomainEngineConfig,
    private readonly now: () => Date = () => new Date(),
  ) {
    assertMockAllowed(config);
  }

  async searchAndPrice(
    domains: string[],
    years = 1,
  ): Promise<RegistrarQuote[]> {
    if (
      !Number.isInteger(years) ||
      years < 1 ||
      years > 10 ||
      domains.length < 1 ||
      domains.length > 20
    )
      throw new DomainEngineError(
        "invalid_search",
        "Choose between one and twenty domains and a valid term.",
      );
    return domains.map((domain) => {
      const { fqdn } = normalizeDomain(domain, { registration: true });
      const fixture = this.fixtures[fqdn];
      const available =
        fixture && fixture.available !== false && !this.domains.has(fqdn);
      return {
        fqdn,
        availability: !fixture
          ? "unsupported"
          : available
            ? "available"
            : "unavailable",
        registration: available
          ? { amountMinor: fixture.amountMinor * years, currency: "usd" }
          : null,
        renewal: fixture
          ? { amountMinor: fixture.renewalMinor, currency: "usd" }
          : null,
        years,
        premium: fixture?.premium ?? false,
        expiresAt: new Date(this.now().getTime() + 5 * 60_000).toISOString(),
      };
    });
  }
  async getContactSchema(): Promise<ContactSchema> {
    return {
      required: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address.line1",
        "address.city",
        "address.region",
        "address.postalCode",
        "address.country",
      ],
      additional: [],
    };
  }
  async register(
    request: VerifiedRegistrationRequest,
  ): Promise<RegistrarOrder> {
    const fqdn = normalizeDomain(request.fqdn, { registration: true }).fqdn;
    const fingerprint = JSON.stringify({ ...request, fqdn });
    const prior = this.intents.get(request.intentId);
    if (prior) {
      if (prior.fingerprint !== fingerprint)
        throw new DomainEngineError(
          "intent_mismatch",
          "The registration intent has changed.",
        );
      return { ...prior.order };
    }
    const fixture = this.fixtures[fqdn];
    if (!fixture || fixture.available === false || this.domains.has(fqdn))
      throw new DomainEngineError(
        "domain_unavailable",
        "This domain is no longer available.",
      );
    if (
      !request.acceptanceId ||
      !request.organizationId ||
      !request.intentId ||
      request.years < 1 ||
      request.years > 10 ||
      !Number.isInteger(request.years)
    )
      throw new DomainEngineError(
        "invalid_registration",
        "The registration approval is incomplete.",
      );
    if (
      request.expectedRegistrarPrice.currency !== "usd" ||
      request.expectedRegistrarPrice.amountMinor !==
        fixture.amountMinor * request.years
    )
      throw new DomainEngineError(
        "price_changed",
        "The domain price has changed. Review a new quote.",
      );
    const order: RegistrarOrder = {
      externalId: `mock_order_${randomUUID()}`,
      fqdn,
      status: fixture.outcome ?? "succeeded",
      reason: fixture.outcome === "failed" ? "provider_failure" : null,
    };
    // Persist before yielding, so concurrent callers use the same intent.
    this.intents.set(request.intentId, { fingerprint, order });
    this.orders.set(order.externalId, order);
    if (order.status === "succeeded")
      this.domains.set(fqdn, {
        externalId: `mock_domain_${randomUUID()}`,
        fqdn,
        status: "registered",
        expiresAt: new Date(
          this.now().getTime() + request.years * 365 * 86_400_000,
        ).toISOString(),
        autoRenew: request.autoRenew,
        contactVerification: "pending",
      });
    return { ...order };
  }
  async getOrderStatus(id: string) {
    const order = this.orders.get(id);
    return order ? { ...order } : null;
  }
  async getDomainStatus(fqdn: string) {
    const domain = this.domains.get(normalizeDomain(fqdn).fqdn);
    return domain ? { ...domain } : null;
  }
  async renew(
    input: Parameters<RegistrarAdapter["renew"]>[0],
  ): Promise<RegistrarOrder> {
    const domain = this.domains.get(input.fqdn);
    const fixture = this.fixtures[input.fqdn];
    if (!domain || !fixture)
      throw new DomainEngineError(
        "domain_not_found",
        "The simulated registration was not found.",
      );
    if (
      !Number.isInteger(input.years) ||
      input.years < 1 ||
      input.years > 10 ||
      input.expectedRegistrarPrice.currency !== "usd" ||
      input.expectedRegistrarPrice.amountMinor !==
        fixture.renewalMinor * input.years
    )
      throw new DomainEngineError(
        "price_changed",
        "Review a new renewal quote.",
      );
    const fingerprint = JSON.stringify(input);
    const previous = this.intents.get(input.intentId);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new DomainEngineError(
          "intent_mismatch",
          "The renewal intent has changed.",
        );
      return { ...previous.order };
    }
    const order: RegistrarOrder = {
      externalId: `mock_renewal_${randomUUID()}`,
      fqdn: input.fqdn,
      status: "succeeded",
      reason: null,
    };
    this.intents.set(input.intentId, { fingerprint, order });
    this.orders.set(order.externalId, order);
    domain.expiresAt = new Date(
      new Date(domain.expiresAt!).getTime() + input.years * 365 * 86_400_000,
    ).toISOString();
    return { ...order };
  }
  async setAutoRenew(fqdn: string, enabled: boolean) {
    const domain = this.domains.get(fqdn);
    if (!domain)
      throw new DomainEngineError(
        "domain_not_found",
        "The simulated registration was not found.",
      );
    domain.autoRenew = enabled;
  }
  async requestTransferOut(fqdn: string) {
    if (!this.domains.has(fqdn))
      throw new DomainEngineError(
        "domain_not_found",
        "The simulated registration was not found.",
      );
    return { authCode: null, manualReview: true };
  }
}

export class MockDnsConnectionAdapter implements DnsConnectionAdapter {
  readonly name = "mock";
  constructor(
    config: DomainEngineConfig,
    private readonly supported = true,
  ) {
    assertMockAllowed(config);
  }
  async discover(fqdn: string) {
    return {
      fqdn: normalizeDomain(fqdn).fqdn,
      authoritativeNameservers: ["ns.example.test"],
      dnsProvider: this.supported ? "mock" : null,
      connectionMethod: this.supported
        ? ("domain_connect" as const)
        : ("assisted" as const),
    };
  }
  async prepareAuthorization(context: ConnectionContext) {
    return this.supported
      ? {
          url: `https://dns.example.test/approve?request=${encodeURIComponent(context.authorizationId)}`,
          expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        }
      : null;
  }
  async verifyExpectedRecords(context: ConnectionContext) {
    return {
      matches: this.supported && context.records.length > 0,
      checkedAt: new Date().toISOString(),
    };
  }
}
