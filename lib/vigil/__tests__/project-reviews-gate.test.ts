import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../auth/errors";
import { assertProductionDeployAllowed, getReviewDeployReadiness } from "../project-reviews";
import type { DbClient } from "../types";

type GateFixture = { project: { id: string; kind: string } | null; rounds?: { round_number: number; status: string; current_submission_id: string | null; approved_submission_id: string | null }[] };

/** Minimal query mock for the two reads made by the production review gate. */
function reviewGateClient(fixture: GateFixture): DbClient {
  return {
    from(table: string) {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        async maybeSingle() {
          return { data: { project_id: fixture.project?.id ?? null, project: fixture.project }, error: null };
        },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve(resolve({ data: fixture.rounds ?? [], error: null }));
        },
      };
      if (table !== "websites" && table !== "project_review_rounds") throw new Error(`Unexpected gate table: ${table}`);
      return builder;
    },
  } as unknown as DbClient;
}

describe("Professional production deployment gate", () => {
  it("does not gate Express or Custom projects", async () => {
    await expect(getReviewDeployReadiness(reviewGateClient({ project: { id: "express-project", kind: "express" } }), "site_1"))
      .resolves.toMatchObject({ allowed: true, missingRounds: [] });
    await expect(getReviewDeployReadiness(reviewGateClient({ project: { id: "custom-project", kind: "custom" } }), "site_2"))
      .resolves.toMatchObject({ allowed: true, missingRounds: [] });
  });

  it("requires explicit approval of the current submission in both included rounds", async () => {
    const client = reviewGateClient({
      project: { id: "professional-project", kind: "professional" },
      rounds: [
        { round_number: 1, status: "approved", current_submission_id: "r1-v2", approved_submission_id: "r1-v2" },
        { round_number: 2, status: "approved", current_submission_id: "r2-v1", approved_submission_id: "r2-v1" },
      ],
    });
    await expect(getReviewDeployReadiness(client, "site_3")).resolves.toMatchObject({ allowed: true, missingRounds: [] });
  });

  it("refuses a Professional launch when approval is missing or belongs to an earlier version", async () => {
    const client = reviewGateClient({
      project: { id: "professional-project", kind: "professional" },
      rounds: [
        { round_number: 1, status: "approved", current_submission_id: "r1-v2", approved_submission_id: "r1-v1" },
        { round_number: 2, status: "awaiting_feedback", current_submission_id: "r2-v1", approved_submission_id: null },
      ],
    });
    await expect(getReviewDeployReadiness(client, "site_4")).resolves.toMatchObject({ allowed: false, missingRounds: [1, 2] });
    await expect(assertProductionDeployAllowed(client, "site_4")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
