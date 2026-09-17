import "server-only";

import { createClient } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow, requireStaffOrThrow } from "@/lib/vigil/auth/session";
import type { Tables } from "@/lib/vigil/types";
import type { ReviewPhase, ReviewRoundNumber } from "@/lib/vigil/project-reviews";
import type { CustomerReview, ReviewAttachment as CustomerReviewAttachment, ReviewHistoryItem, ReviewRound as CustomerReviewRound, ReviewStatus, ReviewVersion } from "@/components/vigil/review-contract";

export type ReviewAttachment = Pick<Tables<"project_review_attachments">, "id" | "file_name" | "content_type" | "size_bytes" | "bucket_id" | "object_path" | "created_at">;
export type ReviewResponse = {
  id: string;
  kind: "changes_requested" | "approved";
  feedback: string | null;
  respondedAt: string;
  respondedBy: string | null;
  attachments: ReviewAttachment[];
};
export type ReviewSubmission = {
  id: string;
  version: number;
  previewUrl: string;
  notes: string | null;
  publishedAt: string;
  publishedBy: string | null;
  response: ReviewResponse | null;
};
export type ReviewRound = {
  id: string;
  number: ReviewRoundNumber;
  phase: ReviewPhase;
  status: "pending" | "awaiting_feedback" | "changes_requested" | "revision_in_progress" | "approved";
  currentSubmissionId: string | null;
  approvedSubmissionId: string | null;
  submissions: ReviewSubmission[];
};
export type ProjectReviews = {
  project: { id: string; organizationId: string; name: string; status: string };
  rounds: ReviewRound[];
};

export type StaffReviewQueueItem = {
  projectId: string;
  organizationId: string;
  projectName: string;
  organizationName: string;
  roundId: string;
  roundNumber: ReviewRoundNumber;
  phase: ReviewPhase;
  status: ReviewRound["status"];
  currentSubmissionId: string | null;
  currentVersion: number | null;
  previewUrl: string | null;
  publishedAt: string | null;
  respondedAt: string | null;
};

async function loadProjectReviews(projectId: string, organizationId?: string): Promise<ProjectReviews | null> {
  const supabase = await createClient();
  let projectQuery = supabase.from("projects").select("id, organization_id, name, status, kind").eq("id", projectId);
  if (organizationId) projectQuery = projectQuery.eq("organization_id", organizationId);
  const { data: project, error: projectError } = await projectQuery.maybeSingle();
  if (projectError) throw projectError;
  if (!project || project.kind !== "professional") return null;

  const { data: roundRows, error: roundError } = await supabase
    .from("project_review_rounds")
    .select("id, round_number, phase, status, current_submission_id, approved_submission_id")
    .eq("project_id", projectId)
    .order("round_number");
  if (roundError) throw roundError;
  const rounds = roundRows ?? [];
  const roundIds = rounds.map((round) => round.id);
  const { data: submissionRows, error: submissionsError } = roundIds.length
    ? await supabase
        .from("project_review_submissions")
        .select("id, round_id, version, preview_url, notes, published_at, published_by")
        .in("round_id", roundIds)
        .order("version")
    : { data: [], error: null };
  if (submissionsError) throw submissionsError;
  const submissions = submissionRows ?? [];
  const submissionIds = submissions.map((submission) => submission.id);
  const { data: responseRows, error: responsesError } = submissionIds.length
    ? await supabase
        .from("project_review_responses")
        .select("id, submission_id, kind, feedback, responded_at, responded_by")
        .in("submission_id", submissionIds)
    : { data: [], error: null };
  if (responsesError) throw responsesError;
  const responses = responseRows ?? [];
  const responseIds = responses.map((response) => response.id);
  const { data: attachmentRows, error: attachmentsError } = responseIds.length
    ? await supabase
        .from("project_review_attachments")
        .select("id, response_id, file_name, content_type, size_bytes, bucket_id, object_path, created_at")
        .in("response_id", responseIds)
        .order("created_at")
    : { data: [], error: null };
  if (attachmentsError) throw attachmentsError;

  const attachmentsByResponse = new Map<string, ReviewAttachment[]>();
  for (const attachment of attachmentRows ?? []) {
    const items = attachmentsByResponse.get(attachment.response_id) ?? [];
    items.push({
      id: attachment.id,
      file_name: attachment.file_name,
      content_type: attachment.content_type,
      size_bytes: attachment.size_bytes,
      bucket_id: attachment.bucket_id,
      object_path: attachment.object_path,
      created_at: attachment.created_at,
    });
    attachmentsByResponse.set(attachment.response_id, items);
  }
  const responseBySubmission = new Map<string, ReviewResponse>();
  for (const response of responses) {
    responseBySubmission.set(response.submission_id, {
      id: response.id,
      kind: response.kind,
      feedback: response.feedback,
      respondedAt: response.responded_at,
      respondedBy: response.responded_by,
      attachments: attachmentsByResponse.get(response.id) ?? [],
    });
  }
  const submissionsByRound = new Map<string, ReviewSubmission[]>();
  for (const submission of submissions) {
    const items = submissionsByRound.get(submission.round_id) ?? [];
    items.push({
      id: submission.id,
      version: submission.version,
      previewUrl: submission.preview_url,
      notes: submission.notes,
      publishedAt: submission.published_at,
      publishedBy: submission.published_by,
      response: responseBySubmission.get(submission.id) ?? null,
    });
    submissionsByRound.set(submission.round_id, items);
  }
  return {
    project: { id: project.id, organizationId: project.organization_id, name: project.name, status: project.status },
    rounds: rounds.map((round) => ({
      id: round.id,
      number: round.round_number as ReviewRoundNumber,
      phase: round.phase as ReviewPhase,
      status: round.status,
      currentSubmissionId: round.current_submission_id,
      approvedSubmissionId: round.approved_submission_id,
      submissions: submissionsByRound.get(round.id) ?? [],
    })),
  };
}

