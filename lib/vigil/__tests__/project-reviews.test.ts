import { describe, expect, it } from "vitest";
import {
  MAX_REVIEW_ATTACHMENTS,
  PROFESSIONAL_REVIEW_ROUNDS,
  REVIEW_ATTACHMENTS_BUCKET,
  reviewAttachmentPath,
  reviewRoundDefinition,
  validateReviewAttachments,
} from "../project-reviews";

describe("Professional review domain", () => {
  it("defines exactly the two included, ordered rounds", () => {
    expect(PROFESSIONAL_REVIEW_ROUNDS).toEqual([
      { number: 1, phase: "design_direction", label: "Design direction" },
      { number: 2, phase: "full_site", label: "Full-site review" },
    ]);
    expect(reviewRoundDefinition(3)).toBeNull();
  });

  it("uses an organization-prefixed private attachment path", () => {
    expect(REVIEW_ATTACHMENTS_BUCKET).toBe("review-attachments");
    expect(reviewAttachmentPath("org-1", "response-1", "application/pdf", "random")).toBe("org-1/response-1/random.pdf");
  });

  it("rejects invalid, empty, oversized, and excessive attachments", () => {
    const problems = validateReviewAttachments([
      { name: "malware.exe", type: "application/octet-stream", size: 10 },
      { name: "empty.png", type: "image/png", size: 0 },
      { name: "large.pdf", type: "application/pdf", size: 11 * 1024 * 1024 },
    ]);
    expect(problems.map((problem) => problem.name)).toEqual(["malware.exe", "empty.png", "large.pdf"]);
    expect(validateReviewAttachments(Array.from({ length: MAX_REVIEW_ATTACHMENTS + 1 }, (_, i) => ({ name: `${i}.png`, type: "image/png", size: 1 })))[0]?.name).toBe("*");
  });
});
