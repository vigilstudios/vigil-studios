import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError, ProviderNotConfiguredError } from "../auth/errors";
import { sendEmail } from "../email";
import { backoffSeconds, classifyFailure, enqueueJob, registerJobHandler, RetryLater, runDueJobs } from "../jobs";
import { FakeAdmin } from "./fake-admin";

vi.mock("../email", async (importOriginal) => ({ ...(await importOriginal<typeof import("../email")>()), sendEmail: vi.fn(async () => ({ sent: true, id: "em_1" })) }));
const sent = vi.mocked(sendEmail);
vi.spyOn(console, "error").mockImplementation(() => undefined);
beforeEach(() => sent.mockClear());

describe("backoffSeconds", () => {
  it("doubles from 30s and caps at an hour", () => {
    expect(backoffSeconds(1)).toBe(30);
    expect(backoffSeconds(2)).toBe(60);
    expect(backoffSeconds(3)).toBe(120);
    expect(backoffSeconds(20)).toBe(3600);
  });
});

describe("classifyFailure", () => {
  it("never retries a provider that is not configured", () => {
    expect(classifyFailure(new ProviderNotConfiguredError("Stripe")).retryable).toBe(false);
  });
  it("honours the provider's retryable flag", () => {
    expect(classifyFailure(new ProviderError("vercel", "rate limited", { retryable: true })).retryable).toBe(true);
    expect(classifyFailure(new ProviderError("vercel", "bad request", { retryable: false })).retryable).toBe(false);
  });
  it("describes a thrown plain object by its message", () => {
    expect(classifyFailure({ code: "23505", message: "duplicate key" }).message).toBe("duplicate key");
  });
  it("retries unknown errors and RetryLater with its delay", () => {
    expect(classifyFailure(new Error("socket hang up")).retryable).toBe(true);
    const later = classifyFailure(new RetryLater("dns pending", 900));
    expect(later.retryable).toBe(true);
    expect(later.delaySeconds).toBe(900);
  });
});

describe("enqueueJob", () => {
  it("is idempotent on the key", async () => {
    const fake = new FakeAdmin();
    const a = await enqueueJob(fake.asClient(), { kind: "website.provision", idempotencyKey: "k1", websiteId: "w1" });
    const b = await enqueueJob(fake.asClient(), { kind: "website.provision", idempotencyKey: "k1", websiteId: "w1" });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);
    expect(fake.rows("provisioning_jobs")).toHaveLength(1);
  });

  it("leaves a failed job alone unless asked to requeue it", async () => {
    const fake = new FakeAdmin();
    const a = await enqueueJob(fake.asClient(), { kind: "order.provision", idempotencyKey: "order.provision:o1" });
    fake.rows("provisioning_jobs")[0].status = "failed";
    fake.rows("provisioning_jobs")[0].finished_at = new Date().toISOString();

    const b = await enqueueJob(fake.asClient(), { kind: "order.provision", idempotencyKey: "order.provision:o1" });
    expect(b).toEqual({ id: a.id, created: false });
    expect(fake.rows("provisioning_jobs")[0].status).toBe("failed");

    const c = await enqueueJob(fake.asClient(), { kind: "order.provision", idempotencyKey: "order.provision:o1", requeueFailed: true });
    expect(c).toEqual({ id: a.id, created: false });
    const row = fake.rows("provisioning_jobs")[0];
    expect(row.status).toBe("queued");
    expect(row.finished_at).toBeNull();
    expect(fake.rows("provisioning_jobs")).toHaveLength(1);
  });
});

