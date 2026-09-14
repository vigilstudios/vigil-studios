/* eslint-disable @typescript-eslint/no-unused-vars -- signatures mirror the interfaces; unused inputs are the point of a null provider */
import type {
  BillingCheckoutInput,
  BillingCustomerInput,
  BillingEvent,
  BillingProvider,
  BillingSubscriptionSnapshot,
  DeploymentProvider,
  DeploymentSnapshot,
  DnsRecordInput,
  DomainConfigSnapshot,
  DomainProvider,
  DomainRegistration,
  ProvisionSiteInput,
  RegistrantInput,
} from "./types";

/**
 * In-memory providers. They let the application boot, the job runner drain,
 * and unit tests exercise the services with no credentials. Nothing here is
 * persisted across requests; that is the point.
 */

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${(++counter).toString(36).padStart(4, "0")}`;
const nowIso = () => new Date().toISOString();

export class NullBillingProvider implements BillingProvider {
  readonly name = "null" as const;
  private subs = new Map<string, BillingSubscriptionSnapshot>();

  async createCustomer(_input: BillingCustomerInput) {
    return { externalId: nextId("cus_null") };
  }

  async createCheckoutSession(input: BillingCheckoutInput) {
    return { url: input.successUrl, externalId: nextId("cs_null") };
  }

  async getSubscription(externalId: string) {
    return this.subs.get(externalId) ?? null;
  }

  async cancelSubscription(externalId: string, options: { atPeriodEnd: boolean }) {
    const existing = this.subs.get(externalId) ?? {
      externalId,
      customerExternalId: "cus_null",
      priceExternalId: null,
      status: "active" as const,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEnd: null,
    };
    const updated: BillingSubscriptionSnapshot = options.atPeriodEnd
      ? { ...existing, cancelAtPeriodEnd: true }
      : { ...existing, status: "canceled", canceledAt: nowIso() };
    this.subs.set(externalId, updated);
    return updated;
  }

  async createPortalSession(_customerExternalId: string, returnUrl: string) {
    return { url: returnUrl };
  }

  async parseWebhook(rawBody: string, _signature: string | null): Promise<BillingEvent> {
    const raw = rawBody ? JSON.parse(rawBody) : {};
    return { externalEventId: nextId("evt_null"), type: "ignored", raw };
  }
}

export class NullDeploymentProvider implements DeploymentProvider {
  readonly name = "null" as const;
  private deployments = new Map<string, DeploymentSnapshot>();
  private domains = new Map<string, DomainConfigSnapshot>();

  async provisionSite(input: ProvisionSiteInput) {
    const externalId = nextId("site_null");
    return { externalId, previewUrl: `https://${input.name}.null.local` };
  }

  async triggerDeployment(siteExternalId: string, _input: { environment: "production" | "preview"; ref?: string }) {
    const snapshot: DeploymentSnapshot = {
      externalId: nextId("dpl_null"),
      status: "ready",
      url: `https://${siteExternalId}.null.local`,
      createdAt: nowIso(),
      readyAt: nowIso(),
      error: null,
    };
    this.deployments.set(snapshot.externalId, snapshot);
    return snapshot;
  }

  async getDeployment(externalId: string) {
    return this.deployments.get(externalId) ?? null;
  }

  async addDomain(_siteExternalId: string, hostname: string) {
    const config: DomainConfigSnapshot = {
      hostname,
      requiredRecords: [{ type: "A", name: "@", value: "0.0.0.0" }],
      verified: false,
      misconfigured: true,
      sslReady: false,
    };
    this.domains.set(hostname, config);
    return config;
  }

  async removeDomain(_siteExternalId: string, hostname: string) {
    this.domains.delete(hostname);
  }

  async getDomainConfig(siteExternalId: string, hostname: string) {
    return this.domains.get(hostname) ?? this.addDomain(siteExternalId, hostname);
  }

  async deleteSite(_siteExternalId: string) {
    /* no-op */
  }
}

export class NullDomainProvider implements DomainProvider {
  readonly name = "null" as const;
  private registrations = new Map<string, DomainRegistration>();

  async checkAvailability(hostname: string) {
    return { hostname, available: !this.registrations.has(hostname), priceCents: null, currency: null, premium: false };
  }

  async register(hostname: string, _registrant: RegistrantInput, options: { years: number; autoRenew: boolean }) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + options.years);
    const reg: DomainRegistration = {
      externalId: nextId("reg_null"),
      hostname,
      expiresAt: expires.toISOString(),
      autoRenew: options.autoRenew,
      nameservers: ["ns1.null.local", "ns2.null.local"],
    };
    this.registrations.set(hostname, reg);
    return reg;
  }

  async getRegistration(externalId: string) {
    for (const reg of this.registrations.values()) if (reg.externalId === externalId) return reg;
    return null;
  }

  async setAutoRenew(externalId: string, autoRenew: boolean) {
    const reg = await this.getRegistration(externalId);
    if (reg) reg.autoRenew = autoRenew;
  }

  async upsertDnsRecords(_zoneExternalId: string, _records: DnsRecordInput[]) {
    /* no-op */
  }

  async lookupDns(_hostname: string): Promise<{ type: string; name: string; value: string }[]> {
    return [];
  }
}