/** Customer-safe detail loader; RLS and organization predicate both scope it. */
export async function getCustomerProjectReviews(projectId: string): Promise<ProjectReviews | null> {
  const ctx = await requireOrgContextOrThrow();
  return loadProjectReviews(projectId, ctx.organization.id);
}

const roundSummary: Record<ReviewPhase, string> = {
  design_direction: "The visual direction, type, colour and page hierarchy for your site.",
  full_site: "The complete responsive website, ready for your final round of changes.",
};

function customerStatus(status: ReviewRound["status"]): ReviewStatus {
  if (status === "pending") return "not_started";
  if (status === "awaiting_feedback") return "awaiting_customer";
  return status;
}

/**
 * Customer UI adapter. It deliberately keeps storage paths private and mints
 * short-lived signed URLs only after the RLS-scoped loader has read the rows.
 */
export async function getCustomerReview(projectId: string): Promise<CustomerReview | null> {
  const data = await getCustomerProjectReviews(projectId);
  if (!data) return null;
  const supabase = await createClient();
  const responseAttachments = data.rounds.flatMap((round) => round.submissions.flatMap((submission) => submission.response?.attachments ?? []));
  const signed = await Promise.all(
    responseAttachments.map(async (attachment) => {
      const { data: signedData, error } = await supabase.storage.from(attachment.bucket_id).createSignedUrl(attachment.object_path, 60 * 60);
      if (error) console.error("review attachment signing failed:", error.message);
      return [attachment.id, signedData?.signedUrl ?? null] as const;
    })
  );
  const signedUrls = new Map(signed);
  const history: ReviewHistoryItem[] = [];
  const customerRounds: CustomerReviewRound[] = data.rounds.map((round) => {
    const versions: ReviewVersion[] = round.submissions.map((submission) => {
      history.push({
        id: `submission:${submission.id}`,
        label: `${round.number === 1 ? "Round 1" : "Round 2"} version ${submission.version} published`,
        detail: submission.notes,
        createdAt: submission.publishedAt,
        tone: "info",
      });
      if (submission.response) {
        history.push({
          id: `response:${submission.response.id}`,
          label: submission.response.kind === "approved" ? "Version approved" : "Changes requested",
          detail: submission.response.feedback,
          createdAt: submission.response.respondedAt,
          tone: submission.response.kind === "approved" ? "good" : "warn",
        });
      }
      return {
        id: submission.id,
        versionNumber: submission.version,
        label: `Version ${submission.version}`,
        previewUrl: submission.previewUrl,
        createdAt: submission.publishedAt,
        note: submission.notes,
      };
    });
    const current = round.currentSubmissionId ? round.submissions.find((submission) => submission.id === round.currentSubmissionId) ?? null : null;
    return {
      key: round.phase,
      title: round.phase === "design_direction" ? "Design direction" : "Full-site review",
      summary: roundSummary[round.phase],
      status: customerStatus(round.status),
      currentVersion: current
        ? { id: current.id, versionNumber: current.version, label: `Version ${current.version}`, previewUrl: current.previewUrl, createdAt: current.publishedAt, note: current.notes }
        : null,
      versions,
      feedback: current?.response?.feedback ?? null,
      submittedAt: current?.publishedAt ?? null,
      decidedAt: current?.response?.respondedAt ?? null,
    };
  });
  const activeRound = data.rounds.find((round) => round.status !== "approved") ?? null;
  const displayRound = activeRound ?? [...data.rounds].reverse().find((round) => round.currentSubmissionId) ?? null;
  const currentSubmission = displayRound?.currentSubmissionId
    ? displayRound.submissions.find((submission) => submission.id === displayRound.currentSubmissionId) ?? null
    : null;
  const { data: website, error: websiteError } = await supabase.from("websites").select("id").eq("project_id", projectId).maybeSingle();
  if (websiteError) throw websiteError;
  const attachments: CustomerReviewAttachment[] = responseAttachments.map((attachment) => ({
    id: attachment.id,
    fileName: attachment.file_name,
    contentType: attachment.content_type,
    sizeBytes: attachment.size_bytes,
    url: signedUrls.get(attachment.id) ?? null,
  }));
  return {
    id: data.project.id,
    projectId: data.project.id,
    websiteId: website?.id ?? null,
    projectName: data.project.name,
    status: activeRound ? customerStatus(activeRound.status) : "complete",
    currentRound: activeRound?.phase ?? null,
    currentVersion: currentSubmission
      ? { id: currentSubmission.id, versionNumber: currentSubmission.version, label: `Version ${currentSubmission.version}`, previewUrl: currentSubmission.previewUrl, createdAt: currentSubmission.publishedAt, note: currentSubmission.notes }
      : null,
    previewUrl: currentSubmission?.previewUrl ?? null,
    rounds: customerRounds,
    history: history.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    attachments,
  };
}