describe("runDueJobs", () => {
  const seedJob = (overrides: Record<string, unknown>) => ({
    id: "j1",
    kind: "test.ok",
    idempotency_key: "j1",
    status: "queued",
    attempts: 0,
    max_attempts: 3,
    scheduled_for: new Date(0).toISOString(),
    payload: {},
    website_id: null,
    domain_id: null,
    organization_id: null,
    created_by: null,
    ...overrides,
  });

  it("marks a successful job succeeded with its result", async () => {
    registerJobHandler("test.ok", async () => ({ done: true }));
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({})] });
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out).toEqual([{ id: "j1", kind: "test.ok", status: "succeeded" }]);
    const row = fake.rows("provisioning_jobs")[0];
    expect(row.status).toBe("succeeded");
    expect(row.result).toEqual({ done: true });
    expect(row.locked_by).toBeNull();
  });

  it("re-queues a retryable failure with backoff while attempts remain", async () => {
    registerJobHandler("test.flaky", async () => {
      throw new Error("timeout");
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "test.flaky" })] });
    const before = Date.now();
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out[0].status).toBe("queued");
    const row = fake.rows("provisioning_jobs")[0];
    expect(row.status).toBe("queued");
    expect(row.attempts).toBe(1);
    expect(new Date(String(row.scheduled_for)).getTime()).toBeGreaterThanOrEqual(before + 30_000);
    expect((row.error as { code: string }).code).toBe("unknown");
  });

  it("emails staff once a job will not run again, saying what it means for the customer", async () => {
    registerJobHandler("order.provision", async () => {
      throw new ProviderError("stripe", "customer deleted", { retryable: false });
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "order.provision", payload: { order_id: "ord_9" } })] });
    await runDueJobs(fake.asClient(), { worker: "w" });
    expect(fake.rows("provisioning_jobs")[0].status).toBe("failed");
    expect(sent).toHaveBeenCalledTimes(1);
    const mail = sent.mock.calls[0][0];
    expect(mail.subject).toBe("Needs attention: order.provision failed");
    expect(mail.text).toMatch(/paid and has no account yet/);
    expect(mail.text).toMatch(/ord_9/);
    expect(mail.text).toMatch(/customer deleted/);
  });

  it("does not email for a retry that is still scheduled", async () => {
    registerJobHandler("test.flaky", async () => {
      throw new Error("socket hang up");
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "test.flaky" })] });
    await runDueJobs(fake.asClient(), { worker: "w" });
    expect(fake.rows("provisioning_jobs")[0].status).toBe("queued");
    expect(sent).not.toHaveBeenCalled();
  });

  it("fails permanently once attempts are exhausted", async () => {
    registerJobHandler("test.flaky", async () => {
      throw new Error("timeout");
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "test.flaky", attempts: 2, max_attempts: 3 })] });
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out[0].status).toBe("failed");
    expect(fake.rows("provisioning_jobs")[0].status).toBe("failed");
  });

  it("fails immediately on a non-retryable error", async () => {
    registerJobHandler("test.notconfigured", async () => {
      throw new ProviderNotConfiguredError("Stripe");
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "test.notconfigured" })] });
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out[0].status).toBe("failed");
    expect((fake.rows("provisioning_jobs")[0].error as { code: string }).code).toBe("provider_not_configured");
  });

  it("uses RetryLater's delay without treating it as an error budget hit", async () => {
    registerJobHandler("test.later", async () => {
      throw new RetryLater("dns pending", 600);
    });
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "test.later" })] });
    const before = Date.now();
    await runDueJobs(fake.asClient(), { worker: "t" });
    const row = fake.rows("provisioning_jobs")[0];
    expect(row.status).toBe("queued");
    expect(new Date(String(row.scheduled_for)).getTime()).toBeGreaterThanOrEqual(before + 600_000);
  });

  it("fails a job whose kind has no handler", async () => {
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ kind: "nope.nothing" })] });
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out[0].status).toBe("failed");
    expect(out[0].error).toMatch(/No handler/);
  });

  it("does not pick up jobs scheduled in the future", async () => {
    const fake = new FakeAdmin({ provisioning_jobs: [seedJob({ scheduled_for: new Date(Date.now() + 60_000).toISOString() })] });
    const out = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(out).toHaveLength(0);
  });
});
