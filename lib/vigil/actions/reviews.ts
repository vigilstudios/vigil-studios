"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/vigil/audit";
import { ForbiddenError, NotFoundError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { requireOrgContextOrThrow, requireStaffOrThrow } from "@/lib/vigil/auth/session";
import { reviewRoundDefinition, REVIEW_ATTACHMENTS_BUCKET, validateReviewAttachments, type ReviewRoundNumber } from "@/lib/vigil/project-reviews";

type ReviewDecision = "approve" | "request_revisions";
export type ReviewUploadedFile = { path: string; name: string; type: string; size: number };
export type PublishReviewInput = { previewUrl: string; notes?: string | null };

const publishSchema = z.object({ previewUrl: z.string().trim().url("Enter a valid preview URL.").max(2000), notes: z.string().trim().max(5000).optional().nullable() });
const feedbackSchema = z.string().trim().min(1, "Please include your consolidated changes.").max(10_000);

function asRoundNumber(value: number): ReviewRoundNumber {
  if (!reviewRoundDefinition(value)) throw new ValidationError("Choose review round 1 or 2.");
  return value as ReviewRoundNumber;
}

function reviewHref(projectId: string): string {
  return `/dashboard/review?project=${encodeURIComponent(projectId)}`;
}

async function getStaffRound(projectId: string, roundNumber: ReviewRoundNumber) {
  const supabase = await createClient();
  const { data: round, error } = await supabase
    .from("project_review_rounds")
    .select("id, organization_id, project_id, round_number, phase, status")
    .eq("project_id", projectId)
    .eq("round_number", roundNumber)
    .maybeSingle();
  if (error) throw error;
  if (!round) throw new NotFoundError("Professional project review round not found.");
  return { supabase, round };
}

async function notifyOrganizationMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  projectId: string,
  title: string,
  body: string
): Promise<void> {
  const { data: members, error } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  // Publication is already committed by the time notifications are sent.
  // A notification outage must not make the UI report the publication as a
  // failure and tempt staff to submit a duplicate version.
  if (error) {
    console.error("review customer lookup failed:", error.message);
    return;
  }
  if (!members?.length) return;
  const { error: notificationError } = await supabase.from("notifications").insert(
    members.map((member) => ({
      user_id: member.user_id,
      organization_id: organizationId,
      kind: "project_review.submission",
      title,
      body,
      href: reviewHref(projectId),
    }))
  );
  if (notificationError) console.error("review customer notification failed:", notificationError.message);
}

/** Staff publishes a fresh immutable preview version for one included round. */
export async function publishReviewSubmission(projectId: string, roundNumber: number, input: PublishReviewInput): Promise<ActionResult<{ id: string; version: number }>> {
  try {
    const staff = await requireStaffOrThrow();
    const round = asRoundNumber(roundNumber);
    const parsed = publishSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError("Check the preview details.", { previewUrl: parsed.error.issues.map((issue) => issue.message) });
    const { supabase, round: reviewRound } = await getStaffRound(projectId, round);
    const { data: previous, error: previousError } = await supabase
      .from("project_review_submissions")
      .select("version")
      .eq("round_id", reviewRound.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previousError) throw previousError;
    const { data: submission, error } = await supabase
      .from("project_review_submissions")
      .insert({
        organization_id: reviewRound.organization_id,
        project_id: projectId,
        round_id: reviewRound.id,
        version: (previous?.version ?? 0) + 1,
        preview_url: parsed.data.previewUrl,
        notes: parsed.data.notes || null,
        published_by: staff.user.id,
      })
      .select("id, version")
      .single();
    if (error) throw error;
    const definition = reviewRoundDefinition(round)!;
    await notifyOrganizationMembers(
      supabase,
      reviewRound.organization_id,
      projectId,
      `${definition.label} is ready for review`,
      `Version ${submission.version} is ready for your consolidated feedback or approval.`
    );
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: submission };
  } catch (error) {
    return toActionError(error);
  }
}

