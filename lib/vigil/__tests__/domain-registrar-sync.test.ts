import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { namecomSandboxScope } from "../domain-engine/namecom-sandbox";
const state = vi.hoisted(() => ({
  context: vi.fn(),
  getDomainStatus: vi.fn(),
}));
vi.mock("../domain-engine/managed-connection", () => ({
  loadManagedRegistrarContext: state.context,
}));
import {
  syncManagedRegistration,
  syncManagedRegistrations,
} from "../domain-engine/registrar-sync";
import { reconcileDomainLifecycle } from "../domain-engine/lifecycle";
const asset = "10000000-0000-4000-8000-000000000001",
  org = "org";
let db: FakeAdmin;
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VIGIL_DOMAIN_TEST_DATABASE_APPROVED", "true");
  vi.stubEnv("VIGIL_DOMAIN_TEST_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  vi.stubEnv("VIGIL_NAMECOM_SANDBOX_USERNAME", "fixture-test");
  state.getDomainStatus.mockReset();
  state.context.mockReset();
  state.context.mockResolvedValue({
    registration: { fqdn: "fixture.com" },
    registrar: {
      accountScope: namecomSandboxScope("fixture-test"),
      getRegisteredDomainStatus: state.getDomainStatus,
    },
    approved: { registrarOrderRef: "saved receipt" },
    assetRef: "saved asset",
  });
  state.getDomainStatus.mockResolvedValue({
    fqdn: "fixture.com",
    externalId: "saved asset",
    status: "registered",
    expiresAt: "2027-10-26T00:00:00Z",
    autoRenew: false,
    contactVerification: "verified",
  });
  db = new FakeAdmin({
    domain_registrations: [
      {
        id: asset,
        organization_id: org,
        registrar: "namecom",
        environment: "test",
        registration_status: "registered",
        next_check_at: "2026-01-01T00:00:00Z",
      },
    ],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("read-only registrar reconciliation", () => {
  it("binds the saved owner and reference, independently of refunded hosting/domain payment", async () => {
    const rpc = vi
      .spyOn(db, "rpc")
      .mockResolvedValue({ data: true, error: null });
    expect(
      await syncManagedRegistration(db.asClient(), asset, org),
    ).toMatchObject({ changed: true, contactVerification: "verified" });
    expect(state.context).toHaveBeenCalledWith(
      db.asClient(),
      asset,
      org,
      false,
    );
    expect(state.getDomainStatus).toHaveBeenCalledWith(
      "fixture.com",
      {
        registrarOrderRef: "saved receipt",
      },
      "saved asset",
    );
    expect(rpc).toHaveBeenCalledWith(
      "sync_managed_domain_state",
      expect.objectContaining({
        p_registration_id: asset,
        p_external_id: "saved asset",
      }),
    );
  });
  it("does not interpret a missing domain as permission to release or rebuy it", async () => {
    const rpc = vi.spyOn(db, "rpc");
    state.getDomainStatus.mockResolvedValueOnce(null);
    await expect(
      syncManagedRegistration(db.asClient(), asset, org),
    ).rejects.toThrow("No release or purchase");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("bounds batches, preserves failure state and schedules later read-only recovery", async () => {
    vi.spyOn(db, "rpc").mockResolvedValue({ data: false, error: null });
    state.getDomainStatus.mockRejectedValueOnce(Error("timeout"));
    expect(await syncManagedRegistrations(db.asClient())).toMatchObject({
      checked: 1,
      failed: 1,
    });
    expect(
      Date.parse(String(db.rows("domain_registrations")[0].next_check_at)),
    ).toBeGreaterThan(Date.now());
    expect(await syncManagedRegistrations(db.asClient())).toMatchObject({
      checked: 0,
    });
  });
  it("ignores unrelated registrars and rejects an event for another account or production", async () => {
    db.rows("domain_registrations")[0].registrar = "mock";
    expect(await syncManagedRegistrations(db.asClient())).toMatchObject({
      checked: 0,
    });
    await expect(
      syncManagedRegistrations(db.asClient(), {
        accountScope: namecomSandboxScope("other-test"),
      }),
    ).rejects.toThrow("original registrar account");
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      syncManagedRegistrations(db.asClient(), { force: true }),
    ).rejects.toThrow("approved test database");
    expect(state.getDomainStatus).not.toHaveBeenCalled();
  });
  it("does not suppress expiry warnings while contact verification is also pending", async () => {
    Object.assign(db.rows("domain_registrations")[0], {
      expires_at: "2026-10-25T00:00:00Z",
      contact_verification: "pending",
      contact_verification_deadline: null,
      created_at: "2026-10-01T00:00:00Z",
    });
    const rpc = vi
      .spyOn(db, "rpc")
      .mockResolvedValue({ data: true, error: null });
    expect(
      await reconcileDomainLifecycle(
        db.asClient(),
        new Date("2026-10-26T00:00:00Z"),
      ),
    ).toMatchObject({ delivered: 2 });
    expect(rpc).toHaveBeenCalledWith(
      "record_domain_lifecycle_notice",
      expect.objectContaining({
        p_kind: "expired",
        p_period_key: "2026-10-25T00:00:00Z",
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "record_domain_lifecycle_notice",
      expect.objectContaining({
        p_kind: "contact_verification",
        p_period_key: "2026-10-01T00:00:00Z",
      }),
    );
  });
});
