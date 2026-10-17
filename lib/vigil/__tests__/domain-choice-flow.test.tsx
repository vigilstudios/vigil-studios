import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainIntent } from "../domain-commerce";
import type { Tables } from "../types";

const mocks = vi.hoisted(() => ({ sites: [{ id: "site-a", name: "First website" }], domains: [] as Tables<"domains">[], intents: {} as Record<string, DomainIntent | null> }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContext: async () => ({ organization: { id: "org-a" }, role: "owner", isImpersonating: false }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/vigil/queries/dashboard", () => ({ getOrgDomains: async () => mocks.domains, getOrgWebsites: async () => mocks.sites }));
vi.mock("@/lib/vigil/queries/onboarding", () => ({ getOnboardingProject: async () => null }));
vi.mock("@/lib/vigil/services/domain-handoff", () => ({ loadDomainIntent: async (_client: unknown, _org: string, website: string) => mocks.intents[website] ?? null }));
vi.mock("@/lib/vigil/actions/domain-commerce", () => ({ findVercelDomain: vi.fn(), getDomainHandoff: vi.fn(), updateDomainHandoff: vi.fn() }));
vi.mock("@/lib/vigil/actions/domain", () => ({ startDomainConnection: vi.fn() }));
vi.mock("@/lib/vigil/actions/onboarding", () => ({ confirmDnsAdded: vi.fn(), getDomainSetup: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import DomainPage from "@/app/(vigil)/dashboard/domain/page";

const intent = (websiteId: string, hostname = "saved-example.com"): DomainIntent => ({ id: `intent-${websiteId}`, websiteId, hostname, phase: "handoff_started", handoffAt: "2026-10-16T10:00:00Z", version: 1, quote: null });
const render = async (params: { flow?: string; website?: string; domain?: string; hostname?: string } = {}) => renderToStaticMarkup(await DomainPage({ searchParams: Promise.resolve(params) }));

describe("one domain path at a time", () => {
  beforeEach(() => {
    vi.stubEnv("DOMAIN_HANDOFF_ENABLED", "true");
    mocks.sites = [{ id: "site-a", name: "First website" }]; mocks.domains = []; mocks.intents = {};
  });
  it("starts with two described choices and no setup forms", async () => {
    const html = await render();
    expect(html).toContain('aria-label="Find your domain"');
    expect(html).toContain('aria-label="Already own one"');
    expect(html).toContain("Use your existing web address");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("No domain connected");
  });
  it("shows only discovery after choosing Find", async () => {
    const html = await render({ flow: "find" });
    expect(html).toContain("Exact domain name");
    expect(html).not.toContain("Continue to setup");
    expect(html).toContain("All domain options");
  });
  it("shows only existing-domain entry after choosing Already own one", async () => {
    const html = await render({ flow: "own" });
    expect(html).toContain("Continue to setup");
    expect(html).not.toContain("Exact domain name");
    expect(html).not.toContain("Buy on Vercel");
  });
  it("resumes a saved handoff immediately, but lets Back explicitly choose another path", async () => {
    mocks.intents["site-a"] = intent("site-a");
    expect(await render()).toContain("Set up saved-example.com");
    const choices = await render({ flow: "choose" });
    expect(choices).toContain('aria-label="Already own one"');
    expect(choices).not.toContain("<form");
    expect(choices).not.toContain("Connect your domain");
    expect(await render({ flow: "own" })).toContain("Continue to setup");
  });
  it("requires a website selection before searching for a multi-site account", async () => {
    mocks.sites.push({ id: "site-b", name: "Second website" });
    const html = await render({ flow: "find" });
    expect(html).toContain("Which website is this domain for?");
    expect(html).not.toContain("Exact domain name");
  });
  it("opens the requested website's saved choice rather than another site's choice", async () => {
    mocks.sites.push({ id: "site-b", name: "Second website" });
    mocks.intents["site-a"] = intent("site-a", "first-example.com");
    mocks.intents["site-b"] = intent("site-b", "second-example.com");
    const html = await render({ flow: "find", website: "site-b" });
    expect(html).toContain("Set up second-example.com");
    expect(html).not.toContain("first-example.com");
    expect(await render({ flow: "find", website: "choose" })).toContain("Which website is this domain for?");
  });
  it("opens the selected existing domain guide without a competing entry form", async () => {
    mocks.domains = ["first-example.com", "second-example.com"].map((hostname, i) => ({ id: `domain-${i}`, organization_id: "org-a", hostname, status: "pending", source: "customer_owned", website_id: "site-a", verification: {}, verification_token: "token", dns_ok: null, ssl_ok: null, expires_at: null, last_checked_at: null, status_reason: "The connection details are ready. Add the DNS record below." } as Tables<"domains">));
    const html = await render({ flow: "own", domain: "domain-1" });
    expect(html).toContain("second-example.com");
    expect(html).toContain("Where do you manage your domain?");
    expect(html).not.toContain("Continue to setup");
    expect(html).not.toContain("Exact domain name");
    expect(html).not.toContain("The connection details are ready. Add the DNS record below.");
  });
  it("preserves the owned route when discovery is disabled", async () => {
    vi.stubEnv("DOMAIN_HANDOFF_ENABLED", "false");
    expect(await render({ flow: "find" })).toContain("Domain search is unavailable");
    expect(await render({ flow: "own" })).toContain("Continue to setup");
  });
  it("resumes a purchased domain at Domains on reload without asking for its name or login", async () => {
    mocks.intents["site-a"] = intent("site-a");
    mocks.domains = [{ id: "domain-a", organization_id: "org-a", hostname: "saved-example.com", website_id: "site-a", registrar: "vercel", status: "pending", source: "customer_owned", verification: {}, verification_token: "proof" } as Tables<"domains">];
    const html = await render();
    expect(html).toContain("Now that you’ve bought saved-example.com"); expect(html).toContain("Open my Vercel domains");
    expect(html).not.toContain("Where do you manage"); expect(html).not.toContain("Sign in to Vercel"); expect(html).not.toContain("Confirm your domain");
    // Overview selects the website, allowing the page to resume its saved domain.
    mocks.sites.push({ id: "site-b", name: "Second website" });
    mocks.intents["site-b"] = intent("site-b", "second-example.com");
    const resumed = await render({ website: "site-a" });
    expect(resumed).toContain("Now that you’ve bought saved-example.com"); expect(resumed).not.toContain("second-example.com");
    mocks.intents["site-a"] = { ...intent("site-a"), phase: "cancelled" };
    expect(await render({ flow: "own", domain: "domain-a" })).toContain("Where do you manage your domain?");
  });
  it("shows an explicitly read-only purchase preview without an owned-domain form", async () => {
    const html = await render({ flow: "purchase-preview", website: "site-a", hostname: "preview-example.com" });
    expect(html).toContain("Post-purchase setup preview"); expect(html).toContain("Open Domains");
    expect(html).not.toContain("<form"); expect(html).not.toContain("Check my setup"); expect(html).not.toContain("Confirm your domain");
    expect(await render({ flow: "purchase-preview", website: "foreign-site", hostname: "preview-example.com" })).not.toContain("Post-purchase setup preview");
  });
});
