import "server-only";
import { z } from "zod";
import { normalizeDomain } from "./normalize";
import { DomainEngineError } from "./errors";
import {
  OPENPROVIDER_CONTACT_FIELDS,
  openproviderContactPayload,
} from "./openprovider-contact";
import type {
  ContactSchema,
  Money,
  RegistrarAdapter,
  RegistrarDomain,
  RegistrarOrder,
  RegistrarQuote,
  VerifiedRegistrationRequest,
} from "./contracts";

const price = z.object({
  currency: z.literal("USD"),
  price: z.number().finite().positive(),
});
const envelope = z.object({ code: z.number(), data: z.unknown() });
const check = z.object({
  results: z.array(
    z.object({
      domain: z.string(),
      status: z.string(),
      is_premium: z.boolean(),
      price: z.object({ reseller: price }).optional(),
    }),
  ),
});
const inventory = z.object({
  id: z.number().int().positive(),
  domain: z.object({ name: z.string(), extension: z.string() }),
  status: z.string(),
  owner_handle: z.string().optional(),
  comments: z.string().optional(),
  autorenew: z.string().optional(),
  registry_expiration_date: z.string().optional(),
  renewal_date: z.string().optional(),
  verification_email_status: z.string().optional(),
});

/** Strict sandbox origin: production registration cannot be enabled with configuration. */
export class OpenproviderSandboxRegistrar implements RegistrarAdapter {
  readonly name = "openprovider" as const;
  readonly environment = "test" as const;
  constructor(
    private readonly token: string,
    private readonly ownerHandleFor: (
      request: VerifiedRegistrationRequest,
    ) => Promise<string>,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!token)
      throw new DomainEngineError(
        "sandbox_credentials_missing",
        "Openprovider sandbox credentials are required.",
        503,
      );
  }
  async searchAndPrice(
    domains: string[],
    years = 1,
  ): Promise<RegistrarQuote[]> {
    if (domains.length < 1 || domains.length > 20 || years !== 1)
      throw new DomainEngineError(
        "sandbox_search_invalid",
        "The sandbox currently supports one-year quotes for up to twenty names.",
      );
    const normalized = domains.map((name) =>
      normalizeDomain(name, { registration: true }),
    );
    const supported = normalized.filter(
      (name) => name.tld === "com" && !name.requiresIdnReview,
    );
    const response = supported.length
      ? check.parse(
          await this.call("/domains/check", "POST", {
            domains: supported.map((name) => ({
              name: name.fqdn.slice(0, -4),
              extension: "com",
            })),
            with_price: true,
          }),
        )
      : null;
    return Promise.all(
      normalized.map(async (name) => {
        const row = response?.results.find(
          (result) => result.domain === name.fqdn,
        );
        const expiresAt = new Date(Date.now() + 300_000).toISOString();
        if (!row)
          return {
            fqdn: name.fqdn,
            availability: "unsupported",
            registration: null,
            renewal: null,
            years,
            premium: false,
            expiresAt,
          };
        if (row.status !== "free")
          return {
            fqdn: name.fqdn,
            availability: "unavailable",
            registration: null,
            renewal: null,
            years,
            premium: row.is_premium,
            expiresAt,
          };
        // Premium pricing and additional TLD requirements need separately approved support.
        if (row.is_premium || !row.price)
          return {
            fqdn: name.fqdn,
            availability: "unsupported",
            registration: null,
            renewal: null,
            years,
            premium: row.is_premium,
            expiresAt,
          };
        const renewal = z
          .object({ price: z.object({ reseller: price }) })
          .parse(
            await this.call(
              `/domains/prices?${new URLSearchParams({ "domain.name": name.fqdn.slice(0, -4), "domain.extension": "com", operation: "renew", period: "1" })}`,
            ),
          );
        return {
          fqdn: name.fqdn,
          availability: "available",
          registration: minor(row.price.reseller),
          renewal: minor(renewal.price.reseller),
          years,
          premium: false,
          expiresAt,
        };
      }),
    );
  }
  async getContactSchema(fqdn: string): Promise<ContactSchema> {
    if (normalizeDomain(fqdn, { registration: true }).tld !== "com")
      throw new DomainEngineError(
        "unsupported_tld",
        "This TLD requires additional registrar approval.",
      );
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
      additional: OPENPROVIDER_CONTACT_FIELDS,
    };
  }
  async createRegistrantContact(
    request: VerifiedRegistrationRequest,
  ): Promise<string> {
    const payload = openproviderContactPayload(
      request.contact,
      request.acceptanceId,
    );
    const data = z
      .object({ handle: z.string().regex(/^[A-Z0-9-]{5,40}$/) })
      .parse(await this.call("/customers", "POST", payload));
    return data.handle;
  }
  async register(
    request: VerifiedRegistrationRequest,
  ): Promise<RegistrarOrder> {
    const [quote] = await this.searchAndPrice([request.fqdn], request.years);
    if (
      quote.availability !== "available" ||
      quote.registration?.amountMinor !==
        request.expectedRegistrarPrice.amountMinor ||
      quote.registration.currency !== request.expectedRegistrarPrice.currency
    )
      throw new DomainEngineError(
        "price_changed",
        "Review a fresh registrar quote before registration.",
      );
    if (!request.acceptanceId || !request.intentId)
      throw new DomainEngineError(
        "approval_missing",
        "The domain approval is missing.",
      );
    const handle = await this.ownerHandleFor(request);
    if (!/^[A-Z0-9-]{5,40}$/.test(handle))
      throw new DomainEngineError(
        "contact_unverified",
        "The client registrant contact has not been verified.",
      );
    const data = z
      .object({ id: z.number().int().positive(), status: z.string() })
      .parse(
        await this.call("/domains", "POST", {
          domain: { name: request.fqdn.slice(0, -4), extension: "com" },
          period: 1,
          owner_handle: handle,
          admin_handle: handle,
          tech_handle: handle,
          autorenew: request.autoRenew ? "on" : "off",
          comments: `Vigil order ${request.intentId}`,
        }),
      );
    return {
      externalId: String(data.id),
      fqdn: request.fqdn,
      status: data.status === "ACT" ? "succeeded" : "pending",
      reason: null,
    };
  }
  async getOrderStatus(externalId: string): Promise<RegistrarOrder | null> {
    if (!/^\d+$/.test(externalId))
      throw new DomainEngineError(
        "invalid_provider_reference",
        "The registrar reference is invalid.",
      );
    const data = inventory.parse(
      await this.call(`/domains/${externalId}?with_verification_email=true`),
    );
    return {
      externalId,
      fqdn: `${data.domain.name}.${data.domain.extension}`,
      status: data.status === "ACT" ? "succeeded" : "pending",
      reason: null,
    };
  }
  async getDomainStatus(
    fqdn: string,
    approved?: VerifiedRegistrationRequest,
  ): Promise<RegistrarDomain | null> {
    const name = normalizeDomain(fqdn, { registration: true }).fqdn;
    const listed = z
      .object({ results: z.array(inventory) })
      .parse(
        await this.call(
          `/domains?${new URLSearchParams({ full_name: name, limit: "2", with_verification_email: "true" })}`,
        ),
      );
    const found = listed.results.filter(
      (row) => `${row.domain.name}.${row.domain.extension}` === name,
    );
    if (found.length !== 1) return null;
    const data = found[0];
    if (data.status !== "ACT") return null;
    if (
      !approved ||
      approved.fqdn !== name ||
      data.comments !== `Vigil order ${approved.intentId}` ||
      data.owner_handle !== (await this.ownerHandleFor(approved))
    )
      throw new DomainEngineError(
        "registrant_mismatch",
        "The registrar has not confirmed this exact order and its approved client owner. Reconciliation is required.",
        409,
      );
    return {
      externalId: String(data.id),
      fqdn: name,
      status: "registered",
      expiresAt: explicitDate(data.registry_expiration_date),
      autoRenew: data.autorenew === "on",
      contactVerification:
        data.verification_email_status === "verified" ? "verified" : "pending",
    };
  }
  async renew(): Promise<RegistrarOrder> {
    throw new DomainEngineError(
      "renewal_approval_required",
      "Sandbox renewal requires an approved lifecycle quote and separate reconciliation.",
      403,
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
  } // Sandbox does not support transfers.
  private async call(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<unknown> {
    // v1beta sandbox origin is documented separately from the v1 production schema.
    const url = new URL(
      `/v1beta${path}`,
      "https://api.sandbox.openprovider.nl",
    );
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new DomainEngineError(
        "registrar_outcome_unknown",
        "The sandbox request needs reconciliation.",
        503,
      );
    }
    if (!response.ok)
      throw new DomainEngineError(
        "sandbox_unavailable",
        "The registrar sandbox is unavailable.",
        503,
      );
    const result = envelope.safeParse(await response.json().catch(() => null));
    if (!result.success || result.data.code !== 0)
      throw new DomainEngineError(
        "sandbox_operation_failed",
        "The sandbox operation could not be confirmed.",
        503,
      );
    return result.data.data;
  }
}
function minor(value: { price: number; currency: "USD" }): Money {
  const amountMinor = Math.round(value.price * 100);
  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0 ||
    Math.abs(value.price * 100 - amountMinor) > 0.00001
  )
    throw new DomainEngineError(
      "price_invalid",
      "The registrar price could not be confirmed.",
    );
  return { amountMinor, currency: "usd" };
}
function explicitDate(value?: string) {
  return value &&
    /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
}
