import { ProviderNotConfiguredError } from "@/lib/vigil/auth/errors";
import type { BillingProvider, DeploymentProvider, DomainProvider } from "./types";

/**
 * Named providers the master architecture expects (Stripe, Vercel,
 * Cloudflare). Each is a placeholder that fails loudly with
 * ProviderNotConfiguredError until its adapter phase lands; the interface is
 * the contract that phase must satisfy. No SDKs are installed yet.
 */
function notConfigured(name: string): never {
  throw new ProviderNotConfiguredError(name);
}

// Every method is `async` so callers always receive a rejected promise, never
// a synchronous throw, exactly as a real adapter would behave.

export class StripeBillingProviderStub implements BillingProvider {
  readonly name = "stripe" as const;
  async createCustomer(): Promise<never> { return notConfigured("Stripe"); }
  async createCheckoutSession(): Promise<never> { return notConfigured("Stripe"); }
  async getSubscription(): Promise<never> { return notConfigured("Stripe"); }
  async cancelSubscription(): Promise<never> { return notConfigured("Stripe"); }
  async createPortalSession(): Promise<never> { return notConfigured("Stripe"); }
  async parseWebhook(): Promise<never> { return notConfigured("Stripe"); }
}

export class VercelDeploymentProviderStub implements DeploymentProvider {
  readonly name = "vercel" as const;
  async provisionSite(): Promise<never> { return notConfigured("Vercel"); }
  async triggerDeployment(): Promise<never> { return notConfigured("Vercel"); }
  async getDeployment(): Promise<never> { return notConfigured("Vercel"); }
  async addDomain(): Promise<never> { return notConfigured("Vercel"); }
  async removeDomain(): Promise<never> { return notConfigured("Vercel"); }
  async getDomainConfig(): Promise<never> { return notConfigured("Vercel"); }
  async deleteSite(): Promise<never> { return notConfigured("Vercel"); }
}

export class CloudflareDomainProviderStub implements DomainProvider {
  readonly name = "cloudflare" as const;
  async checkAvailability(): Promise<never> { return notConfigured("Cloudflare"); }
  async register(): Promise<never> { return notConfigured("Cloudflare"); }
  async getRegistration(): Promise<never> { return notConfigured("Cloudflare"); }
  async setAutoRenew(): Promise<never> { return notConfigured("Cloudflare"); }
  async upsertDnsRecords(): Promise<never> { return notConfigured("Cloudflare"); }
  async lookupDns(): Promise<never> { return notConfigured("Cloudflare"); }
}
