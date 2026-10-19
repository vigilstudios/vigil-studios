import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrgContext } from "../auth/session";
import { canManageDomainSetup } from "../domain-access";
import { assertDomainSetupActor } from "../services/domain-handoff";
const mocks = vi.hoisted(() => ({ ctx: {} as OrgContext, rpc: vi.fn(), admin: vi.fn(), redirect: vi.fn((url: string) => { throw Error(`NEXT_REDIRECT:${url}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/vigil/auth/session", () => ({ requireOrgContextOrThrow: async () => mocks.ctx }));
vi.mock("@/lib/supabase/admin", () => ({ hasAdminClient: () => true, createAdminClient: mocks.admin }));
vi.mock("@/lib/vigil/rate-limit", () => ({ enforceRateLimit: vi.fn(), RATE_LIMITS: { domainHandoffOrg: {} } }));
import { resetDomainSetup } from "../actions/domain-admin";
const website = "11111111-1111-4111-8111-111111111111";
const context = { organization: { id: "org-a" }, user: { id: "admin-a" }, role: "owner", isImpersonating: true, staffRole: "admin" } as OrgContext;
const form = () => { const data = new FormData(); for (const [key, value] of Object.entries({ website_id: website, intent_version: "3", domain_snapshot: "[]", confirm_reset: "yes" })) data.set(key, value); return data; };
describe("actual admin domain management", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.ctx = context; mocks.rpc.mockResolvedValue({ error: null }); mocks.admin.mockReturnValue({ rpc: mocks.rpc }); });
  it("allows the administrator to manage the actual setup, separate from registrar authorization", () => {
    expect(canManageDomainSetup(context)).toBe(true); expect(() => assertDomainSetupActor(context)).not.toThrow();
    expect(canManageDomainSetup({ ...context, staffRole: "staff" })).toBe(false);
    expect(canManageDomainSetup({ ...context, staffRole: null })).toBe(false);
    expect(canManageDomainSetup({ ...context, isImpersonating: false, staffRole: null, role: "manager" })).toBe(true);
    expect(canManageDomainSetup({ ...context, isImpersonating: false, staffRole: null, role: "member" })).toBe(false);
  });
  it.each([{ staffRole: "staff" }, { staffRole: null }, { staffRole: null, isImpersonating: false }])("denies reset before service-role access: %j", async patch => {
    mocks.ctx = { ...context, ...patch } as OrgContext;
    expect(await resetDomainSetup(null, form())).toMatchObject({ ok: false, code: "forbidden" }); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("requires a reviewed confirmation and valid snapshot", async () => {
    const missing = form(); missing.delete("confirm_reset"); expect(await resetDomainSetup(null, missing)).toMatchObject({ ok: false, code: "validation" });
    const invalid = form(); invalid.set("domain_snapshot", '[{"id":"foreign","updated_at":"bad"}]'); expect(await resetDomainSetup(null, invalid)).toMatchObject({ ok: false });
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("uses the authenticated admin and selected organization, then opens real domain choices", async () => {
    await expect(resetDomainSetup(null, form())).rejects.toThrow(`NEXT_REDIRECT:/dashboard/domain?flow=choose&website=${website}`);
    expect(mocks.rpc).toHaveBeenCalledWith("reset_domain_setup", { p_actor: "admin-a", p_organization: "org-a", p_website: website, p_expected_version: 3, p_domains: [] });
  });
  it("requires refreshing stale or in-flight setups instead of overwriting them", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "40001", message: "private database detail" } });
    expect(await resetDomainSetup(null, form())).toMatchObject({ ok: false, code: "validation", error: "This setup changed or is being checked. Refresh, review it, and try again." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
