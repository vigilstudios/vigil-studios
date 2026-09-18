import { describe, expect, it } from "vitest";
import { customerDomainNeedsAttention, projectAwaitingKickoff } from "../attention";

describe("customer attention rules", () => {
  const domain = { status: "pending", website_id: "website-1" };

  it("does not ask for DNS work before the linked website can be previewed", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-1", preview_url: null, live_url: null }])).toBe(false);
  });

  it("asks for DNS work once the linked website preview is ready", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-1", preview_url: "https://preview.example", live_url: null }])).toBe(true);
  });

  it("does not use another website's preview to unlock the domain task", () => {
    expect(customerDomainNeedsAttention([domain], [{ id: "website-2", preview_url: "https://preview.example", live_url: null }])).toBe(false);
  });

  it("keeps domain problems visible for a live linked website", () => {
    expect(customerDomainNeedsAttention([{ ...domain, status: "error" }], [{ id: "website-1", preview_url: null, live_url: "https://example.com" }])).toBe(true);
  });

  it("does not flag a connected domain", () => {
    expect(customerDomainNeedsAttention([{ ...domain, status: "connected" }], [{ id: "website-1", preview_url: "https://preview.example", live_url: null }])).toBe(false);
  });
});

describe("finished-onboarding hand-off", () => {
  const fresh = { project_id: "p1", status: "provisioning", preview_url: null, live_url: null, last_deployed_at: null };

  it("is raised while nothing has been published or built", () => {
    expect(projectAwaitingKickoff("p1", [{ project_id: "p1", status: "pending" }, { project_id: "p1", status: "pending" }], [fresh])).toBe(true);
    expect(projectAwaitingKickoff("p1", [], [])).toBe(true);
  });

  it("is not re-raised when a customer answers the first design round", () => {
    // Round 1 approved: the project is in_progress again, but the team has been at work since the version was published.
    expect(projectAwaitingKickoff("p1", [{ project_id: "p1", status: "approved" }, { project_id: "p1", status: "pending" }], [fresh])).toBe(false);
    expect(projectAwaitingKickoff("p1", [{ project_id: "p1", status: "changes_requested" }, { project_id: "p1", status: "pending" }], [fresh])).toBe(false);
    expect(projectAwaitingKickoff("p1", [{ project_id: "p1", status: "revision_in_progress" }], [fresh])).toBe(false);
  });

  it("is not raised once the website has a preview, a deployment, or has left provisioning", () => {
    expect(projectAwaitingKickoff("p1", [], [{ ...fresh, preview_url: "https://preview.example" }])).toBe(false);
    expect(projectAwaitingKickoff("p1", [], [{ ...fresh, last_deployed_at: "2026-09-18T00:00:00Z" }])).toBe(false);
    expect(projectAwaitingKickoff("p1", [], [{ ...fresh, status: "building" }])).toBe(false);
  });

  it("only looks at the project's own rounds and website", () => {
    expect(projectAwaitingKickoff("p1", [{ project_id: "p2", status: "approved" }], [{ ...fresh, project_id: "p2", preview_url: "https://preview.example" }])).toBe(true);
  });
});
