import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
const state = vi.hoisted(() => ({ sync: vi.fn() }));
vi.mock("../domain-engine/registrar-sync", () => ({
  syncManagedRegistrations: state.sync,
}));
import { JOB_KINDS, runDueJobs } from "../jobs";
const scope = `namecom:test:${"a".repeat(64)}`,
  signal = "b".repeat(64);
let db: FakeAdmin;
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.sync
    .mockReset()
    .mockResolvedValue({ checked: 1, changed: 0, failed: 0, nextCursor: null });
  db = new FakeAdmin({
    provisioning_jobs: [
      {
        id: "signal-job",
        kind: JOB_KINDS.domainLifecycleSync,
        status: "queued",
        attempts: 0,
        max_attempts: 10,
        payload: { account_scope: scope, signal },
        scheduled_for: "2026-01-01T00:00:00Z",
      },
    ],
  });
});
afterEach(() => vi.restoreAllMocks());
describe("durable registrar signal worker", () => {
  it("requeues failed reads without treating them as success or invoking domain mutations", async () => {
    state.sync.mockResolvedValueOnce({
      checked: 1,
      changed: 0,
      failed: 1,
      nextCursor: null,
    });
    expect(
      (await runDueJobs(db.asClient(), { worker: "fixture", limit: 1 }))[0]
        .status,
    ).toBe("queued");
    expect(
      Date.parse(String(db.rows("provisioning_jobs")[0].scheduled_for)),
    ).toBeGreaterThan(Date.now() + 29 * 60_000);
    expect(state.sync).toHaveBeenCalledWith(db.asClient(), {
      accountScope: scope,
      cursor: undefined,
      force: true,
    });
    expect(db.rows("domain_orders")).toHaveLength(0);
  });
  it("continues a bounded batch with the same account and signed-content identity", async () => {
    const cursor = "10000000-0000-4000-8000-000000000001";
    state.sync.mockResolvedValueOnce({
      checked: 5,
      changed: 0,
      failed: 0,
      nextCursor: cursor,
    });
    expect(
      (await runDueJobs(db.asClient(), { worker: "fixture", limit: 1 }))[0]
        .status,
    ).toBe("succeeded");
    const next = db
      .rows("provisioning_jobs")
      .find((row) => row.id !== "signal-job");
    expect(next).toMatchObject({
      kind: JOB_KINDS.domainLifecycleSync,
      payload: { account_scope: scope, signal, cursor },
    });
    expect(next?.idempotency_key).toBe(
      `domain.lifecycle:${scope}:${signal}:${cursor}`,
    );
  });
});
