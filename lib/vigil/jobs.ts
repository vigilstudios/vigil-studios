import { ProviderError, ProviderNotConfiguredError, isVigilError } from "@/lib/vigil/auth/errors";
import { escapeHtml, layout, sendEmail, staffNotificationAddress } from "@/lib/vigil/email";
import type { DbClient, ProvisioningJob } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { deployWebsite, provisionWebsite, syncDeployment } from "./services/deployment";
import { beginDomainVerification, verifyDomain } from "./services/domain";
import { provisionOrder } from "./services/orders";
import { provisionWebsiteRepository } from "./services/repository";

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
  websiteRepository: "website.repository",
  deploymentSync: "website.deployment.sync",
  domainConnect: "domain.connect",
  domainVerify: "domain.verify",
  orderProvision: "order.provision",
} as const;

export type JobKind = (typeof JOB_KINDS)[keyof typeof JOB_KINDS];

export type JobContext = {
  admin: DbClient;
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
    // Covers older/manual websites and a deploy clicked while the automatic
    // post-purchase repository job is still queued.
    await provisionWebsiteRepository(admin, job.website_id);
    const payload = (job.payload ?? {}) as { environment?: "production" | "preview" };
    const result = await deployWebsite(admin, job.website_id, {
      environment: payload.environment ?? "production",
      triggeredBy: job.created_by,
    });
    if (result.status === "queued" || result.status === "building") {
      await enqueueJob(admin, {
        kind: JOB_KINDS.deploymentSync,
        idempotencyKey: `website.deployment.sync:${result.deploymentId}`,
        organizationId: job.organization_id,
        websiteId: job.website_id,
        payload: { deployment_id: result.deploymentId },
        scheduledFor: new Date(Date.now() + 15_000),
        maxAttempts: 40,
        createdBy: job.created_by,
      });
    }
    for (const domainId of result.domainIds) {
      await enqueueJob(admin, {
        kind: JOB_KINDS.domainVerify,
        idempotencyKey: `domain.verify:${domainId}:deployment:${result.deploymentId}`,
        organizationId: job.organization_id,
        websiteId: job.website_id,
        domainId,
        maxAttempts: 50,
        createdBy: job.created_by,
      });
    }
    return { deployment_id: result.deploymentId };
  },
  [JOB_KINDS.websiteRepository]: async ({ admin, job }) => {
    if (!job.website_id) throw new Error("website.repository requires website_id");
    const result = await provisionWebsiteRepository(admin, job.website_id);
    return { repository_id: result.repositoryId, repository: result.fullName, created: result.created };
  },
  [JOB_KINDS.deploymentSync]: async ({ admin, job }) => {
    const deploymentId = (job.payload as { deployment_id?: string } | null)?.deployment_id;
    if (!deploymentId) throw new Error("website.deployment.sync requires payload.deployment_id");
    const result = await syncDeployment(admin, deploymentId);
    if (result.pending) throw new RetryLater(`Deployment is ${result.status}.`, 15);
    for (const domainId of result.domainIds) {
      await enqueueJob(admin, {
        kind: JOB_KINDS.domainVerify,
        idempotencyKey: `domain.verify:${domainId}:deployment:${deploymentId}`,
        organizationId: job.organization_id,
        websiteId: job.website_id,
        domainId,
        maxAttempts: 50,
        createdBy: job.created_by,
        requeueFailed: true,
      });
    }
    return { deployment_id: deploymentId, status: result.status };
  },
  [JOB_KINDS.domainConnect]: async ({ admin, job }) => {
    if (!job.domain_id) throw new Error("domain.connect requires domain_id");
    await beginDomainVerification(admin, job.domain_id);
  },
  [JOB_KINDS.orderProvision]: async ({ admin, job }) => {
    const payload = (job.payload ?? {}) as { order_id?: string };
    if (!payload.order_id) throw new Error("order.provision requires payload.order_id");
    const result = await provisionOrder(admin, payload.order_id);
    await enqueueJob(admin, {
      kind: JOB_KINDS.websiteRepository,
      idempotencyKey: `website.repository:${result.websiteId}`,
      organizationId: result.organizationId,
      websiteId: result.websiteId,
      maxAttempts: 8,
      createdBy: job.created_by,
      requeueFailed: true,
    });
    return { organization_id: result.organizationId, website_id: result.websiteId, already_provisioned: result.alreadyProvisioned };
  },
  [JOB_KINDS.domainVerify]: async ({ admin, job }) => {
    if (!job.domain_id) throw new Error("domain.verify requires domain_id");
    const result = await verifyDomain(admin, job.domain_id);
    if (!result.connected) {
      // Not an error: DNS takes time. Re-check later without burning attempts.
      // With no provider site yet there is nothing to connect to, so check
      // less often; the deploy step re-queues a verify when the site exists.
      if (result.reason === "no_site") throw new RetryLater(result.dnsOk ? "DNS correct; waiting for the website" : "DNS not yet verified; no site yet", 6 * 60 * 60);
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
  /**
   * If the job already exists and has failed or been cancelled, queue it
   * again now instead of returning it as is. For work whose trigger can
   * recur (a webhook redelivered, a success page revisited) a permanently
   * failed row must not block the retry the new trigger asks for.
   */
  requeueFailed?: boolean;
};

/** Insert or return the existing job for the idempotency key. */
export async function enqueueJob(
  admin: DbClient,
  input: EnqueueInput
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: lookupError } = await admin
    .from("provisioning_jobs")
    .select("id, status")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    if (input.requeueFailed && (existing.status === "failed" || existing.status === "canceled")) {
      const { error: requeueError } = await admin
        .from("provisioning_jobs")
        .update({ status: "queued", scheduled_for: (input.scheduledFor ?? new Date()).toISOString(), locked_by: null, locked_at: null, finished_at: null })
        .eq("id", existing.id)
        .in("status", ["failed", "canceled"]);
      if (requeueError) throw requeueError;
    }
    return { id: existing.id, created: false };
  }

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
  // Unknown failures are retried: a transient network error looks the same
  // as a bug, and attempts are bounded. Plain objects with a message (a
  // PostgREST error thrown as is) are described rather than "[object Object]".
  const message =
    error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error);
  return { retryable: true, delaySeconds: null, message, code: "unknown" };
}

