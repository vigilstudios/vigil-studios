import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import type { OrgContext } from "../auth/session";

const mocks = vi.hoisted(() => ({ context: {} as OrgContext, client: {}, search: vi.fn(), limit: vi.fn(), admin: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContextOrThrow: async () => mocks.context }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => true, createAdminClient: mocks.admin }));
vi.mock("@/lib/vigil/rate-limit", () => ({ enforceRateLimit: mocks.limit, RATE_LIMITS: { domainSearchOrg: {}, domainHandoffOrg: {} } }));
vi.mock("@/lib/vigil/providers/vercel-discovery", () => ({ searchVercelDomain: mocks.search }));
import { findVercelDomain, updateDomainHandoff } from "../actions/domain-commerce";
import { DomainJourney } from "@/components/vigil/DomainJourney";
import { DomainPurchaseOffer } from "@/components/vigil/DomainPurchaseOffer";
import type { DomainQuote } from "../domain-commerce";

const website = "11111111-1111-4111-8111-111111111111";
describe("read-only discovery in staff view", () => {
  beforeEach(() => {
    vi.stubEnv("DOMAIN_HANDOFF_ENABLED", "true");
    vi.clearAllMocks();
    mocks.context = { organization: { id: "org-a" }, user: { id: "staff" }, role: "owner", isImpersonating: true } as OrgContext;
    mocks.client = new FakeAdmin({ websites: [{ id: website, organization_id: "org-a" }] }).asClient();
    mocks.search.mockResolvedValue({ hostname: "example.com", available: false });
  });
  it("renders an accessible search field and button without customer mutation controls", () => {
    const html = renderToStaticMarkup(<DomainJourney websiteId={website} canManage={false} />);
    expect(html).toContain("Exact domain name");
    expect(html).toContain('placeholder="yourbusiness.com"');
    expect(html).toContain(">Search</button>");
    expect(html).toContain("account owner or manager needs to sign in");
    expect(html).not.toContain("Continue on Vercel");
    expect(html).not.toContain("Decide later");
  });
  it("gives staff an exact-domain external link without a customer handoff button", () => {
    const quote = { hostname: "example.com", available: true, currency: "USD", years: 1, registration: 11.25, renewal: 15.10, premium: false } as DomainQuote;
    const html = renderToStaticMarkup(<DomainPurchaseOffer quote={quote} canManage={false} pending={false} disabled={false} onBuy={vi.fn()} />);
    expect(html).toContain('href="https://vercel.com/domains/search?q=example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("View this domain on Vercel");
    expect(html).not.toContain("<button");
  });
  it("keeps customer purchase behind the saved-handoff action with clearly separate prices", () => {
    const quote = { hostname: "example.com", available: true, currency: "USD", years: 2, registration: 22.50, renewal: 15.10, premium: true } as DomainQuote;
    const html = renderToStaticMarkup(<DomainPurchaseOffer quote={quote} canManage pending={false} disabled={false} onBuy={vi.fn()} />);
    expect(html).toContain("Buy this domain on Vercel");
    expect(html).not.toContain('href="https://vercel.com');
    expect(html).toContain("First 2 years");
    expect(html).toContain("$22.50");
    expect(html).toContain("Renewal estimate");
    expect(html).toContain("$15.10");
    expect(html).toContain("Premium domain");
    expect(html).toContain("before you pay");
  });
  it("allows staff discovery with tenant validation and a shared fail-closed rate limit", async () => {
    expect(await findVercelDomain(website, "example.com")).toMatchObject({ ok: true });
    expect(mocks.limit).toHaveBeenCalledWith("domain-search:org:org-a", {}, true);
    expect(mocks.search).toHaveBeenCalledWith("example.com");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects a different tenant's website before provider discovery", async () => {
    mocks.context = { ...mocks.context, organization: { id: "org-b" } } as OrgContext;
    expect(await findVercelDomain(website, "example.com")).toMatchObject({ ok: false, code: "not_found" });
    expect(mocks.search).not.toHaveBeenCalled();
  });
  it.each(["handoff", "cancel", "help"] as const)("continues to deny staff %s before service-role access", async action => {
    expect(await updateDomainHandoff({ websiteId: website, version: 0, action, hostname: "example.com" })).toMatchObject({ ok: false, code: "forbidden" });
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
  });
});
