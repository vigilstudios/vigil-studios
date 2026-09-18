import "server-only";

import type { DbClient } from "@/lib/vigil/types";
import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";

export type ExpressPreviewReview = {
  roundId: string;
  projectId: string;
  status: "pending" | "awaiting_feedback" | "changes_requested" | "revision_in_progress" | "approved";
  currentSubmissionId: string | null;
  previewUrl: string | null;
  version: number | null;
  feedback: string | null;
  changesUsed: number;
  changesRemaining: number;
};

export type PublishedPreview = {
  published: boolean;
  projectId: string | null;
  kind: "express" | "professional" | "custom" | null;
  roundNumber: number | null;
  version: number | null;
};

type ReviewRoundRow = { id: string; round_number: number; status: string; current_submission_id: string | null };

/**
 * Which included round a fresh preview belongs to. Express has one round.
 * A Professional project moves to Full-site review once Design direction
 * is approved; after both are approved there is nothing left to review and
 * the next deployment is production.
 */
export function reviewRoundForPreview(kind: string, rounds: ReviewRoundRow[]): ReviewRoundRow | null {
  const byNumber = (n: number) => rounds.find((round) => round.round_number === n) ?? null;
  if (kind === "express") return byNumber(1);
  if (kind !== "professional") return null;
  const first = byNumber(1);
  if (first && first.status !== "approved") return first;
  const second = byNumber(2);
  return second && second.status !== "approved" ? second : null;
}

/**
 * Publish a completed preview into the customer's review: the Express
 * round, or whichever Professional round is open. A preview that is already
 * the version under review is left alone; anything else becomes the next
 * version and supersedes what the customer was looking at.
 */
export async function publishPreviewToReview(
  admin: DbClient,
  websiteId: string,
  previewUrl: string,
  publishedBy?: string | null,
): Promise<PublishedPreview> {
  const none: PublishedPreview = { published: false, projectId: null, kind: null, roundNumber: null, version: null };
  const { data: website, error: websiteError } = await admin
    .from("websites")
    .select("organization_id, project_id")
    .eq("id", websiteId)
    .maybeSingle();
  if (websiteError) throw websiteError;
  if (!website) throw new NotFoundError(`Website ${websiteId} not found.`);
  if (!website.project_id) return none;
  const { data: project, error: projectError } = await admin.from("projects").select("id, kind").eq("id", website.project_id).maybeSingle();
  if (projectError) throw projectError;
  if (!project) return none;

  const { data: rounds, error: roundError } = await admin
    .from("project_review_rounds")
    .select("id, round_number, status, current_submission_id")
    .eq("project_id", project.id)
    .order("round_number", { ascending: true });
  if (roundError) throw roundError;
  const round = reviewRoundForPreview(project.kind, rounds ?? []);
  if (!round) {
    if (project.kind === "express") throw new NotFoundError("The Express preview review round is missing.");
    return { ...none, projectId: project.id, kind: project.kind };
  }

  if (round.current_submission_id) {
    const { data: current, error: currentError } = await admin
      .from("project_review_submissions")
      .select("id, preview_url, version")
      .eq("id", round.current_submission_id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (current?.preview_url === previewUrl && round.status === "awaiting_feedback") {
      return { published: false, projectId: project.id, kind: project.kind, roundNumber: round.round_number, version: current.version };
    }
  }

  if (round.status !== "pending" && round.status !== "revision_in_progress") {
    const { error } = await admin.from("project_review_rounds").update({ status: "revision_in_progress" }).eq("id", round.id);
    if (error) throw error;
  }
  const { data: latest, error: latestError } = await admin
    .from("project_review_submissions")
    .select("version")
    .eq("round_id", round.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  const version = (latest?.version ?? 0) + 1;
  const { error: insertError } = await admin.from("project_review_submissions").insert({
    organization_id: website.organization_id,
    project_id: project.id,
    round_id: round.id,
    version,
    preview_url: previewUrl,
    notes: project.kind === "express" ? "Latest Express website preview" : "Latest website preview",
    published_by: publishedBy ?? null,
  });
  if (insertError) throw insertError;
  return { published: true, projectId: project.id, kind: project.kind, roundNumber: round.round_number, version };
}

export async function getExpressPreviewReview(admin: DbClient, websiteId: string): Promise<ExpressPreviewReview | null> {
  const { data: website, error: websiteError } = await admin
    .from("websites")
    .select("project_id, project:projects!websites_project_id_fkey(id, kind)")
    .eq("id", websiteId)
    .maybeSingle();
  if (websiteError) throw websiteError;
  const project = website?.project as { id: string; kind: string } | null;
  if (!project || project.kind !== "express") return null;
  const { data: round, error: roundError } = await admin
    .from("project_review_rounds")
    .select("id, status, current_submission_id")
    .eq("project_id", project.id)
    .eq("round_number", 1)
    .maybeSingle();
  if (roundError) throw roundError;
  if (!round) return null;
  const { data: submissions, error: submissionsError } = await admin
    .from("project_review_submissions")
    .select("id, version, preview_url")
    .eq("round_id", round.id)
    .order("version", { ascending: false });
  if (submissionsError) throw submissionsError;
  const current = (submissions ?? []).find((submission) => submission.id === round.current_submission_id) ?? null;
  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const { data: responses, error: responsesError } = submissionIds.length
    ? await admin.from("project_review_responses").select("submission_id, kind, feedback").in("submission_id", submissionIds)
    : { data: [], error: null };
  if (responsesError) throw responsesError;
  const changesUsed = (responses ?? []).filter((response) => response.kind === "changes_requested").length;
  const currentResponse = (responses ?? []).find((response) => response.submission_id === current?.id) ?? null;
  return {
    roundId: round.id,
    projectId: project.id,
    status: round.status,
    currentSubmissionId: round.current_submission_id,
    previewUrl: current?.preview_url ?? null,
    version: current?.version ?? null,
    feedback: currentResponse?.feedback ?? null,
    changesUsed,
    changesRemaining: Math.max(0, 1 - changesUsed),
  };
}

export async function assertExpressPreviewCanReceiveResponse(review: ExpressPreviewReview | null): Promise<ExpressPreviewReview> {
  if (!review?.currentSubmissionId || review.status !== "awaiting_feedback") {
    throw new ValidationError("This preview is no longer waiting for a response.");
  }
  return review;
}