export async function runDueJobs(
  admin: DbClient,
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

async function runOne(admin: DbClient, job: ProvisioningJob): Promise<JobOutcome> {
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
    console.error(`[jobs] ${job.kind} ${job.id} attempt ${job.attempts} failed:`, err);
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
    await notifyPermanentFailure(job, failure.message, exhausted).catch(() => undefined);
    return { id: job.id, kind: job.kind, status: "failed", error: failure.message };
  }
}

/**
 * A job that will not run again on its own is a person's problem now. One
 * email to the staff address, with enough to act on; never throws.
 */
export async function notifyPermanentFailure(job: Pick<ProvisioningJob, "id" | "kind" | "attempts" | "organization_id" | "website_id" | "domain_id" | "payload">, message: string, exhausted: boolean): Promise<void> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vigilstudios.co").replace(/\/$/, "");
  const orderId = (job.payload as { order_id?: string } | null)?.order_id;
  const what = job.kind === JOB_KINDS.orderProvision ? "A paid order could not be provisioned: the customer has paid and has no account yet." : `${job.kind} stopped.`;
  const why = exhausted ? `Gave up after ${job.attempts} attempts. Last error: ${message}` : `Not retryable: ${message}`;
  const where = orderId ? `${appUrl}/admin/orders` : job.organization_id ? `${appUrl}/admin/organizations/${job.organization_id}` : `${appUrl}/admin/jobs`;
  await sendEmail({
    to: staffNotificationAddress(),
    subject: `Needs attention: ${job.kind} failed`,
    text: `${what}\n\n${why}\n\nJob ${job.id}${orderId ? `, order ${orderId}` : ""}. Retry it from ${appUrl}/admin/jobs once the cause is fixed.\n${where}`,
    html: layout(`Needs attention: ${escapeHtml(job.kind)} failed`, `<p>${escapeHtml(what)}</p><p>${escapeHtml(why)}</p><p style="color:#666;font-size:13px">Job ${escapeHtml(job.id)}${orderId ? `, order ${escapeHtml(orderId)}` : ""}. Retry it from <a href="${appUrl}/admin/jobs">Jobs</a> once the cause is fixed.</p>`),
  });
}
