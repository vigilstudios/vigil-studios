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
    expect(html).toContain("You can search availability and prices here");
    expect(html).not.toContain("Continue on Vercel");
    expect(html).not.toContain("Decide later");
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
