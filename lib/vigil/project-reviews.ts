import "server-only";

import type { DbClient } from "@/lib/vigil/types";
import { ForbiddenError } from "@/lib/vigil/auth/errors";

/** The two review phases included with every Professional project. */
export const PROFESSIONAL_REVIEW_ROUNDS = [
  { number: 1 as const, phase: "design_direction" as const, label: "Design direction" },
  { number: 2 as const, phase: "full_site" as const, label: "Full-site review" },
] as const;

export const REVIEW_ATTACHMENTS_BUCKET = "review-attachments";
export const MAX_REVIEW_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_REVIEW_ATTACHMENTS = 5;
export const REVIEW_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};
export const REVIEW_ACCEPT_ATTRIBUTE = Object.keys(REVIEW_ATTACHMENT_TYPES).join(",");

export type ReviewRoundNumber = (typeof PROFESSIONAL_REVIEW_ROUNDS)[number]["number"];
export type ReviewPhase = (typeof PROFESSIONAL_REVIEW_ROUNDS)[number]["phase"];
export type ReviewAttachmentProblem = { name: string; reason: string };

export function reviewRoundDefinition(round: number): (typeof PROFESSIONAL_REVIEW_ROUNDS)[number] | null {
  return PROFESSIONAL_REVIEW_ROUNDS.find((item) => item.number === round) ?? null;
}

export function validateReviewAttachments(files: { name: string; type: string; size: number }[]): ReviewAttachmentProblem[] {
  const problems: ReviewAttachmentProblem[] = [];
  if (files.length > MAX_REVIEW_ATTACHMENTS) {
    problems.push({ name: "*", reason: `Attach up to ${MAX_REVIEW_ATTACHMENTS} files to consolidated feedback.` });
  }
  for (const file of files) {
    if (!REVIEW_ATTACHMENT_TYPES[file.type]) problems.push({ name: file.name, reason: "Images (PNG, JPEG, WebP, GIF) or PDF only." });
    else if (file.size <= 0) problems.push({ name: file.name, reason: "Empty file." });
    else if (file.size > MAX_REVIEW_ATTACHMENT_BYTES) problems.push({ name: file.name, reason: "Larger than 10 MB." });
  }
  return problems;
}

/** Storage path: <organization>/<response>/<random>.<ext>; RLS reads prefix one. */
export function reviewAttachmentPath(organizationId: string, responseId: string, contentType: string, random: string): string {
  return `${organizationId}/${responseId}/${random}.${REVIEW_ATTACHMENT_TYPES[contentType] ?? "bin"}`;
}

export type ReviewDeployReadiness = {
  allowed: boolean;
  reason: string | null;
  projectId: string | null;
  missingRounds: ReviewRoundNumber[];
};

/**
 * Production deploys must not bypass customer approval. Professional requires
 * both included rounds; Express requires its one full-site preview approval.
 */
export async function getReviewDeployReadiness(admin: DbClient, websiteId: string): Promise<ReviewDeployReadiness> {
  const { data: website, error: websiteError } = await admin
    .from("websites")
    .select("project_id, project:projects!websites_project_id_fkey(id, kind)")
    .eq("id", websiteId)
    .maybeSingle();
  if (websiteError) throw websiteError;
  const project = website?.project as { id: string; kind: string } | null;
  if (!project || !["professional", "express"].includes(project.kind)) return { allowed: true, reason: null, projectId: project?.id ?? null, missingRounds: [] };

  const { data: rounds, error } = await admin
    .from("project_review_rounds")
    .select("round_number, status, current_submission_id, approved_submission_id")
    .eq("project_id", project.id);
  if (error) throw error;
  const approved = new Set(
    (rounds ?? [])
      .filter((round) => round.status === "approved" && round.current_submission_id && round.current_submission_id === round.approved_submission_id)
      .map((round) => round.round_number)
  );
  const requiredRounds = project.kind === "express" ? [1 as const] : PROFESSIONAL_REVIEW_ROUNDS.map((round) => round.number);
  const missingRounds = requiredRounds.filter((number) => !approved.has(number));
  return {
    allowed: missingRounds.length === 0,
    reason: missingRounds.length
      ? project.kind === "express"
        ? "The customer must approve the latest Express preview before it can be deployed live."
        : `Professional project requires approval for review round${missingRounds.length === 1 ? "" : "s"} ${missingRounds.join(" and ")}.`
      : null,
    projectId: project.id,
    missingRounds,
  };
}

export async function assertProductionDeployAllowed(admin: DbClient, websiteId: string): Promise<void> {
  const readiness = await getReviewDeployReadiness(admin, websiteId);
  if (!readiness.allowed) throw new ForbiddenError(readiness.reason ?? "Professional review approvals are required before deployment.");
}