/** Staff explicitly starts revision work before a replacement version can be submitted. */
export async function markReviewRevisionInProgress(projectId: string, roundNumber: number): Promise<ActionResult> {
  try {
    await requireStaffOrThrow();
    const round = asRoundNumber(roundNumber);
    const { supabase, round: reviewRound } = await getStaffRound(projectId, round);
    if (reviewRound.status !== "changes_requested") throw new ValidationError("Revision work can start only after consolidated changes are requested.");
    const { error } = await supabase.from("project_review_rounds").update({ status: "revision_in_progress" }).eq("id", reviewRound.id);
    if (error) throw error;
    await logAuditEvent(supabase, {
      action: "review_round.revision_started",
      entityType: "project_review_round",
      entityId: reviewRound.id,
      organizationId: reviewRound.organization_id,
      before: { status: "changes_requested" },
      after: { status: "revision_in_progress", round },
    });
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

async function recordCustomerDecision(projectId: string, roundNumber: number, decision: ReviewDecision, feedback?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const round = asRoundNumber(roundNumber);
    const supabase = await createClient();
    const { data: reviewRound, error: roundError } = await supabase
      .from("project_review_rounds")
      .select("id, organization_id, project_id, current_submission_id, status")
      .eq("project_id", projectId)
      .eq("organization_id", ctx.organization.id)
      .eq("round_number", round)
      .maybeSingle();
    if (roundError) throw roundError;
    if (!reviewRound) throw new NotFoundError("Review round not found.");
    if (!reviewRound.current_submission_id || reviewRound.status !== "awaiting_feedback") {
      throw new ValidationError("This review version is no longer awaiting a response.");
    }
    const normalizedFeedback = feedback?.trim() || null;
    if (decision === "request_revisions") {
      const parsedFeedback = feedbackSchema.safeParse(normalizedFeedback);
      if (!parsedFeedback.success) throw new ValidationError(parsedFeedback.error.issues[0]?.message ?? "Please include your consolidated changes.");
    }
    const kind = decision === "approve" ? "approved" : "changes_requested";
    const { data: response, error } = await supabase
      .from("project_review_responses")
      .insert({
        organization_id: ctx.organization.id,
        project_id: projectId,
        round_id: reviewRound.id,
        submission_id: reviewRound.current_submission_id,
        kind,
        feedback: normalizedFeedback,
        responded_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    const definition = reviewRoundDefinition(round)!;
    const { error: notificationError } = await supabase.rpc("notify_review_staff", {
      p_round: reviewRound.id,
      p_title: `${definition.label}: ${decision === "approve" ? "approved" : "changes requested"}`,
      p_body: decision === "approve" ? "The customer approved the current version." : "The customer submitted consolidated changes.",
      p_href: `/admin/reviews/${encodeURIComponent(projectId)}`,
    });
    if (notificationError) console.error("review staff notification failed:", notificationError.message);
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: response };
  } catch (error) {
    return toActionError(error);
  }
}

/** Customer records the one explicit approval for the current version. */
export async function approveReviewSubmission(projectId: string, roundNumber: number): Promise<ActionResult<{ id: string }>> {
  return recordCustomerDecision(projectId, roundNumber, "approve");
}

/** Customer records one consolidated changes-requested response for the current version. */
export async function submitReviewFeedback(projectId: string, roundNumber: number, feedback: string): Promise<ActionResult<{ id: string }>> {
  return recordCustomerDecision(projectId, roundNumber, "request_revisions", feedback);
}

/** UI contract adapter: reviewId is the Professional project id and round is its stable phase key. */
export async function submitReviewDecision(input: {
  reviewId: string;
  round: "design_direction" | "full_site";
  decision: ReviewDecision;
  feedback?: string;
}): Promise<ActionResult<{ id: string }>> {
  const round = input.round === "design_direction" ? 1 : 2;
  return recordCustomerDecision(input.reviewId, round, input.decision, input.feedback);
}

/** Record browser-direct uploaded files after a changes-requested response exists. */
export async function attachReviewFeedbackFiles(responseId: string, uploaded: ReviewUploadedFile[]): Promise<ActionResult<{ attached: number; failed: string[] }>> {
  try {
    const ctx = await requireOrgContextOrThrow();
    const problems = validateReviewAttachments(uploaded);
    if (problems.length) throw new ValidationError(problems.map((problem) => (problem.name === "*" ? problem.reason : `${problem.name}: ${problem.reason}`)).join(" "));
    const supabase = await createClient();
    const { data: response, error: responseError } = await supabase
      .from("project_review_responses")
      .select("id, organization_id, project_id, kind, responded_by")
      .eq("id", responseId)
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();
    if (responseError) throw responseError;
    if (!response) throw new NotFoundError("Review response not found.");
    if (response.kind !== "changes_requested") throw new ForbiddenError("Attachments can only be added to a changes-requested response.");
    const failed: string[] = [];
    let attached = 0;
    for (const file of uploaded) {
      if (!file.path.startsWith(`${ctx.organization.id}/${responseId}/`)) {
        failed.push(file.name);
        continue;
      }
      const { error } = await supabase.from("project_review_attachments").insert({
        organization_id: ctx.organization.id,
        response_id: responseId,
        bucket_id: REVIEW_ATTACHMENTS_BUCKET,
        object_path: file.path,
        file_name: file.name.slice(0, 200),
        content_type: file.type,
        size_bytes: file.size,
        uploaded_by: ctx.user.id,
      });
      if (error) {
        console.error("review attachment row failed:", error.message);
        await supabase.storage.from(REVIEW_ATTACHMENTS_BUCKET).remove([file.path]);
        failed.push(file.name);
      } else {
        attached += 1;
      }
    }
    revalidatePath("/dashboard");
    return { ok: true, data: { attached, failed } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Alias kept deliberately small for the customer component's expected seam. */
export const attachReviewFiles = attachReviewFeedbackFiles;
