import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateCreativeWorkspace } from "../creative/service";
import { deployWebsite, provisionWebsite } from "../services/deployment";
import { provisionWebsiteRepository } from "../services/repository";
import { JOB_KINDS, enqueueJob, runDueJobs } from "../jobs";
import { FakeAdmin } from "./fake-admin";

vi.mock("../email", async (importOriginal) => ({ ...(await importOriginal<typeof import("../email")>()), sendEmail: vi.fn(async () => ({ sent: true, id: "em_1" })) }));
vi.mock("../services/repository", () => ({
  provisionWebsiteRepository: vi.fn(async () => ({ repositoryId: 42, fullName: "vigil/client-ember-oak", htmlUrl: "https://github.com/vigil/client-ember-oak", created: true })),
  assertWebsiteRepositoryReady: vi.fn(async () => undefined),
}));
vi.mock("../services/deployment", () => ({
  deployWebsite: vi.fn(async () => ({ deploymentId: "dep_1", status: "ready", domainIds: [], customerReady: false })),
  provisionWebsite: vi.fn(async () => ({ siteExternalId: "prj_1", organizationId: "org_1" })),
  syncDeployment: vi.fn(),
  finalizeWebsiteLaunch: vi.fn(),
}));
vi.mock("../creative/service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../creative/service")>()),
  generateCreativeWorkspace: vi.fn(async () => ({ status: "ready", commitSha: "abc", written: 17, preserved: 0, warnings: [], intelligence: "generated" })),
}));
vi.spyOn(console, "error").mockImplementation(() => undefined);

const repository = vi.mocked(provisionWebsiteRepository);
const deploy = vi.mocked(deployWebsite);
const provision = vi.mocked(provisionWebsite);
const generate = vi.mocked(generateCreativeWorkspace);

function seed(kind: "professional" | "express") {
  const project = { id: "proj_1", organization_id: "org_1", kind, status: "in_progress", brief: {} };
  return new FakeAdmin({
    organizations: [{ id: "org_1", name: "Ember & Oak", slug: "ember-oak" }],
    projects: [project],
    websites: [{ id: "site_1", organization_id: "org_1", project_id: "proj_1", name: "Ember & Oak website", project }],
  });
}

beforeEach(() => {
  repository.mockClear();
  deploy.mockClear();
  provision.mockClear();
  generate.mockClear();
  vi.unstubAllEnvs();
});

