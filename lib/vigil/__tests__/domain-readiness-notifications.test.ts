import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { notifyDomainReadiness, sendDomainReadinessEmail } from "../services/domain-readiness-notifications";
import type { ProvisioningJob } from "../types";
import type { DnsRecord } from "../services/dns";

const checkDns = vi.fn(async (_hostname: string, records: DnsRecord[]) => records.map(record => ({ record, found: [record.value], ok: true })));
const transport = vi.fn<(message: { to: string; text: string }, key: string) => Promise<string>>().mockResolvedValue("email-1");
const job = { id: "job-a", kind: "domain.readiness.notify", organization_id: "org-a", website_id: "site-a", domain_id: "domain-a", locked_by: "worker-a", status: "running", payload: {} } as ProvisioningJob;
function fixture() {
  return new FakeAdmin({
    organizations: [{ id: "org-a", name: "Ready Fixture" }],
    websites: [{ id: "site-a", organization_id: "org-a", status: "building", live_url: null, primary_domain_id: null }],
    domains: [{ id: "domain-a", organization_id: "org-a", website_id: "site-a", hostname: "example.com", source: "customer_owned", status: "verifying", dns_ok: true, ssl_ok: false, verification_token: "proof", verification: { source: "platform", launch_ready: true } }],
    provisioning_jobs: [{ ...job }],
  });
}
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.stubEnv("STAFF_NOTIFY_EMAIL", "staff@example.test"); transport.mockResolvedValue("email-1"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("staff readiness delivery", () => {
  it("sends the verified prelaunch event once without publishing or marking connected", async () => {
    const db = fixture(); const before = JSON.stringify([db.rows("domains"), db.rows("websites")]);
    expect(await notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).toMatchObject({ status: "sent" });
    const message = transport.mock.calls[0][0];
    expect(message.to).toBe("staff@example.test"); expect(message.text).toContain("remains unpublished"); expect(message.text).toContain("/admin/organizations/org-a?domain=domain-a");
    await notifyDomainReadiness(db.asClient(), job, { checkDns, transport });
    expect(transport).toHaveBeenCalledTimes(1); expect(JSON.stringify([db.rows("domains"), db.rows("websites")])).toBe(before);
  });
  it.each(["organization_id", "website_id", "domain_id"] as const)("rejects a mismatched %s before any email", async field => {
    const db = fixture();
    await expect(notifyDomainReadiness(db.asClient(), { ...job, [field]: "foreign" }, { checkDns, transport })).rejects.toThrow("no longer matches");
    expect(transport).not.toHaveBeenCalled();
  });
  it("waits when the proof is no longer publicly visible", async () => {
    const db = fixture(); const absent = async (_hostname: string, records: DnsRecord[]) => records.map(record => ({ record, found: [], ok: false }));
    expect(await notifyDomainReadiness(db.asClient(), job, { checkDns: absent, transport })).toMatchObject({ status: "waiting" });
    expect(transport).not.toHaveBeenCalled(); expect(db.rows("provisioning_jobs")[0].payload).toEqual({});
  });
  it("does not announce a pending row with stale readiness flags", async () => {
    const db = fixture(); db.rows("domains")[0].status = "pending";
    expect(await notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).toMatchObject({ status: "waiting" }); expect(transport).not.toHaveBeenCalled();
  });
  it("does not send a readiness email for an already live or released domain", async () => {
    const db = fixture(); db.rows("websites")[0].status = "live";
    expect(await notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).toMatchObject({ status: "skipped" });
    db.rows("websites")[0].status = "building"; db.rows("domains")[0].status = "released";
    expect(await notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).toMatchObject({ status: "skipped" }); expect(transport).not.toHaveBeenCalled();
  });
  it("retries with the exact frozen message and key after an uncertain acknowledgement", async () => {
    const db = fixture(); const original = db.from.bind(db); let failAck = true;
    vi.spyOn(db, "from").mockImplementation(table => {
      const builder = original(table); const run = builder.run.bind(builder);
      builder.run = () => {
        if (table === "provisioning_jobs" && failAck && (builder._payload?.payload as Record<string, unknown> | undefined)?.email_sent_at) { failAck = false; return { data: null, error: { message: "lost acknowledgement" } }; }
        return run();
      }; return builder;
    });
    await expect(notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).rejects.toMatchObject({ message: "lost acknowledgement" });
    vi.stubEnv("STAFF_NOTIFY_EMAIL", "changed@example.test");
    await notifyDomainReadiness(db.asClient(), job, { checkDns, transport });
    expect(transport).toHaveBeenCalledTimes(2); expect(transport.mock.calls[1]).toEqual(transport.mock.calls[0]);
    expect(transport.mock.calls[0][1]).toBe("domain-readiness/job-a");
    expect((db.rows("provisioning_jobs")[0].payload as Record<string, unknown>).email_provider_id).toBe("email-1");
  });
  it("stops uncertain email retries before the provider deduplication window expires", async () => {
    const db = fixture(); db.rows("provisioning_jobs")[0].payload = { first_attempt_at: new Date(Date.now() - 23 * 3600_000).toISOString() };
    await expect(notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).rejects.toThrow("manual delivery review"); expect(transport).not.toHaveBeenCalled();
  });
  it("fails closed on a changed job lease", async () => {
    const db = fixture(); db.rows("provisioning_jobs")[0].locked_by = "another-worker";
    await expect(notifyDomainReadiness(db.asClient(), job, { checkDns, transport })).rejects.toThrow("lease"); expect(transport).not.toHaveBeenCalled();
  });
});

describe("provider acceptance", () => {
  const message = { from: "Vigil <hello@vigilstudios.co>", to: "delivered@resend.dev", reply_to: "hello@vigilstudios.co", subject: "Fixture", text: "Fixture", html: "<p>Fixture</p>" };
  it("treats missing provider configuration as undelivered", async () => {
    vi.stubEnv("RESEND_API_KEY", ""); const request = vi.fn(); vi.stubGlobal("fetch", request);
    await expect(sendDomainReadinessEmail(message, "key-a")).rejects.toThrow("not configured"); expect(request).not.toHaveBeenCalled();
  });
  it("requires a confirmed provider ID and sends the stable idempotency header", async () => {
    vi.stubEnv("RESEND_API_KEY", "fixture-key"); const request = vi.fn<(url: string, options?: RequestInit) => Promise<Response>>().mockResolvedValue(Response.json({ id: "provider-a" })); vi.stubGlobal("fetch", request);
    expect(await sendDomainReadinessEmail(message, "key-a")).toBe("provider-a");
    expect(request.mock.calls[0][1]).toMatchObject({ headers: { "Idempotency-Key": "key-a" }, body: JSON.stringify(message) });
    request.mockResolvedValueOnce(Response.json({})); await expect(sendDomainReadinessEmail(message, "key-a")).rejects.toThrow("not confirmed");
  });
});
