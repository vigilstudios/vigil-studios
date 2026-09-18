import { describe, expect, it } from "vitest";
import { publishPreviewToReview, reviewRoundForPreview } from "../express-preview-review";
import { FakeAdmin } from "./fake-admin";

const round = (n: number, status: string, current: string | null = null) => ({ id: `r${n}`, round_number: n, status, current_submission_id: current });

describe("reviewRoundForPreview", () => {
  it("sends an Express preview to its single round", () => {
    expect(reviewRoundForPreview("express", [round(1, "awaiting_feedback")])?.round_number).toBe(1);
  });
  it("keeps a Professional preview in Design direction until it is approved", () => {
    expect(reviewRoundForPreview("professional", [round(1, "pending"), round(2, "pending")])?.round_number).toBe(1);
    expect(reviewRoundForPreview("professional", [round(1, "changes_requested"), round(2, "pending")])?.round_number).toBe(1);
  });
  it("moves to Full-site review once Design direction is approved", () => {
    expect(reviewRoundForPreview("professional", [round(1, "approved"), round(2, "pending")])?.round_number).toBe(2);
    expect(reviewRoundForPreview("professional", [round(1, "approved"), round(2, "changes_requested")])?.round_number).toBe(2);
  });
  it("has nothing to review after both rounds are approved, or for a custom build", () => {
    expect(reviewRoundForPreview("professional", [round(1, "approved"), round(2, "approved")])).toBeNull();
    expect(reviewRoundForPreview("custom", [])).toBeNull();
  });
});

function professional(rounds: ReturnType<typeof round>[], submissions: { id: string; round_id: string; version: number; preview_url: string }[] = []) {
  return new FakeAdmin({
    websites: [{ id: "site_1", organization_id: "org_1", project_id: "proj_1" }],
    projects: [{ id: "proj_1", organization_id: "org_1", kind: "professional", status: "in_progress" }],
    project_review_rounds: rounds.map((r) => ({ ...r, project_id: "proj_1", organization_id: "org_1" })),
    project_review_submissions: submissions.map((s) => ({ ...s, project_id: "proj_1", organization_id: "org_1" })),
  });
}

describe("publishPreviewToReview", () => {
  it("publishes a Professional preview as the next version of the open round", async () => {
    const fake = professional([round(1, "approved", "s1"), round(2, "pending")], [{ id: "s1", round_id: "r1", version: 1, preview_url: "https://one.test" }]);
    const result = await publishPreviewToReview(fake.asClient(), "site_1", "https://two.test", "staff_1");
    expect(result).toMatchObject({ published: true, kind: "professional", roundNumber: 2, version: 1 });
    const inserted = fake.rows("project_review_submissions").find((s) => s.round_id === "r2");
    expect(inserted).toMatchObject({ preview_url: "https://two.test", version: 1, published_by: "staff_1", notes: "Latest website preview" });
  });

  it("supersedes the version the customer is looking at with a fresh preview", async () => {
    const fake = professional([round(1, "awaiting_feedback", "s1"), round(2, "pending")], [{ id: "s1", round_id: "r1", version: 1, preview_url: "https://one.test" }]);
    const result = await publishPreviewToReview(fake.asClient(), "site_1", "https://one-b.test");
    expect(result).toMatchObject({ published: true, roundNumber: 1, version: 2 });
    expect(fake.rows("project_review_rounds").find((r) => r.id === "r1")?.status).toBe("revision_in_progress");
  });

  it("leaves the round alone when the same preview is already under review", async () => {
    const fake = professional([round(1, "awaiting_feedback", "s1"), round(2, "pending")], [{ id: "s1", round_id: "r1", version: 1, preview_url: "https://one.test" }]);
    const result = await publishPreviewToReview(fake.asClient(), "site_1", "https://one.test");
    expect(result).toMatchObject({ published: false, roundNumber: 1, version: 1 });
    expect(fake.rows("project_review_submissions")).toHaveLength(1);
  });

  it("does nothing once both Professional rounds are approved", async () => {
    const fake = professional([round(1, "approved", "s1"), round(2, "approved", "s2")], [
      { id: "s1", round_id: "r1", version: 1, preview_url: "https://one.test" },
      { id: "s2", round_id: "r2", version: 1, preview_url: "https://two.test" },
    ]);
    const result = await publishPreviewToReview(fake.asClient(), "site_1", "https://three.test");
    expect(result.published).toBe(false);
    expect(fake.rows("project_review_submissions")).toHaveLength(2);
  });
});
