import { describe, expect, it } from "vitest";
import { ProviderError, ProviderNotConfiguredError } from "../auth/errors";
import { backoffSeconds, classifyFailure, enqueueJob, registerJobHandler, RetryLater, runDueJobs } from "../jobs";
import { FakeAdmin } from "./fake-admin";

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
