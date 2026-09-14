import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { ProviderError, ProviderNotConfiguredError, isVigilError } from "@/lib/vigil/auth/errors";
import type { ProvisioningJob } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { deployWebsite, provisionWebsite } from "./services/deployment";
import { beginDomainVerification, verifyDomain } from "./services/domain";

/**
 * Durable, idempotent background work (master architecture §9).
 *
 * A job is a row in provisioning_jobs. `enqueueJob` is safe to call twice
 * with the same idempotency key; `runDueJobs` claims rows with a lease and
 * runs the registered handler, retrying with exponential backoff while the
 * failure is retryable and attempts remain.
 */
export const JOB_KINDS = {
  websiteProvision: "website.provision",
  websiteDeploy: "website.deploy",
  domainConnect: "domain.connect",
  domainVerify: "domain.verify",
} as const;

export type JobKind = (typeof JOB_KINDS)[keyof typeof JOB_KINDS];

export type JobContext = {
  admin: AdminSupabaseClient;
  job: ProvisioningJob;
};

export type JobHandler = (ctx: JobContext) => Promise<Json | void>;

const handlers = new Map<string, JobHandler>();

/** Register a handler for a job kind. Later phases add their own kinds here. */
export function registerJobHandler(kind: string, handler: JobHandler): void {
  handlers.set(kind, handler);
}

const builtInHandlers: Record<JobKind, JobHandler> = {
  [JOB_KINDS.websiteProvision]: async ({ admin, job }) => {
    if (!job.website_id) throw new Error("website.provision requires website_id");
    const result = await provisionWebsite(admin, job.website_id);
    return { site_external_id: result.siteExternalId };
  },
  [JOB_KINDS.websiteDeploy]: async ({ admin, job }) => {
    if (!job.website_id) throw new Error("website.deploy requires website_id");
    const payload = (job.payload ?? {}) as { environment?: "production" | "preview" };
    const result = await deployWebsite(admin, job.website_id, {
      environment: payload.environment ?? "production",
      triggeredBy: job.created_by,
    });
    return { deployment_id: result.deploymentId };
  },
  [JOB_KINDS.domainConnect]: async ({ admin, job }) => {
    if (!job.domain_id) throw new Error("domain.connect requires domain_id");
    await beginDomainVerification(admin, job.domain_id);
  },
  [JOB_KINDS.domainVerify]: async ({ admin, job }) => {
    if (!job.domain_id) throw new Error("domain.verify requires domain_id");
    const result = await verifyDomain(admin, job.domain_id);
    if (!result.connected) {
      // Not an error: DNS takes time. Re-check later without burning attempts.
      throw new RetryLater("DNS not yet verified", 15 * 60);
    }
    return { connected: true };
  },
};

for (const [kind, handler] of Object.entries(builtInHandlers)) {
  registerJobHandler(kind, handler);
}

export class RetryLater extends Error {
  readonly delaySeconds: number;
  constructor(message: string, delaySeconds: number) {
    super(message);
    this.name = "RetryLater";
    this.delaySeconds = delaySeconds;
  }
}

export function isKnownJobKind(kind: string): boolean {
  return handlers.has(kind);
}

export type EnqueueInput = {
  kind: JobKind | (string & {});
  idempotencyKey: string;
  organizationId?: string | null;
  websiteId?: string | null;
  domainId?: string | null;
  payload?: Record<string, Json>;
  scheduledFor?: Date;
  maxAttempts?: number;
  createdBy?: string | null;
};