/** Staff detail loader, including complete response/attachment history. */
export async function getStaffProjectReviews(projectId: string): Promise<ProjectReviews | null> {
  await requireStaffOrThrow();
  return loadProjectReviews(projectId);
}

export async function requireStaffProjectReviews(projectId: string): Promise<ProjectReviews> {
  const data = await getStaffProjectReviews(projectId);
  if (!data) throw new NotFoundError("Professional project review not found.");
  return data;
}

/** Compact operational list for the staff review queue. Pending rounds are not actionable yet. */
export async function listStaffReviewQueue(): Promise<StaffReviewQueueItem[]> {
  await requireStaffOrThrow();
  const supabase = await createClient();
  const { data: rounds, error: roundsError } = await supabase
    .from("project_review_rounds")
    .select("id, organization_id, project_id, round_number, phase, status, current_submission_id")
    .neq("status", "pending")
    .neq("status", "approved")
    .order("updated_at", { ascending: false });
  if (roundsError) throw roundsError;
  if (!rounds?.length) return [];
  const projectIds = [...new Set(rounds.map((round) => round.project_id))];
  const organizationIds = [...new Set(rounds.map((round) => round.organization_id))];
  const [projectsResult, organizationsResult, submissionsResult, responsesResult] = await Promise.all([
    supabase.from("projects").select("id, name, kind").in("id", projectIds),
    supabase.from("organizations").select("id, name").in("id", organizationIds),
    supabase.from("project_review_submissions").select("id, version, preview_url, published_at").in("id", rounds.map((round) => round.current_submission_id).filter(Boolean) as string[]),
    supabase.from("project_review_responses").select("submission_id, responded_at").in("round_id", rounds.map((round) => round.id)),
  ]);
  for (const result of [projectsResult, organizationsResult, submissionsResult, responsesResult]) if (result.error) throw result.error;
  const projects = new Map((projectsResult.data ?? []).map((project) => [project.id, project]));
  const organizations = new Map((organizationsResult.data ?? []).map((organization) => [organization.id, organization]));
  const submissions = new Map((submissionsResult.data ?? []).map((submission) => [submission.id, submission]));
  const responseBySubmission = new Map((responsesResult.data ?? []).map((response) => [response.submission_id, response]));
  return rounds.filter((round) => projects.get(round.project_id)?.kind === "professional").map((round) => {
    const submission = round.current_submission_id ? submissions.get(round.current_submission_id) : null;
    return {
      projectId: round.project_id,
      organizationId: round.organization_id,
      projectName: projects.get(round.project_id)?.name ?? "Untitled project",
      organizationName: organizations.get(round.organization_id)?.name ?? "Unknown organization",
      roundId: round.id,
      roundNumber: round.round_number as ReviewRoundNumber,
      phase: round.phase as ReviewPhase,
      status: round.status,
      currentSubmissionId: round.current_submission_id,
      currentVersion: submission?.version ?? null,
      previewUrl: submission?.preview_url ?? null,
      publishedAt: submission?.published_at ?? null,
      respondedAt: submission ? responseBySubmission.get(submission.id)?.responded_at ?? null : null,
    };
  });
}
