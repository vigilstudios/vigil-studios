import { describe, expect, it } from "vitest";
import { effectiveProjectStatus } from "../presenters";
import { advanceProjectStatus, advanceWebsiteProjectStatus, automaticProjectPath } from "../services/project-status";
import { FakeAdmin } from "./fake-admin";

describe("automatic project lifecycle", () => {
  it("walks forward through valid intermediate states", () => {
    expect(automaticProjectPath("draft", "launched")).toEqual(["intake", "in_progress", "review", "approved", "launched"]);
    expect(automaticProjectPath("review", "review")).toEqual([]);
    expect(automaticProjectPath("approved", "review")).toEqual([]);
    expect(automaticProjectPath("cancelled", "launched")).toEqual([]);
  });

  it("advances a stale linked project when the website launches", async () => {
    const db = new FakeAdmin({
      projects: [{ id: "project_1", status: "draft", launched_at: null }],
      websites: [{ id: "website_1", project_id: "project_1" }],
    });

    await advanceWebsiteProjectStatus(db.asClient(), "website_1", "launched", "2026-09-17T03:00:00.000Z");

    expect(db.rows("projects")[0]).toMatchObject({ status: "launched", launched_at: "2026-09-17T03:00:00.000Z" });
  });

  it("does not regress or reopen terminal projects", async () => {
    const db = new FakeAdmin({ projects: [{ id: "approved", status: "approved" }, { id: "closed", status: "closed" }] });
    expect(await advanceProjectStatus(db.asClient(), "approved", "review")).toBe(false);
    expect(await advanceProjectStatus(db.asClient(), "closed", "launched")).toBe(false);
    expect(db.rows("projects")).toEqual([{ id: "approved", status: "approved" }, { id: "closed", status: "closed" }]);
  });

  it("derives a truthful customer stage from completed milestones", () => {
    expect(effectiveProjectStatus("draft", { intakeCompleted: true })).toBe("in_progress");
    expect(effectiveProjectStatus("intake", { previewReady: true })).toBe("review");
    expect(effectiveProjectStatus("intake", { websiteLive: true })).toBe("launched");
    expect(effectiveProjectStatus("approved", { previewReady: true })).toBe("approved");
    expect(effectiveProjectStatus("cancelled", { websiteLive: true })).toBe("cancelled");
  });
});
