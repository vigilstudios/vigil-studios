/**
 * Provider-neutral interfaces (master architecture §7).
 *
 *   Vigil Website      -> DeploymentService -> DeploymentProvider
 *   Vigil Domain       -> DomainService     -> DomainProvider
 *   Vigil Subscription -> BillingService    -> BillingProvider
 *
 * Every method returns normalized Vigil shapes. Provider object ids come back
 * as `externalId` strings that the services record in `provider_links`;
 * nothing above the adapter layer sees a provider SDK object. Errors are
 * `ProviderError` with `retryable` so the job runner can decide.
 */

export type ProviderName = "stripe" | "vercel" | "cloudflare" | "null";

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------
export type NormalizedSubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "paused"
  | "canceled";

export type BillingCustomerInput = {
  organizationId: string;
  email: string;
  name: string;
};

export type BillingCheckoutInput = {
  organizationId: string;
  customerExternalId: string;
  priceExternalId: string;
  successUrl: string;
  cancelUrl: string;
  /** Echoed back on webhooks so the event can be matched to Vigil entities. */
  reference: Record<string, string>;
};

export type BillingSubscriptionSnapshot = {
  externalId: string;
  customerExternalId: string;
  priceExternalId: string | null;
  status: NormalizedSubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEnd: string | null;
};

export type BillingEvent = {
  externalEventId: string;
  type:
    | "subscription.created"
    | "subscription.updated"
    | "subscription.deleted"
    | "invoice.paid"
    | "invoice.payment_failed"
    | "checkout.completed"
    | "ignored";
  subscription?: BillingSubscriptionSnapshot;
  reference?: Record<string, string>;
  raw: unknown;
};

export interface BillingProvider {
  readonly name: ProviderName;
  createCustomer(input: BillingCustomerInput): Promise<{ externalId: string }>;
  createCheckoutSession(input: BillingCheckoutInput): Promise<{ url: string; externalId: string }>;
  getSubscription(externalId: string): Promise<BillingSubscriptionSnapshot | null>;
  cancelSubscription(externalId: string, options: { atPeriodEnd: boolean }): Promise<BillingSubscriptionSnapshot>;
  createPortalSession(customerExternalId: string, returnUrl: string): Promise<{ url: string }>;
  /** Verify and normalize a webhook. Must reject bad signatures. */
  parseWebhook(rawBody: string, signature: string | null): Promise<BillingEvent>;
}

// ---------------------------------------------------------------------------
// Deployment
// ---------------------------------------------------------------------------
export type NormalizedDeploymentStatus = "queued" | "building" | "ready" | "error" | "canceled";

export type ProvisionSiteInput = {
  websiteId: string;
  organizationId: string;
  /** Provider-facing name; must be unique per provider account. */
  name: string;
  templateSlug: string | null;
  /** Undecided topology: 'dedicated' | 'shared' | null. Adapters may ignore. */
  hostingMode: string | null;
};

export type DeploymentSnapshot = {
  externalId: string;
  status: NormalizedDeploymentStatus;
  url: string | null;
  createdAt: string | null;
  readyAt: string | null;
  error: { code: string; message: string } | null;
};

export type DomainConfigSnapshot = {
  hostname: string;
  /** Records the customer must create at their registrar. */
  requiredRecords: { type: "A" | "AAAA" | "CNAME" | "TXT"; name: string; value: string }[];
  verified: boolean;
  misconfigured: boolean;
  sslReady: boolean;
};

export interface DeploymentProvider {
  readonly name: ProviderName;
  provisionSite(input: ProvisionSiteInput): Promise<{ externalId: string; previewUrl: string | null }>;
  triggerDeployment(siteExternalId: string, input: { environment: "production" | "preview"; ref?: string }): Promise<DeploymentSnapshot>;
  getDeployment(externalId: string): Promise<DeploymentSnapshot | null>;
  addDomain(siteExternalId: string, hostname: string): Promise<DomainConfigSnapshot>;
  removeDomain(siteExternalId: string, hostname: string): Promise<void>;
  getDomainConfig(siteExternalId: string, hostname: string): Promise<DomainConfigSnapshot>;
  deleteSite(siteExternalId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Domains (registration + DNS)
// ---------------------------------------------------------------------------
export type DomainAvailability = {
  hostname: string;
  available: boolean;
  /** Provider's wholesale price; Vigil's customer price is product policy. */
  priceCents: number | null;
  currency: string | null;
  premium: boolean;
};

export type RegistrantInput = {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address: { line1: string; line2?: string; city: string; region: string; postalCode: string; country: string };
};

export type DomainRegistration = {
  externalId: string;
  hostname: string;
  expiresAt: string | null;
  autoRenew: boolean;
  nameservers: string[];
};

export type DnsRecordInput = { type: "A" | "AAAA" | "CNAME" | "TXT" | "MX"; name: string; value: string; ttl?: number };

export interface DomainProvider {
  readonly name: ProviderName;
  checkAvailability(hostname: string): Promise<DomainAvailability>;
  register(hostname: string, registrant: RegistrantInput, options: { years: number; autoRenew: boolean }): Promise<DomainRegistration>;
  getRegistration(externalId: string): Promise<DomainRegistration | null>;
  setAutoRenew(externalId: string, autoRenew: boolean): Promise<void>;
  /** Manage DNS for a zone Vigil controls (purchased through Vigil). */
  upsertDnsRecords(zoneExternalId: string, records: DnsRecordInput[]): Promise<void>;
  /** For customer-owned domains: resolve what is currently published. */
  lookupDns(hostname: string): Promise<{ type: string; name: string; value: string }[]>;
}