describe("Create Repo → creative workspace", () => {
  it("still creates the repository, then queues the workspace as its own job", async () => {
    const fake = seed("professional");
    await enqueueJob(fake.asClient(), { kind: JOB_KINDS.websiteRepository, idempotencyKey: "website.repository:site_1", organizationId: "org_1", websiteId: "site_1" });
    const first = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(first).toEqual([expect.objectContaining({ kind: "website.repository", status: "succeeded" })]);
    expect(repository).toHaveBeenCalledWith(expect.anything(), "site_1");

    const jobs = fake.rows("provisioning_jobs");
    expect(jobs.map((j) => [j.kind, j.status])).toEqual([["website.repository", "succeeded"], ["website.creative_workspace", "queued"]]);
    expect(jobs[1]).toMatchObject({ idempotency_key: "website.creative_workspace:site_1", website_id: "site_1", organization_id: "org_1", max_attempts: 6 });
    expect(fake.rows("creative_workspaces")[0]).toMatchObject({ website_id: "site_1", organization_id: "org_1", project_id: "proj_1", status: "queued" });
    expect(generate).not.toHaveBeenCalled();

    const second = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(second).toEqual([expect.objectContaining({ kind: "website.creative_workspace", status: "succeeded" })]);
    expect(generate).toHaveBeenCalledWith(expect.anything(), "site_1");
    expect(jobs[1].result).toMatchObject({ status: "ready", commit_sha: "abc", written: 17 });
  });

  it("a creative failure leaves the repository job succeeded and is retried on its own", async () => {
    const fake = seed("professional");
    generate.mockRejectedValueOnce(new Error("socket hang up"));
    await enqueueJob(fake.asClient(), { kind: JOB_KINDS.websiteRepository, idempotencyKey: "website.repository:site_1", organizationId: "org_1", websiteId: "site_1" });
    await runDueJobs(fake.asClient(), { worker: "t" });
    const outcome = await runDueJobs(fake.asClient(), { worker: "t" });
    expect(outcome[0]).toMatchObject({ kind: "website.creative_workspace", status: "queued", error: "socket hang up" });
    expect(fake.rows("provisioning_jobs")[0].status).toBe("succeeded");
    expect(fake.rows("provisioning_jobs")[1]).toMatchObject({ status: "queued", attempts: 1 });
  });

  it("does not queue a workspace for an Express template copy unless the policy says so", async () => {
    const fake = seed("express");
    await enqueueJob(fake.asClient(), { kind: JOB_KINDS.websiteRepository, idempotencyKey: "website.repository:site_1", organizationId: "org_1", websiteId: "site_1" });
    await runDueJobs(fake.asClient(), { worker: "t" });
    expect(fake.rows("provisioning_jobs")).toHaveLength(1);
    expect(fake.rows("creative_workspaces")).toHaveLength(0);

    vi.stubEnv("CREATIVE_WORKSPACE_PROJECT_KINDS", "all");
    const everyone = seed("express");
    await enqueueJob(everyone.asClient(), { kind: JOB_KINDS.websiteRepository, idempotencyKey: "website.repository:site_1", organizationId: "org_1", websiteId: "site_1" });
    await runDueJobs(everyone.asClient(), { worker: "t" });
    expect(everyone.rows("provisioning_jobs").map((j) => j.kind)).toEqual(["website.repository", "website.creative_workspace"]);
  });
});

describe("Deploy Preview and Deploy Live stay separate", () => {
  it("a deploy job (preview or production) never touches creative state or the model", async () => {
    for (const environment of ["preview", "production"] as const) {
      const fake = seed("professional");
      await enqueueJob(fake.asClient(), { kind: JOB_KINDS.websiteDeploy, idempotencyKey: `website.deploy:site_1:${environment}`, organizationId: "org_1", websiteId: "site_1", payload: { environment } });
      await enqueueJob(fake.asClient(), { kind: JOB_KINDS.websiteProvision, idempotencyKey: "website.provision:site_1", organizationId: "org_1", websiteId: "site_1" });
      const outcomes = await runDueJobs(fake.asClient(), { worker: "t" });
      expect(outcomes.map((o) => o.status)).toEqual(["succeeded", "succeeded"]);
      expect(deploy).toHaveBeenCalledWith(expect.anything(), "site_1", expect.objectContaining({ environment }));
      expect(fake.rows("creative_workspaces")).toHaveLength(0);
      expect(fake.rows("provisioning_jobs").some((j) => j.kind === "website.creative_workspace")).toBe(false);
      expect(generate).not.toHaveBeenCalled();
    }
  });

  it("the deployment service and the deploy handlers have no creative-workspace code path", () => {
    const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");
    expect(read("lib/vigil/services/deployment.ts")).not.toMatch(/creative|terra|astra/i);
    expect(read("lib/vigil/services/repository.ts")).not.toMatch(/creative|terra|astra/i);
    const jobs = read("lib/vigil/jobs.ts");
    const deployHandler = jobs.slice(jobs.indexOf("[JOB_KINDS.websiteDeploy]"), jobs.indexOf("[JOB_KINDS.websiteRepository]"));
    expect(deployHandler).not.toMatch(/creative/i);
    const syncHandler = jobs.slice(jobs.indexOf("[JOB_KINDS.deploymentSync]"), jobs.indexOf("[JOB_KINDS.deploymentNotify]"));
    expect(syncHandler).not.toMatch(/creative/i);
  });
});
