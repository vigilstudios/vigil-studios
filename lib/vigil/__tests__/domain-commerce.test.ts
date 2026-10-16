import { describe, expect, it, vi } from "vitest";
import { normalizeRegistrationName, quoteIsFresh, vercelDomainUrl, type DomainQuote } from "../domain-commerce";
import { searchVercelDomain } from "../providers/vercel-discovery";
import { assertHandoffActor, saveHandoff } from "../services/domain-handoff";
import type { OrgContext } from "../auth/session";
import { FakeAdmin } from "./fake-admin";

const quote: DomainQuote = { hostname: "example.com", available: true, currency: "USD", years: 1, registration: 11.25, renewal: 15.10, premium: false, quotedAt: new Date().toISOString() };
const context = { organization: { id: "org-a" }, user: { id: "owner-a" }, role: "owner", isImpersonating: false } as OrgContext;
describe("exact Vercel domain discovery", () => {
  it.each([[" EXAMPLE.COM. ", "example.com"], ["bücher.de", "xn--bcher-kva.de"], ["example.co.uk", "example.co.uk"]])("normalizes %s", (input, expected) => expect(normalizeRegistrationName(input)).toBe(expected));
  it.each(["https://example.com", "www.example.com", "example.com/path", "example.com:443", "example.com@evil.com", "x.invalid", "-bad.com", "foo..com", "localhost", "x.com?next=evil", "exa mple.com", "127.0.0.1", "example.com%2f", "evil\\example.com"])("rejects %s", name => expect(normalizeRegistrationName(name)).toBeNull());
  it("only builds an allowlisted exact-domain route", () => {
    const url = new URL(vercelDomainUrl("BÜCHER.DE"));
    expect([url.origin, url.pathname, url.searchParams.get("q")]).toEqual(["https://vercel.com", "/domains/search", "xn--bcher-kva.de"]);
    expect(() => vercelDomainUrl("https://evil.com")).toThrow();
  });
  it("expires quotes and rejects future/invalid timestamps", () => {
    const now = Date.now();
    for (const quotedAt of [new Date(now - 600_001).toISOString(), new Date(now + 1).toISOString(), "bad"]) expect(quoteIsFresh({ ...quote, quotedAt }, now)).toBe(false);
    expect(quoteIsFresh(quote)).toBe(true);
  });
  it("uses real registration term/renewal/premium data without credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ results: [{ domain: "example.com", available: true, years: 2, price: 1500, renewalPrice: 80, premium: true }] }));
    const result = await searchVercelDomain("Example.com", fetcher);
    expect(result).toMatchObject({ years: 2, registration: 1500, renewal: 80, premium: true, currency: "USD" });
    expect(fetcher.mock.calls[0][1].headers).toEqual({ "Content-Type": "application/json" });
    expect(fetcher.mock.calls[0][1].body).toBe('{"domains":["example.com"]}');
    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it("does not invent prices for unavailable/unsupported results", async () => {
    expect(await searchVercelDomain("example.com", vi.fn().mockResolvedValue(Response.json({ results: [{ domain: "example.com", available: false }] })))).toMatchObject({ available: false, registration: null, renewal: null, premium: null });
  });
  it.each([{ results: [] }, { results: [{ domain: "evil.com", available: true }] }, { results: [{ domain: "example.com", available: "true" }] }, { results: [{ domain: "example.com", available: true, price: -1, renewalPrice: 2, years: 1, premium: false }] }, { results: [{ domain: "example.com", available: true, price: 1 }] }])("rejects malformed responses", async body => {
    await expect(searchVercelDomain("example.com", vi.fn().mockResolvedValue(Response.json(body)))).rejects.toThrow("Domain search is unavailable");
  });
  it.each([429, 403, 500])("handles provider HTTP %s safely", async status => {
    await expect(searchVercelDomain("example.com", vi.fn().mockResolvedValue(new Response("secret-provider-body", { status })))).rejects.toThrow("Domain search is unavailable");
  });
  it("redacts timeout/network exceptions", async () => {
    await expect(searchVercelDomain("example.com", vi.fn().mockRejectedValue(new Error("token=secret")))).rejects.toThrow("Domain search is unavailable");
  });
});
describe("saved handoff boundaries", () => {
  it.each([{ role: "member" }, { isImpersonating: true, staffRole: "admin" }])("denies unauthorized actors", patch => {
    expect(() => assertHandoffActor({ ...context, ...patch } as OrgContext)).toThrow("Only a customer owner or manager");
  });
  it("allows a customer manager", () => expect(() => assertHandoffActor({ ...context, role: "manager" })).not.toThrow());
  it("rejects a different organization's website before discovery or mutation", async () => {
    const admin = new FakeAdmin({ websites: [{ id: "site-b", organization_id: "org-b" }] });
    const search = vi.fn();
    await expect(saveHandoff(admin.asClient(), context, { websiteId: "site-b", version: 0, action: "handoff", hostname: "example.com" }, search)).rejects.toThrow("Website not found");
    expect(search).not.toHaveBeenCalled();
  });
  it("requotes server-side and refuses unavailable names without creating domain/jobs", async () => {
    const admin = new FakeAdmin({ websites: [{ id: "site-a", organization_id: "org-a" }] });
    await expect(saveHandoff(admin.asClient(), context, { websiteId: "site-a", version: 0, action: "handoff", hostname: "example.com" }, vi.fn().mockResolvedValue({ ...quote, available: false }))).rejects.toThrow("unavailable");
    expect(admin.rows("domains")).toHaveLength(0);
    expect(admin.rows("provisioning_jobs")).toHaveLength(0);
  });
});