/** Insert or return the existing job for the idempotency key. */
export async function enqueueJob(
  admin: AdminSupabaseClient,
  input: EnqueueInput
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: lookupError } = await admin
    .from("provisioning_jobs")
    .select("id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await admin
    .from("provisioning_jobs")
    .insert({
      kind: input.kind,
      idempotency_key: input.idempotencyKey,
      organization_id: input.organizationId ?? null,
      website_id: input.websiteId ?? null,
      domain_id: input.domainId ?? null,
      payload: input.payload ?? {},
      scheduled_for: (input.scheduledFor ?? new Date()).toISOString(),
      max_attempts: input.maxAttempts ?? 5,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // Lost a race with a concurrent enqueue: the unique key already exists.
    if (error.code === "23505") {
      const { data: raced } = await admin
        .from("provisioning_jobs")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .single();
      if (raced) return { id: raced.id, created: false };
    }
    throw error;
  }
  return { id: data.id, created: true };
}

/** Exponential backoff capped at one hour: 30s, 60s, 120s, ... */
export function backoffSeconds(attempt: number, base = 30, cap = 3600): number {
  return Math.min(cap, base * 2 ** Math.max(0, attempt - 1));
}

export type JobOutcome = {
  id: string;
  kind: string;
  status: "succeeded" | "failed" | "queued";
  error?: string;
};

export function classifyFailure(error: unknown): { retryable: boolean; delaySeconds: number | null; message: string; code: string } {
  if (error instanceof RetryLater) {
    return { retryable: true, delaySeconds: error.delaySeconds, message: error.message, code: "retry_later" };
  }
  if (error instanceof ProviderNotConfiguredError) {
    return { retryable: false, delaySeconds: null, message: error.message, code: error.code };
  }
  if (error instanceof ProviderError) {
    return { retryable: error.retryable, delaySeconds: null, message: error.message, code: error.code };
  }
  if (isVigilError(error)) {
    return { retryable: false, delaySeconds: null, message: error.message, code: error.code };
  }
  const message = error instanceof Error ? error.message : String(error);
  // Unknown failures are retried: a transient network error looks the same
  // as a bug, and attempts are bounded.
  return { retryable: true, delaySeconds: null, message, code: "unknown" };
}

export async function runDueJobs(
  admin: AdminSupabaseClient,
  options: { worker: string; limit?: number; leaseSeconds?: number } 
): Promise<JobOutcome[]> {
  const { data: claimed, error } = await admin.rpc("claim_jobs", {
    p_worker: options.worker,
    p_limit: options.limit ?? 10,
    p_lease_seconds: options.leaseSeconds ?? 300,
  });
  if (error) throw error;

  const outcomes: JobOutcome[] = [];
  for (const job of claimed ?? []) {
    outcomes.push(await runOne(admin, job));
  }
  return outcomes;
}

async function runOne(admin: AdminSupabaseClient, job: ProvisioningJob): Promise<JobOutcome> {
  const finishedAt = new Date().toISOString();

  const handler = handlers.get(job.kind);
  if (!handler) {
    await admin
      .from("provisioning_jobs")
      .update({ status: "failed", error: { code: "unknown_kind", message: `No handler for ${job.kind}` }, finished_at: finishedAt, locked_by: null, locked_at: null })
      .eq("id", job.id);
    return { id: job.id, kind: job.kind, status: "failed", error: `No handler for ${job.kind}` };
  }

  try {
    const result = await handler({ admin, job });
    await admin
      .from("provisioning_jobs")
      .update({ status: "succeeded", result: result ?? null, error: null, finished_at: finishedAt, locked_by: null, locked_at: null })
      .eq("id", job.id);
    return { id: job.id, kind: job.kind, status: "succeeded" };
  } catch (err) {
    const failure = classifyFailure(err);
    const exhausted = job.attempts >= job.max_attempts;
    const errorJson = { code: failure.code, message: failure.message, attempt: job.attempts };

    if (failure.retryable && !exhausted) {
      const delay = failure.delaySeconds ?? backoffSeconds(job.attempts);
      const scheduledFor = new Date(Date.now() + delay * 1000).toISOString();
      await admin
        .from("provisioning_jobs")
        .update({ status: "queued", error: errorJson, scheduled_for: scheduledFor, locked_by: null, locked_at: null })
        .eq("id", job.id);
      return { id: job.id, kind: job.kind, status: "queued", error: failure.message };
    }

    await admin
      .from("provisioning_jobs")
      .update({ status: "failed", error: errorJson, finished_at: finishedAt, locked_by: null, locked_at: null })
      .eq("id", job.id);
    return { id: job.id, kind: job.kind, status: "failed", error: failure.message };
  }
}
