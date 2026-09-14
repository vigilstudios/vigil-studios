import { describe, expect, it } from "vitest";
import { ProviderNotConfiguredError } from "../auth/errors";
import { NullBillingProvider, NullDeploymentProvider, NullDomainProvider } from "../providers/null";
import { createBillingProvider, createDeploymentProvider, createDomainProvider, readProviderConfig } from "../providers/registry";
import { providerEnum } from "../services/provider-links";

describe("provider registry", () => {
  it("defaults every provider to null", () => {
    expect(readProviderConfig({})).toEqual({ billing: "null", deployment: "null", domain: "null" });
  });

  it("selects by name, case-insensitively", () => {
    expect(readProviderConfig({ BILLING_PROVIDER: "Stripe" }).billing).toBe("stripe");
    expect(createBillingProvider("null")).toBeInstanceOf(NullBillingProvider);
    expect(createDeploymentProvider("null")).toBeInstanceOf(NullDeploymentProvider);
    expect(createDomainProvider("null")).toBeInstanceOf(NullDomainProvider);
  });

  it("fails loudly on an unknown provider name", () => {
    expect(() => createBillingProvider("paypal")).toThrow(/Unknown BILLING_PROVIDER/);
    expect(() => createDeploymentProvider("netlify")).toThrow(/Unknown DEPLOYMENT_PROVIDER/);
    expect(() => createDomainProvider("godaddy")).toThrow(/Unknown DOMAIN_PROVIDER/);
  });

  it("named providers are explicit stubs until their phase lands", async () => {
    const stripe = createBillingProvider("stripe");
    expect(stripe.name).toBe("stripe");
    await expect(stripe.getSubscription("sub_x")).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    const vercel = createDeploymentProvider("vercel");
    await expect(vercel.getDeployment("dpl_x")).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    const cloudflare = createDomainProvider("cloudflare");
    await expect(cloudflare.checkAvailability("example.com")).rejects.toBeInstanceOf(ProviderNotConfiguredError);
  });

  it("maps adapter names onto the database enum", () => {
    expect(providerEnum("stripe")).toBe("stripe");
    expect(providerEnum("null")).toBe("other");
  });
});

const registrant = {
  firstName: "A",
  lastName: "B",
  email: "a@example.com",
  phone: "+10000000000",
  address: { line1: "1 Main St", city: "Babylon", region: "NY", postalCode: "11702", country: "US" },
};

describe("null providers behave like a well-formed provider", () => {
  it("deployment: provision, deploy, domain config", async () => {
    const p = new NullDeploymentProvider();
    const site = await p.provisionSite({ websiteId: "w", organizationId: "o", name: "vigil-test", templateSlug: null, hostingMode: null });
    expect(site.externalId).toMatch(/^site_null_/);
    const dpl = await p.triggerDeployment(site.externalId, { environment: "production" });
    expect(dpl.status).toBe("ready");
    expect(await p.getDeployment(dpl.externalId)).toEqual(dpl);
    const cfg = await p.addDomain(site.externalId, "example.com");
    expect(cfg.requiredRecords.length).toBeGreaterThan(0);
    expect(cfg.verified).toBe(false);
  });

  it("billing: cancel at period end vs immediately", async () => {
    const p = new NullBillingProvider();
    const soft = await p.cancelSubscription("sub_1", { atPeriodEnd: true });
    expect(soft.cancelAtPeriodEnd).toBe(true);
    expect(soft.status).toBe("active");
    const hard = await p.cancelSubscription("sub_1", { atPeriodEnd: false });
    expect(hard.status).toBe("canceled");
  });

  it("domains: register then unavailable", async () => {
    const p = new NullDomainProvider();
    expect((await p.checkAvailability("shop.example")).available).toBe(true);
    const reg = await p.register("shop.example", registrant, { years: 1, autoRenew: true });
    expect(reg.hostname).toBe("shop.example");
    expect((await p.checkAvailability("shop.example")).available).toBe(false);
  });
});
