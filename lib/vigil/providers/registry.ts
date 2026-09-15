import { NullBillingProvider, NullDeploymentProvider, NullDomainProvider } from "./null";
import { StripeBillingProvider } from "./stripe";
import { CloudflareDomainProviderStub, StripeBillingProviderStub, VercelDeploymentProviderStub } from "./stubs";
import { VercelDeploymentProvider } from "./vercel";
import type { BillingProvider, DeploymentProvider, DomainProvider } from "./types";

/**
 * Provider selection is configuration, not code. Unknown values fail at
 * startup rather than silently falling back, so a typo in production cannot
 * quietly route billing to the in-memory provider.
 */
export type ProviderConfig = {
  billing: string;
  deployment: string;
  domain: string;
};

export function readProviderConfig(env: Record<string, string | undefined> = process.env): ProviderConfig {
  return {
    billing: (env.BILLING_PROVIDER ?? "null").toLowerCase(),
    deployment: (env.DEPLOYMENT_PROVIDER ?? "null").toLowerCase(),
    domain: (env.DOMAIN_PROVIDER ?? "null").toLowerCase(),
  };
}

export function createBillingProvider(name: string): BillingProvider {
  switch (name) {
    case "null":
      return new NullBillingProvider();
    case "stripe": {
      // Without a key the named stub stays in place and fails loudly on use.
      const key = process.env.STRIPE_SECRET_KEY;
      return key ? new StripeBillingProvider(key, process.env.STRIPE_WEBHOOK_SECRET) : new StripeBillingProviderStub();
    }
    default:
      throw new Error(`Unknown BILLING_PROVIDER "${name}" (expected null | stripe).`);
  }
}

export function createDeploymentProvider(name: string): DeploymentProvider {
  switch (name) {
    case "null":
      return new NullDeploymentProvider();
    case "vercel":
      return process.env.VERCEL_TOKEN ? new VercelDeploymentProvider(process.env.VERCEL_TOKEN) : new VercelDeploymentProviderStub();
    default:
      throw new Error(`Unknown DEPLOYMENT_PROVIDER "${name}" (expected null | vercel).`);
  }
}

export function createDomainProvider(name: string): DomainProvider {
  switch (name) {
    case "null":
      return new NullDomainProvider();
    case "cloudflare":
      return new CloudflareDomainProviderStub();
    default:
      throw new Error(`Unknown DOMAIN_PROVIDER "${name}" (expected null | cloudflare).`);
  }
}

let billing: BillingProvider | null = null;
let deployment: DeploymentProvider | null = null;
let domain: DomainProvider | null = null;

export function getBillingProvider(): BillingProvider {
  return (billing ??= createBillingProvider(readProviderConfig().billing));
}

export function getDeploymentProvider(): DeploymentProvider {
  return (deployment ??= createDeploymentProvider(readProviderConfig().deployment));
}

export function getDomainProvider(): DomainProvider {
  return (domain ??= createDomainProvider(readProviderConfig().domain));
}

/** Test hook. */
export function resetProviders(): void {
  billing = deployment = domain = null;
}
