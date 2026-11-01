import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import type { DeploymentProvider } from "../providers/types";
const mocks = vi.hoisted(() => ({ bind: vi.fn(), prepare: vi.fn(), apply: vi.fn(), sync: vi.fn() }));
vi.mock("../domain-engine/managed-connection", () => ({ bindManagedDomain: mocks.bind, prepareManagedDns: mocks.prepare, applyManagedDns: mocks.apply }));
vi.mock("../domain-engine/registrar-sync", () => ({ syncManagedRegistration: mocks.sync }));
import { managedLaunchContext, prepareManagedWebsiteLaunch, connectManagedDomainAtLaunch } from "../domain-engine/launch-handoff";
const org = "10000000-0000-4000-8000-000000000001", website = "10000000-0000-4000-8000-000000000002", registration = "10000000-0000-4000-8000-000000000003", owner = "10000000-0000-4000-8000-000000000004", order = "10000000-0000-4000-8000-000000000005", plan = "10000000-0000-4000-8000-000000000006";
const context = { ownerId: owner, orderId: order, registrationId: registration, organizationId: org, websiteId: website };
const domain = { managed_registration_id: registration, organization_id: org, website_id: website };
const provider = { name: "vercel" } as DeploymentProvider;
let db: FakeAdmin;
function rpc(ctx: unknown = context, saved: unknown = null) {
  return vi.spyOn(db, "rpc").mockImplementation(async name => ({ data: name === "managed_website_launch_requests" ? (ctx ? [{ registrationId: registration, organizationId: org }] : []) : name === "managed_domain_launch_context" ? ctx : saved, error: null }) as never);
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED", "true"); vi.stubEnv("VIGIL_DOMAIN_LIVE_ENABLED", "true");
  db = new FakeAdmin({ domain_registrations: [{ id: registration, organization_id: org, website_id: website, environment: "live", registrar: "namecom", registration_status: "registered" }] });
  mocks.bind.mockResolvedValue({ domainId: "domain" }); mocks.prepare.mockResolvedValue({ id: plan }); mocks.apply.mockResolvedValue({ applied: true }); mocks.sync.mockResolvedValue({ status: "registered", contactVerification: "verified" });
});
afterEach(() => vi.unstubAllEnvs());
describe("saved connection permission at the admin launch boundary", () => {
  it("does nothing when live automation is disabled", async () => {
    const call = rpc(); vi.stubEnv("VIGIL_DOMAIN_LIVE_ENABLED", "false");
    await prepareManagedWebsiteLaunch(db.asClient(), website); await connectManagedDomainAtLaunch(db.asClient(), domain, provider);
    expect(call).not.toHaveBeenCalled(); expect(mocks.bind).not.toHaveBeenCalled(); expect(mocks.apply).not.toHaveBeenCalled();
  });
  it("never infers legacy customer permission from a verified email", async () => {
    rpc(null); await prepareManagedWebsiteLaunch(db.asClient(), website); await connectManagedDomainAtLaunch(db.asClient(), domain, provider);
    expect(mocks.bind).not.toHaveBeenCalled(); expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.apply).not.toHaveBeenCalled();
  });
  it("checks fresh registrar truth before binding and never writes DNS in preflight", async () => {
    rpc(); await prepareManagedWebsiteLaunch(db.asClient(), website);
    expect(mocks.sync).toHaveBeenCalledWith(db.asClient(), registration, org);
    expect(mocks.bind).toHaveBeenCalledWith(db.asClient(), registration, website, org, owner);
    expect(mocks.sync.mock.invocationCallOrder[0]).toBeLessThan(mocks.bind.mock.invocationCallOrder[0]);
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.apply).not.toHaveBeenCalled();
  });
  it("stops if fresh reconciliation removes connection eligibility", async () => {
    rpc().mockResolvedValueOnce({ data: [{ registrationId: registration, organizationId: org }], error: null } as never).mockResolvedValueOnce({ data: null, error: null } as never);
    await expect(prepareManagedWebsiteLaunch(db.asClient(), website)).rejects.toThrow("needs attention"); expect(mocks.bind).not.toHaveBeenCalled();
  });
  it("rejects a cross-tenant saved context before any provider operation", async () => {
    rpc({ ...context, organizationId: owner });
    await expect(managedLaunchContext(db.asClient(), registration, org, website)).rejects.toThrow("does not match"); expect(mocks.apply).not.toHaveBeenCalled();
  });
  it("uses the existing production-gated exact DNS plan for the saved customer owner", async () => {
    rpc(); await connectManagedDomainAtLaunch(db.asClient(), domain, provider);
    expect(mocks.prepare).toHaveBeenCalledWith(db.asClient(), registration, org, owner, provider, order);
    expect(mocks.apply).toHaveBeenCalledWith(db.asClient(), plan, org, owner, true, "live");
  });
  it.each(["claimed", "review"])("reconciles an uncertain %s plan without preparing another write", async status => {
    rpc(context, { id: plan, status }); await connectManagedDomainAtLaunch(db.asClient(), domain, provider);
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.apply).toHaveBeenCalledWith(db.asClient(), plan, org, owner, true, "live");
  });
  it("leaves HTTPS and final website publication pending while a saved write is processing", async () => {
    rpc(); mocks.apply.mockResolvedValueOnce({ applied: false });
    await expect(connectManagedDomainAtLaunch(db.asClient(), domain, provider)).rejects.toThrow("reconciling");
  });
});
