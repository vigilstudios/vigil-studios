import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import type { ProvisioningJob } from "../types";
import type { syncManagedRegistration } from "../domain-engine/registrar-sync";
import { notifyRegisteredDomainReady } from "../services/registered-domain-notifications";
const registration = "10000000-0000-4000-8000-000000000003";
const job = { id: "job-a", kind: "domain.registration.ready.notify", organization_id: "org-a", website_id: "site-a", locked_by: "worker-a", locked_at: "2026-11-01T12:00:00Z", status: "running", payload: { registration_id: registration } } as unknown as ProvisioningJob;
const sync = vi.fn<typeof syncManagedRegistration>();
const transport = vi.fn<(message: { to: string; text: string }, key: string) => Promise<string>>();
let db: FakeAdmin;
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("STAFF_NOTIFY_EMAIL", "staff@example.test");
  sync.mockResolvedValue({ changed: true, status: "registered", contactVerification: "verified" }); transport.mockResolvedValue("email-a");
  db = new FakeAdmin({
    organizations: [{ id: "org-a", name: "Ready Fixture" }],
    websites: [{ id: "site-a", organization_id: "org-a", status: "building", live_url: null }],
    domain_registrations: [{ id: registration, organization_id: "org-a", website_id: "site-a", fqdn: "example.com", environment: "live", registrar: "namecom", registration_status: "registered" }],
    domain_orders: [{ id: "order-a", registration_id: registration, organization_id: "org-a", environment: "live", operation: "register", registration_state: "registered", payment_state: "paid" }],
    provisioning_jobs: [{ ...job }],
  });
  vi.spyOn(db, "rpc").mockResolvedValue({ data: { automaticConnection: true, staffNotified: true }, error: null } as never);
});
afterEach(() => vi.unstubAllEnvs());
describe("verified registration handoff email", () => {
  it("notifies staff once, with no publishing or DNS changes", async () => {
    const before = JSON.stringify([db.rows("domain_registrations"), db.rows("websites")]);
    expect(await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport })).toMatchObject({ status: "sent" });
    expect(transport.mock.calls[0][0]).toMatchObject({ to: "staff@example.test" });
    expect(transport.mock.calls[0][0].text).toContain("authorized automatic website connection");
    expect(transport.mock.calls[0][0].text).toContain("No website has been approved or published");
    await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport });
    expect(transport).toHaveBeenCalledTimes(1); expect(JSON.stringify([db.rows("domain_registrations"), db.rows("websites")])).toBe(before);
  });
  it.each(["organization_id", "website_id", "locked_by", "locked_at"])("rejects a mismatched %s before emailing", async field => {
    await expect(notifyRegisteredDomainReady(db.asClient(), { ...job, [field]: "foreign" }, { sync, transport })).rejects.toThrow("no longer matches"); expect(transport).not.toHaveBeenCalled();
  });
  it.each(["pending", "failed"] as const)("waits if registrar verification is now %s", async contactVerification => {
    sync.mockResolvedValueOnce({ changed: true, status: "registered", contactVerification });
    expect(await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport })).toMatchObject({ status: "waiting" }); expect(transport).not.toHaveBeenCalled();
  });
  it("does not announce a failed capture or refunded order", async () => {
    db.rows("domain_orders")[0].payment_state = "capture_failed";
    expect(await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport })).toMatchObject({ status: "waiting" }); expect(transport).not.toHaveBeenCalled();
  });
  it("makes missing legacy permission visible to staff", async () => {
    vi.mocked(db.rpc).mockResolvedValueOnce({ data: { automaticConnection: false }, error: null } as never);
    await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport }); expect(transport.mock.calls[0][0].text).toContain("no saved automatic-connection permission");
  });
  it("reuses the exact message and key after a lost provider response", async () => {
    transport.mockRejectedValueOnce(new Error("response lost"));
    await expect(notifyRegisteredDomainReady(db.asClient(), job, { sync, transport })).rejects.toThrow("response lost");
    vi.stubEnv("STAFF_NOTIFY_EMAIL", "changed@example.test"); db.rows("organizations")[0].name = "Changed";
    await notifyRegisteredDomainReady(db.asClient(), job, { sync, transport });
    expect(transport.mock.calls[0]).toEqual(transport.mock.calls[1]);
  });
  it("stops an uncertain retry before the provider idempotency window expires", async () => {
    db.rows("provisioning_jobs")[0].payload = { registration_id: registration, first_attempt_at: new Date(Date.now() - 24 * 3600_000).toISOString() };
    await expect(notifyRegisteredDomainReady(db.asClient(), job, { sync, transport })).rejects.toThrow("manual delivery review"); expect(transport).not.toHaveBeenCalled();
  });
});
