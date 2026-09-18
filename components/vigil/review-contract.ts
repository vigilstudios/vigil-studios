/**
 * Customer review view-model.
 *
 * The review query should shape its result into this contract before it
 * crosses into the dashboard components. Keeping database rows out of the
 * UI means the review experience can evolve without leaking storage details
 * into the customer-facing page.
 */
export type ReviewRoundKey = "design_direction" | "full_site";

export type ReviewStatus =
  /** Raw statuses returned by the review tables. */
  | "pending"
  | "awaiting_feedback"
  | "revision_in_progress"
  /** Display-normalized aliases are also accepted for a query adapter. */
  | "not_started"
  | "in_progress"
  | "awaiting_customer"
  | "changes_requested"
  | "approved"
  | "complete";

export type ReviewAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url?: string | null;
};

export type ReviewVersion = {
  id: string;
  versionNumber: number;
  label: string;
  previewUrl: string | null;
  createdAt: string;
  note?: string | null;
};

export type ReviewRound = {
  key: ReviewRoundKey;
  title: string;
  summary: string;
  status: ReviewStatus;
  currentVersion: ReviewVersion | null;
  versions: ReviewVersion[];
  feedback?: string | null;
  submittedAt?: string | null;
  decidedAt?: string | null;
};

export type ReviewHistoryItem = {
  id: string;
  label: string;
  detail?: string | null;
  createdAt: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
};

export type CustomerReview = {
  id: string;
  projectId: string;
  websiteId: string | null;
  projectName: string;
  status: ReviewStatus;
  currentRound: ReviewRoundKey | null;
  currentVersion: ReviewVersion | null;
  previewUrl: string | null;
  rounds: ReviewRound[];
  history: ReviewHistoryItem[];
  attachments?: ReviewAttachment[];
};

export type ReviewDecision = "approve" | "request_revisions";

export type ReviewDecisionInput = {
  reviewId: string;
  round: ReviewRoundKey;
  decision: ReviewDecision;
  feedback?: string;
};

export type ReviewUploadedFile = {
  path: string;
  name: string;
  type: string;
  size: number;
};

/**
 * Expected server-action seam for lib/vigil/actions/reviews.ts.
 *
 * Suggested exports are `submitReviewDecision` and `attachReviewFiles` with
 * these argument/result shapes. The UI intentionally accepts the functions
 * as props so a backend implementation can be added without changing the
 * review interaction or importing server-only code into a client component.
 */
export type ReviewActionResult = { ok: true; data?: { id?: string; attached?: number; failed?: string[] } } | { ok: false; error: string; code?: string };

export type ReviewActions = {
  submitDecision?: (input: ReviewDecisionInput) => Promise<ReviewActionResult>;
  /** responseId is the id returned by submitDecision, not the review/project id. */
  attachFiles?: (responseId: string, uploaded: ReviewUploadedFile[]) => Promise<ReviewActionResult>;
};

export const REVIEW_ROUNDS: { key: ReviewRoundKey; title: string; shortTitle: string }[] = [
  { key: "design_direction", title: "Design direction", shortTitle: "Round 1" },
  { key: "full_site", title: "Full-site review", shortTitle: "Round 2" },
];

export const EMPTY_REVIEW_ROUNDS: ReviewRound[] = [
  {
    key: "design_direction",
    title: "Design direction",
    summary: "The visual direction, type, colour and page hierarchy for your site.",
    status: "not_started",
    currentVersion: null,
    versions: [],
  },
  {
    key: "full_site",
    title: "Full-site review",
    summary: "The complete responsive website, ready for your final round of changes.",
    status: "not_started",
    currentVersion: null,
    versions: [],
  },
];
