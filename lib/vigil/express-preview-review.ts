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

/** Publish a completed Express preview into its one-round customer review. */
export async function publishExpressPreview(
  admin: DbClient,
  websiteId: string,
  previewUrl: string,
  publishedBy?: string | null,
): Promise<void> {
  const { data: website, error: websiteError } = await admin
    .from("websites")
    .select("organization_id, project_id, project:projects!websites_project_id_fkey(id, kind)")
    .eq("id", websiteId)
    .maybeSingle();
  if (websiteError) throw websiteError;
  if (!website) throw new NotFoundError(`Website ${websiteId} not found.`);
  const project = website.project as { id: string; kind: string } | null;
  if (!project || project.kind !== "express") return;

  const { data: round, error: roundError } = await admin
    .from("project_review_rounds")
    .select("id, status, current_submission_id")
    .eq("project_id", project.id)
    .eq("round_number", 1)
    .maybeSingle();
  if (roundError) throw roundError;
  if (!round) throw new NotFoundError("The Express preview review round is missing.");

  if (round.current_submission_id) {
    const { data: current, error: currentError } = await admin
      .from("project_review_submissions")
      .select("id, preview_url")
      .eq("id", round.current_submission_id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (current?.preview_url === previewUrl && round.status === "awaiting_feedback") return;
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
  const { error: insertError } = await admin.from("project_review_submissions").insert({
    organization_id: website.organization_id,
    project_id: project.id,
    round_id: round.id,
    version: (latest?.version ?? 0) + 1,
    preview_url: previewUrl,
    notes: "Latest Express website preview",
    published_by: publishedBy ?? null,
  });
  if (insertError) throw insertError;
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
