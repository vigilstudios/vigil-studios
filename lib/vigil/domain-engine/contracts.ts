/** Domain Engine v2 contracts. Provider identifiers stay in server-only provider_links. */
export type RegistrarName = "vercel" | "openprovider" | "namecom" | "mock";
export type DomainEnvironment = "test" | "live";
export type Money = { amountMinor: number; currency: string };

export type RegistrarQuote = {
  fqdn: string;
  availability: "available" | "unavailable" | "unsupported";
  registration: Money | null;
  renewal: Money | null;
  years: number;
  premium: boolean;
  expiresAt: string;
};

export type RegistrantContact = {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  additional?: Record<string, string>;
};

export type ContactSchema = {
  required: string[];
  additional: {
    key: string;
    label: string;
    required: boolean;
    choices?: string[];
  }[];
};

export type RegistrarOrder = {
  externalId: string;
  fqdn: string;
  status: "pending" | "succeeded" | "failed" | "unknown" | "action_required";
  reason:
    | "contact_verification"
    | "unavailable"
    | "price_changed"
    | "provider_failure"
    | null;
};

export type RegistrarDomain = {
  externalId: string;
  fqdn: string;
  status: "registered" | "contact_hold" | "expired" | "transferred";
  expiresAt: string | null;
  autoRenew: boolean;
  contactVerification: "pending" | "verified" | "failed";
};

/** Created only after the server binds durable quote, consent and payment evidence. */
export type VerifiedRegistrationRequest = {
  intentId: string;
  organizationId: string;
  fqdn: string;
  years: number;
  autoRenew: boolean;
  expectedRegistrarPrice: Money;
  contact: RegistrantContact;
  acceptanceId: string;
  /** Server-bound receipt reference, supplied only during reconciliation. */
  registrarOrderRef?: string;
};

export interface RegistrarAdapter {
  readonly name: RegistrarName;
  readonly environment: DomainEnvironment;
  searchAndPrice(domains: string[], years?: number): Promise<RegistrarQuote[]>;
  getContactSchema(fqdn: string, country: string): Promise<ContactSchema>;
  register(request: VerifiedRegistrationRequest): Promise<RegistrarOrder>;
  getOrderStatus(externalId: string): Promise<RegistrarOrder | null>;
  getDomainStatus(
    fqdn: string,
    approvedRegistration?: VerifiedRegistrationRequest,
  ): Promise<RegistrarDomain | null>;
  renew(input: {
    fqdn: string;
    years: number;
    intentId: string;
    expectedRegistrarPrice: Money;
  }): Promise<RegistrarOrder>;
  setAutoRenew(fqdn: string, enabled: boolean): Promise<void>;
  requestTransferOut(
    fqdn: string,
  ): Promise<{ authCode: string | null; manualReview: boolean }>;
}

export type ExpectedDnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  ttl: number;
};
export type DnsDiscovery = {
  fqdn: string;
  authoritativeNameservers: string[];
  dnsProvider: string | null;
  connectionMethod: "domain_connect" | "delegated_api" | "assisted";
};
export type ConnectionContext = {
  authorizationId: string;
  organizationId: string;
  fqdn: string;
  records: ExpectedDnsRecord[];
  callbackUrl: string;
};
export interface DnsConnectionAdapter {
  readonly name: string;
  discover(fqdn: string): Promise<DnsDiscovery>;
  prepareAuthorization(
    context: ConnectionContext,
  ): Promise<{ url: string; expiresAt: string } | null>;
  verifyExpectedRecords(
    context: ConnectionContext,
  ): Promise<{ matches: boolean; checkedAt: string }>;
}

export type DomainEventType =
  | "quoted"
  | "consent_recorded"
  | "payment_updated"
  | "registration_updated"
  | "connection_updated"
  | "manual_review"
  | "renewal_updated"
  | "transfer_requested";
export type DomainReasonCode =
  | "quote_expired"
  | "price_changed"
  | "unavailable"
  | "payment_failed"
  | "capture_failed"
  | "refund_pending"
  | "provider_unknown"
  | "provider_failed"
  | "contact_required"
  | "attachment_failed"
  | "dns_authorization_required"
  | "dns_unsupported"
  | "ssl_pending"
  | "transfer_required";
