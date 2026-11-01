import { describe, expect, it } from "vitest";
import { previewProgress, previewProject, type PreviewProgressInput } from "@/lib/vigil/overview/preview-model";
import type { Project } from "@/lib/vigil/types";

const base: PreviewProgressInput = {
  project: { kind: "express", status: "in_progress", intake_completed_at: "2026-10-27T10:00:00Z" },
  hasPreview: false, reviews: [], domainReady: false, planActive: false,
  domainHref: "/dashboard/domain?website=site-a",
};
const result = (overrides: Partial<PreviewProgressInput> = {}) => previewProgress({ ...base, ...overrides });

describe("pre-launch overview progress", () => {
  it.each(["express", "professional", "custom"] as const)("directs an unfinished %s brief to onboarding", kind => {
    const state = result({ project: { kind, status: "intake", intake_completed_at: null } });
    expect(state.next.href).toBe("/dashboard/onboarding");
    expect(state.next.label).toBe("Continue setup");
    expect(state.checks.find(check => check.id === "brief")?.done).toBe(false);
    expect(state.stage).toBe("intake");
  });
  it("keeps an Express example separate from an actual customer preview", () => {
    const state = result();
    expect(state.stage).toBe("in_progress");
    expect(state.checks.find(check => check.id === "preview")?.done).toBe(false);
    expect(state.next.owner).toBe("With Vigil");
  });
  it("shows a build preview without inventing a published review", () => {
    const state = result({ hasPreview: true });
    expect(state.stage).toBe("review");
    expect(state.next.label).toBe("Open website preview");
    expect(state.checks.find(check => check.id === "approval")?.done).toBe(false);
  });
  it("does not claim a preview is available from the project status alone", () => {
    const state = result({ project: { ...base.project!, status: "review" } });
    expect(state.next.title).toBe("Your website is taking shape");
    expect(state.checks.find(check => check.id === "preview")?.done).toBe(false);
  });
  it("routes a published Express review to Website Preview", () => {
    const state = result({ hasPreview: true, reviews: [{ status: "awaiting_feedback", currentSubmissionId: "version-a" }] });
    expect(state.next.label).toBe("Review your website");
    expect(state.next.href).toBe("/dashboard/website");
  });
  it("routes a published Professional review to Design Review", () => {
    const state = result({ project: { ...base.project!, kind: "professional" }, hasPreview: true, reviews: [{ status: "awaiting_feedback", currentSubmissionId: "version-a" }, { status: "pending", currentSubmissionId: null }] });
    expect(state.next.href).toBe("/dashboard/review");
  });
  it("does not ask for feedback when the submission is missing", () => {
    expect(result({ reviews: [{ status: "awaiting_feedback", currentSubmissionId: null }] }).next.label).not.toBe("Review your website");
  });
  it.each(["changes_requested", "revision_in_progress"] as const)("reflects %s without asking the client to submit again", status => {
    const state = result({ reviews: [{ status, currentSubmissionId: "version-a" }] });
    expect(state.next.title).toBe("We’re refining your website");
    expect(state.next.owner).toBe("With Vigil");
  });
  it("does not mark Professional approved after its first round", () => {
    const state = result({ project: { ...base.project!, kind: "professional" }, hasPreview: true, reviews: [{ status: "approved", currentSubmissionId: "version-a" }, { status: "pending", currentSubmissionId: null }] });
    expect(state.approved).toBe(false);
    expect(state.next.title).toBe("Your full website is coming together");
  });
  it("requires both Professional rounds, even when only one row is returned", () => {
    const state = result({ project: { ...base.project!, kind: "professional" }, reviews: [{ status: "approved", currentSubmissionId: "version-a" }] });
    expect(state.approved).toBe(false);
  });
  it("uses actual approval events to recover an earlier project stage", () => {
    const state = result({ hasPreview: true, reviews: [{ status: "approved", currentSubmissionId: "version-a" }] });
    expect(state.stage).toBe("approved");
    expect(state.next.href).toBe(base.domainHref);
    expect(state.checks.find(check => check.id === "approval")?.done).toBe(true);
  });
  it("keeps Growth approval on the scoped project workflow", () => {
    const state = result({ project: { ...base.project!, kind: "custom", status: "approved" }, domainReady: true, planActive: true });
    expect(state.next.href).toBe("/dashboard/website");
    expect(state.next.title).toBe("Getting ready to go live");
  });
  it("requires the domain and active plan before saying launch essentials are ready", () => {
    const approved = { ...base.project!, status: "approved" as const };
    expect(result({ project: approved }).next.href).toBe(base.domainHref);
    expect(result({ project: approved, domainReady: true }).next.href).toBe("/dashboard/billing");
    const ready = result({ project: approved, hasPreview: true, domainReady: true, planActive: true });
    expect(ready.checks.every(check => check.done)).toBe(true);
    expect(ready.next.owner).toBe("With Vigil");
  });
  it.each(["cancelled", "closed"] as const)("does not resurrect a %s project from an old preview or approval", status => {
    const state = result({ project: { ...base.project!, status }, hasPreview: true, reviews: [{ status: "approved", currentSubmissionId: "version-a" }] });
    expect(state.stage).toBe(status);
    expect(state.next.owner).toBe("Project history");
    expect(state.next.label).toBe("View your brief");
  });
  it("does not send a website without a project into an unrelated brief", () => {
    expect(result({ project: null }).next.href).toBe("/dashboard/website");
  });
});

describe("website and project association", () => {
  const projects = [{ id: "newer", status: "intake" }, { id: "paired", status: "review" }] as Project[];
  it("uses the selected website's project rather than the newest unrelated build", () => {
    expect(previewProject(projects, { project_id: "paired" })?.id).toBe("paired");
  });
  it("does not substitute an unrelated project when the linked project is unavailable", () => {
    expect(previewProject(projects, { project_id: "missing" })).toBeNull();
  });
  it("still supports organizations awaiting their first website row", () => {
    expect(previewProject(projects, null)?.id).toBe("newer");
  });
});
