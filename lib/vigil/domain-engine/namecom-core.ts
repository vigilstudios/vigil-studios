import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  RegistrarAdapter,
  DomainEnvironment,
  RegistrarDomain,
  RegistrarOrder,
  RegistrarQuote,
  RegistrantContact,
  VerifiedRegistrationRequest,
  ExpectedDnsRecord,
} from "./contracts";
import { DomainEngineError, RegistrationNotSubmittedError } from "./errors";
import { normalizeDomain } from "./normalize";
import { registrantSchema } from "./validation";
import { NamecomSandboxDns, type NamecomDnsPlan } from "./namecom-dns";

const discovery = z.object({
  results: z.array(
    z.object({
      domainName: z.string(),
      purchasable: z.boolean(),
      premium: z.boolean().default(false),
      purchaseType: z.string().optional(),
    }),
  ),
});
const pricing = z.object({
  premium: z.boolean().default(false),
  purchasePrice: z.number().nullable(),
  renewalPrice: z.number().nullable(),
});
const domainSchema = z.object({
  domainName: z.string(),
  expireDate: z.string(),
  autorenewEnabled: z.boolean().default(false),
  locks: z.array(z.string()).default([]),
  nameservers: z.array(z.string()).default([]),
  contacts: z.object({ registrant: z.record(z.unknown()) }),
});
const orderSchema = z.object({
  id: z.number().int().positive(),
  currency: z.literal("USD"),
  status: z.string(),
  finalAmount: z.number(),
  totalCapture: z.number(),
  totalRefund: z.number().default(0),
  orderItems: z.array(
    z.object({
      name: z.string().nullable(),
      type: z.string(),
      status: z.string(),
      duration: z.number().int(),
      interval: z.string().nullable(),
      price: z.number(),
      quantity: z.number().int(),
      taxAmount: z.number().nullable().optional(),
    }),
  ),
});

/** Fixed environment origins; references cannot cross reseller accounts or test/live. */
export function namecomAccountScope(
  username: string,
  environment: DomainEnvironment,
) {
  if (
    !username ||
    /[\s:\r\n]/.test(username) ||
    username.length > 260 ||
    (environment === "test"
      ? !username.endsWith("-test")
      : username.endsWith("-test"))
  )
    throw new DomainEngineError(
      "registrar_credentials_missing",
      "Configure the matching Name.com account username and API token.",
      503,
    );
  return `namecom:${environment}:${createHash("sha256").update(username.toLowerCase()).digest("hex")}`;
}
export function namecomSandboxScope(username: string) {
  return namecomAccountScope(username, "test");
}

/** Server-side authority must bind the durable approved order/plan and spending ceiling.
 * No environment flag or browser parameter grants this authority. */
export type NamecomLiveAuthority = {
  registration(request: VerifiedRegistrationRequest): Promise<void>;
  dns(
    request: VerifiedRegistrationRequest,
    plan: NamecomDnsPlan,
  ): Promise<void>;
};
const deniedLiveAuthority: NamecomLiveAuthority = {
  async registration() {
    throw new DomainEngineError(
      "domain_live_operation_disabled",
      "Live registration requires a separately approved order and release.",
      403,
    );
  },
  async dns() {
    throw new DomainEngineError(
      "domain_live_operation_disabled",
      "Production DNS requires approval of the exact saved plan.",
      403,
    );
  },
};

/** Explicit client contacts are mandatory. Never fall back to reseller account defaults. */
export function namecomContactPayload(raw: RegistrantContact) {
  const c = registrantSchema.parse(raw);
  if (!/^\+[1-9]\d{7,14}$/.test(c.phone))
    throw new DomainEngineError(
      "contact_invalid",
      "Use a complete international phone number for the registrant.",
    );
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    companyName: c.organization ?? "",
    email: c.email,
    phone: c.phone,
    address1: c.address.line1,
    address2: c.address.line2 ?? "",
    city: c.address.city,
    state: c.address.region,
    zip: c.address.postalCode,
    country: c.address.country,
  };
}

