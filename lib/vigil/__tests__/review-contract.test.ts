import { describe, expect, it } from "vitest";
import { EMPTY_REVIEW_ROUNDS, REVIEW_ROUNDS } from "@/components/vigil/review-contract";

describe("customer review contract", () => {
  it("keeps the Professional experience to two named rounds", () => {
    expect(REVIEW_ROUNDS).toEqual([
      { key: "design_direction", title: "Design direction", shortTitle: "Round 1" },
      { key: "full_site", title: "Full-site review", shortTitle: "Round 2" },
    ]);
    expect(EMPTY_REVIEW_ROUNDS.map((round) => round.key)).toEqual(["design_direction", "full_site"]);
  });

  it("starts both rounds without implying a customer action", () => {
    expect(EMPTY_REVIEW_ROUNDS.every((round) => round.status === "not_started")).toBe(true);
    expect(EMPTY_REVIEW_ROUNDS.every((round) => round.currentVersion === null && round.versions.length === 0)).toBe(true);
  });
});