class NamecomCoreRegistrar<E extends DomainEnvironment>
  implements RegistrarAdapter
{
  readonly name = "namecom" as const;
  readonly accountScope: string;
  constructor(
    private readonly username: string,
    private readonly token: string,
    private readonly maxCostMinor: number,
    private readonly fetcher: typeof fetch,
    readonly environment: E,
    private readonly authority: NamecomLiveAuthority = deniedLiveAuthority,
  ) {
    this.accountScope = namecomAccountScope(username, environment);
    if (
      !token ||
      !Number.isSafeInteger(maxCostMinor) ||
      maxCostMinor <= 0 ||
      maxCostMinor > 100_000
    )
      throw new DomainEngineError(
        "sandbox_credentials_missing",
        "Configure the matching Name.com API token and registrar cost limit.",
        503,
      );
  }
  async searchAndPrice(
    domains: string[],
    years = 1,
  ): Promise<RegistrarQuote[]> {
    if (!domains.length || domains.length > 20 || years !== 1)
      throw new DomainEngineError(
        "sandbox_search_invalid",
        "Use one-year quotes for up to twenty names.",
      );
    const names = domains.map((n) =>
      normalizeDomain(n, { registration: true }),
    );
    const supported = names.filter(
      (n) => n.tld === "com" && !n.requiresIdnReview,
    );
    const found = supported.length
      ? discovery.parse(
          await this.call("/domains:checkAvailability", "POST", {
            domainNames: supported.map((n) => n.fqdn),
            purchaseType: "registration",
          }),
        ).results
      : [];
    const quotes: RegistrarQuote[] = [];
    // Keep bursts under the account-wide rate limit. No purchase action occurs here.
    for (const n of names) {
      const matches = found.filter((r) => r.domainName === n.fqdn);
      if (matches.length > 1) throw invalidResponse();
      const row = matches[0];
      const q: RegistrarQuote = {
        fqdn: n.fqdn,
        availability: "unsupported",
        registration: null,
        renewal: null,
        years,
        premium: row?.premium ?? false,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      };
      if (row && !row.purchasable) q.availability = "unavailable";
      else if (row && !row.premium && row.purchaseType === "registration") {
        const price = pricing.parse(
          await this.call(`/domains/${n.fqdn}:getPricing?years=1`),
        );
        if (
          !price.premium &&
          price.purchasePrice !== null &&
          price.renewalPrice !== null
        ) {
          const amountMinor = minor(price.purchasePrice);
          if (amountMinor <= this.maxCostMinor) {
            q.availability = "available";
            q.registration = { amountMinor, currency: "usd" };
            q.renewal = {
              amountMinor: minor(price.renewalPrice),
              currency: "usd",
            };
          }
        }
      }
      quotes.push(q);
    }
    return quotes;
  }
  async getContactSchema(fqdn: string) {
    this.nameFor(fqdn);
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
  /** This rollout uses prepaid agency credit, with no card funding fallback. */
  async assertRegistrationFunding(requiredMinor: number): Promise<void> {
    if (
      this.environment !== "live" ||
      !Number.isSafeInteger(requiredMinor) ||
      requiredMinor <= 0 ||
      requiredMinor > this.maxCostMinor
    )
      throw new RegistrationNotSubmittedError();
    try {
      const { balance } = z
        .object({ balance: z.number().finite().nonnegative() })
        .parse(await this.call("/accountinfo/balance"));
      const availableMinor = Math.round(balance * 100);
      if (
        !Number.isSafeInteger(availableMinor) ||
        Math.abs(balance * 100 - availableMinor) > 0.00001 ||
        availableMinor < requiredMinor
      )
        throw new Error();
    } catch {
      // All failures here precede the billable POST. Never expose balances.
      throw new RegistrationNotSubmittedError();
    }
  }
  async register(
    request: VerifiedRegistrationRequest,
  ): Promise<RegistrarOrder> {
    if (this.environment === "live") await this.authority.registration(request);
    const name = this.nameFor(request.fqdn);
    const contact = namecomContactPayload(request.contact);
    if (
      !request.intentId ||
      !request.acceptanceId ||
      request.autoRenew ||
      request.years !== 1
    )
      throw new DomainEngineError(
        "approval_missing",
        "Use an approved one-year order with automatic renewal off.",
      );
    const [quote] = await this.searchAndPrice([name], request.years);
    if (
      quote.availability !== "available" ||
      quote.registration?.amountMinor !==
        request.expectedRegistrarPrice.amountMinor ||
      request.expectedRegistrarPrice.currency !== "usd"
    )
      throw new DomainEngineError(
        "price_changed",
        "Review a fresh registrar quote before registration.",
      );
    // Funding can change after checkout. A failed read cannot permit a purchase.
    if (this.environment === "live") {
      await this.assertRegistrationFunding(request.expectedRegistrarPrice.amountMinor);
      // Recheck authority immediately before the irreversible submission.
      await this.authority.registration(request);
    }
    const raw = await this.call(
      "/domains",
      "POST",
      {
        domain: {
          domainName: name,
          contacts: {
            registrant: contact,
            admin: contact,
            billing: contact,
            tech: contact,
          },
          autorenewEnabled: false,
          locked: true,
          privacyEnabled: true,
        },
        years: 1,
        purchaseType: "registration",
        purchasePrice: request.expectedRegistrarPrice.amountMinor / 100,
      },
      `vigil-register-${request.intentId}`,
    );
    const reference = z
      .object({ order: z.number().int().positive().safe() })
      .safeParse(raw);
    if (!reference.success) throw invalidResponse();
    const externalId = `${this.accountScope}:order:${reference.data.order}`;
    const result = z
      .object({ domain: domainSchema, totalPaid: z.number() })
      .safeParse(raw);
    // Preserve a known order reference even when post-purchase evidence fails.
    // Reconciliation can then inspect that same receipt without another purchase.
    if (!result.success)
      return { externalId, fqdn: name, status: "unknown", reason: null };
    try {
      if (
        result.data.domain.autorenewEnabled ||
        result.data.domain.domainName !== name ||
        minor(result.data.totalPaid) !==
          request.expectedRegistrarPrice.amountMinor
      )
        throw invalidResponse();
      this.assertOwner(result.data.domain, request);
    } catch {
      return { externalId, fqdn: name, status: "unknown", reason: null };
    }
    // getDomainStatus must reconcile this receipt and its owner before capture.
    return {
      externalId,
      fqdn: name,
      status: "succeeded",
      reason: null,
    };
  }
  async getOrderStatus(externalId: string): Promise<RegistrarOrder | null> {
    const receipt = await this.receipt(externalId);
    const items = receipt.orderItems.filter((i) => i.type === "registration");
    if (items.length !== 1 || !items[0].name) throw invalidResponse();
    const item = items[0];
    const fqdn = this.nameFor(item.name!);
    if (item.quantity !== 1 || item.duration !== 1 || item.interval !== "year")
      throw invalidResponse();
    const status =
      receipt.status === "success" && item.status === "success"
        ? "succeeded"
        : receipt.status === "failed" && item.status === "failed"
          ? "failed"
          : "unknown";
    return {
      externalId,
      fqdn,
      status,
      reason: status === "failed" ? "provider_failure" : null,
    };
  }
  async getDomainStatus(
    fqdn: string,
    approved?: VerifiedRegistrationRequest,
  ): Promise<RegistrarDomain | null> {
    const name = this.nameFor(fqdn);
    if (!approved || approved.fqdn !== name || !approved.registrarOrderRef)
      throw invalidResponse();
    const receipt = await this.receipt(approved.registrarOrderRef);
    const items = receipt.orderItems.filter((i) => i.type === "registration");
    if (
      receipt.status !== "success" ||
      minor(receipt.finalAmount) !==
        approved.expectedRegistrarPrice.amountMinor ||
      minor(receipt.totalCapture) !==
        approved.expectedRegistrarPrice.amountMinor ||
      receipt.totalRefund !== 0 ||
      items.length !== 1 ||
      items[0].status !== "success" ||
      items[0].name !== name ||
      items[0].duration !== approved.years ||
      items[0].interval !== "year" ||
      items[0].quantity !== 1 ||
      minor(items[0].price) !== approved.expectedRegistrarPrice.amountMinor ||
      (items[0].taxAmount ?? 0) !== 0 ||
      receipt.orderItems.some(
        (i) =>
          i !== items[0] &&
          (i.price !== 0 ||
            (i.taxAmount ?? 0) !== 0 ||
            i.status !== "success" ||
            i.type !== "whois_privacy" ||
            i.name !== name),
      )
    )
      throw invalidResponse();
    const asset = await this.readRegisteredDomain(name, approved);
    if (asset?.autoRenew) throw invalidResponse();
    return asset;
  }
  /** Saved registration references come only from server-side provider_links after receipt reconciliation. */
  async getRegisteredDomainStatus(
    fqdn: string,
    approved: VerifiedRegistrationRequest,
    savedAssetRef: string,
  ): Promise<RegistrarDomain | null> {
    const name = this.nameFor(fqdn);
    const orderPrefix = `${this.accountScope}:order:`;
    if (
      approved.fqdn !== name ||
      savedAssetRef !== `${this.accountScope}:domain:${name}` ||
      !approved.registrarOrderRef?.startsWith(orderPrefix) ||
      !/^[1-9]\d*$/.test(approved.registrarOrderRef.slice(orderPrefix.length))
    )
      throw invalidResponse();
    return this.readRegisteredDomain(name, approved);
  }
  private async readRegisteredDomain(
    name: string,
    approved: VerifiedRegistrationRequest,
  ): Promise<RegistrarDomain | null> {
    const raw = await this.call(
      `/domains/${name}`,
      "GET",
      undefined,
      undefined,
      true,
    );
    if (raw === null) return null;
    const domain = domainSchema.parse(raw);
    this.assertOwner(domain, approved);
    if (domain.autorenewEnabled !== approved.autoRenew) throw invalidResponse();
    const expires = Date.parse(domain.expireDate);
    if (
      !Number.isFinite(expires) ||
      !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(domain.expireDate)
    )
      throw invalidResponse();
    return {
      externalId: `${this.accountScope}:domain:${name}`,
      fqdn: name,
      status:
        expires <= Date.now()
          ? "expired"
          : domain.locks.some((l) => /hold/i.test(l))
            ? "contact_hold"
            : "registered",
      expiresAt: new Date(expires).toISOString(),
      autoRenew: domain.autorenewEnabled,
      contactVerification:
        domain.contacts.registrant.isVerified === true ? "verified" : "pending",
    };
  }
  async renew(): Promise<RegistrarOrder> {
    throw new DomainEngineError(
      "renewal_approval_required",
      "Paid renewal requires an approved lifecycle quote and reconciliation.",
      403,
    );
  }
  async prepareWebsiteDns(
    approved: VerifiedRegistrationRequest,
    expected: ExpectedDnsRecord[],
    savedAssetRef?: string,
  ) {
    await this.assertDnsOwner(approved, savedAssetRef);
    return this.dns().prepare(approved.fqdn, expected);
  }
  async applyWebsiteDns(
    approved: VerifiedRegistrationRequest,
    plan: NamecomDnsPlan,
    savedAssetRef?: string,
  ) {
    if (plan.fqdn !== approved.fqdn) throw invalidResponse();
    if (this.environment === "live") await this.authority.dns(approved, plan);
    await this.assertDnsOwner(approved, savedAssetRef);
    return this.dns(approved, plan).apply(plan);
  }
  private dns(approved?: VerifiedRegistrationRequest, plan?: NamecomDnsPlan) {
    return new NamecomSandboxDns(
      this.accountScope,
      async (path, method = "GET", body) => {
        if (this.environment === "live" && method !== "GET") {
          if (!approved || !plan) throw invalidResponse();
          await this.authority.dns(approved, plan);
        }
        return this.call(path, method, body);
      },
    );
  }
  private async assertDnsOwner(
    approved: VerifiedRegistrationRequest,
    savedAssetRef?: string,
  ) {
    const asset = savedAssetRef
      ? await this.getRegisteredDomainStatus(
          approved.fqdn,
          approved,
          savedAssetRef,
        )
      : await this.getDomainStatus(approved.fqdn, approved);
    if (!asset || asset.status !== "registered") throw invalidResponse();
    const raw = domainSchema.parse(
      await this.call(`/domains/${this.nameFor(approved.fqdn)}`),
    );
    this.assertOwner(raw, approved);
    if (
      raw.nameservers.length < 2 ||
      raw.nameservers.some((n) => !/^ns[a-z0-9-]*\.name\.com\.?$/i.test(n))
    )
      throw new DomainEngineError(
        "dns_authority_mismatch",
        "This domain uses external nameservers. Authorize its DNS provider separately.",
        409,
      );
  }
  async setAutoRenew(): Promise<void> {
    throw new DomainEngineError(
      "renewal_approval_required",
      "Renewal configuration requires explicit approval.",
      403,
    );
  }
  async requestTransferOut() {
    return { authCode: null, manualReview: true };
  }
  private nameFor(fqdn: string) {
    const n = normalizeDomain(fqdn, { registration: true });
    if (n.tld !== "com" || n.requiresIdnReview)
      throw new DomainEngineError(
        "unsupported_tld",
        "This registrar integration currently supports ordinary .com registrations.",
      );
    return n.fqdn;
  }
  private assertOwner(
    domain: z.infer<typeof domainSchema>,
    approved: VerifiedRegistrationRequest,
  ) {
    const expected = namecomContactPayload(approved.contact);
    if (
      domain.domainName !== approved.fqdn ||
      Object.entries(expected).some(
        ([k, v]) =>
          typeof (domain.contacts.registrant[k] ?? "") !== "string" ||
          String(domain.contacts.registrant[k] ?? "")
            .trim()
            .toLowerCase() !== v.trim().toLowerCase(),
      )
    )
      throw new DomainEngineError(
        "registrant_mismatch",
        "The registrar has not confirmed the approved client owner. Reconciliation is required.",
        409,
      );
  }
  private async receipt(externalId: string) {
    const prefix = `${this.accountScope}:order:`;
    if (
      !externalId.startsWith(prefix) ||
      !/^[1-9]\d*$/.test(externalId.slice(prefix.length))
    )
      throw invalidResponse();
    const id = externalId.slice(prefix.length);
    // The sandbox's individual GetOrder endpoint timed out in acceptance testing.
    // Documented ListOrders supplies the required receipt fields. Match the exact
    // saved ID, never a similarly named domain or an assumed successful purchase.
    for (let page = 1; page <= 10; page++) {
      const list = z
        .object({
          orders: z.array(
            z.object({ id: z.number().int().positive() }).passthrough(),
          ),
          nextPage: z.number().int().nonnegative().optional(),
        })
        .parse(await this.call(`/orders?page=${page}&perPage=100`));
      const matches = list.orders.filter((o) => String(o.id) === id);
      if (matches.length > 1) throw invalidResponse();
      if (matches.length === 1) return orderSchema.parse(matches[0]);
      if (!list.nextPage) break;
      if (list.nextPage !== page + 1) throw invalidResponse();
    }
    throw invalidResponse();
  }
  private async call(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
    allow404 = false,
  ): Promise<unknown> {
    const origin =
      this.environment === "test"
        ? "https://api.dev.name.com"
        : "https://api.name.com";
    const url = new URL(`/core/v1${path}`, origin);
    let response: Response | undefined;
    for (let attempt = 0; attempt < (method === "GET" ? 2 : 1); attempt++) {
      try {
        response = await this.fetcher(url, {
          method,
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.username}:${this.token}`).toString("base64")}`,
            "Content-Type": "application/json",
            ...(key ? { "X-Idempotency-Key": key } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(method === "GET" ? 8_000 : 15_000),
        });
      } catch {
        if (method === "GET" && attempt === 0) continue;
        throw new DomainEngineError(
          "registrar_outcome_unknown",
          "The Name.com request needs reconciliation.",
          503,
        );
      }
      if (method === "GET" && attempt === 0 && response.status >= 500) {
        await response.body?.cancel().catch(() => {});
        response = undefined;
        continue;
      }
      break;
    }
    if (!response) throw invalidResponse();
    if (allow404 && response.status === 404) return null;
    if (!response.ok)
      throw new DomainEngineError(
        response.status === 401 || response.status === 403
          ? "sandbox_authentication_failed"
          : "sandbox_operation_failed",
        response.status === 401 || response.status === 403
          ? `Name.com ${this.environment === "test" ? "sandbox " : ""}access is not active. Check the matching API token and API access setting.`
          : "The Name.com operation could not be confirmed. Reconcile before retrying.",
        503,
      );
    const result = await response.json().catch(() => null);
    if (!result || typeof result !== "object") throw invalidResponse();
    return result;
  }
}
/** Sandbox remains fixed to the development host and isolated credentials. */
export class NamecomSandboxRegistrar extends NamecomCoreRegistrar<"test"> {
  constructor(
    username: string,
    token: string,
    maxCostMinor: number,
    fetcher: typeof fetch = fetch,
  ) {
    super(username, token, maxCostMinor, fetcher, "test");
  }
}

/** Production transport is prepared, but writes deny by default. No production factory
 * supplies authority until the reviewed release and durable business approval exist. */
export class NamecomProductionRegistrar extends NamecomCoreRegistrar<"live"> {
  constructor(
    username: string,
    token: string,
    maxCostMinor: number,
    authority: NamecomLiveAuthority = deniedLiveAuthority,
    fetcher: typeof fetch = fetch,
  ) {
    super(username, token, maxCostMinor, fetcher, "live", authority);
  }
}

function invalidResponse() {
  return new DomainEngineError(
    "registrar_outcome_unknown",
    "The registrar order, owner and receipt need reconciliation before continuing.",
    503,
  );
}
function minor(value: number) {
  const amount = Math.round(value * 100);
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    Math.abs(value * 100 - amount) > 0.00001
  )
    throw invalidResponse();
  return amount;
}
