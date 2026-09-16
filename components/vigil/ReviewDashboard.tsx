"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, FileText, Image as ImageIcon, Paperclip, RotateCcw, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { formatBytes, validateAttachments, ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_REQUEST } from "@/lib/vigil/attachments";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { FormError, FormSuccess, inputClass, labelClass, StatusPill, type Tone } from "@/components/vigil/ui";
import { Panel, StatusLine, Timeline } from "@/components/vigil/widgets";
import {
  EMPTY_REVIEW_ROUNDS,
  REVIEW_ROUNDS,
  type CustomerReview,
  type ReviewActionResult,
  type ReviewActions,
  type ReviewDecision,
  type ReviewRound,
  type ReviewRoundKey,
  type ReviewStatus,
  type ReviewUploadedFile,
} from "./review-contract";

const REVIEW_ATTACHMENTS_BUCKET = "review-attachments";

type ReviewDashboardProps = {
  review: CustomerReview | null;
  organizationId: string;
  actions?: ReviewActions;
};

const statusTone: Record<ReviewStatus, Tone> = {
  pending: "neutral",
  awaiting_feedback: "warn",
  revision_in_progress: "info",
  not_started: "neutral",
  in_progress: "info",
  awaiting_customer: "warn",
  changes_requested: "info",
  approved: "good",
  complete: "good",
};

const statusLabel: Record<ReviewStatus, string> = {
  pending: "Not started",
  awaiting_feedback: "Ready for your review",
  revision_in_progress: "In production",
  not_started: "Not started",
  in_progress: "In production",
  awaiting_customer: "Ready for your review",
  changes_requested: "Changes requested",
  approved: "Approved",
  complete: "Complete",
};

function reviewStatus(status: ReviewStatus | undefined) {
  return {
    tone: statusTone[status ?? "not_started"],
    label: statusLabel[status ?? "not_started"],
  };
}

function roundFor(review: CustomerReview | null, key: ReviewRoundKey): ReviewRound {
  return review?.rounds.find((round) => round.key === key) ?? EMPTY_REVIEW_ROUNDS.find((round) => round.key === key)!;
}

function safePreviewUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function attachmentPath(organizationId: string, reviewId: string, file: File): string {
  const ext = ALLOWED_ATTACHMENT_TYPES[file.type] ?? "bin";
  return `${organizationId}/${reviewId}/${crypto.randomUUID()}.${ext}`;
}

function statusHint(status: ReviewStatus): string {
  switch (status) {
    case "awaiting_customer":
    case "awaiting_feedback":
      return "Take a look at the current version, then approve it or send one consolidated list of changes.";
    case "changes_requested":
      return "Your notes are with the team. We will update this round and post a new version here.";
    case "approved":
    case "complete":
      return "This round is approved. Your team can continue with the next step.";
    case "in_progress":
    case "revision_in_progress":
      return "The Vigil team is shaping this round now.";
    default:
      return "We will let you know when this round is ready.";
  }
}

export function ReviewDashboard({ review, organizationId, actions }: ReviewDashboardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [feedback, setFeedback] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const formRef = useRef<HTMLFormElement | null>(null);
  const activeRound = review?.currentRound ?? (review?.status === "awaiting_customer" || review?.status === "awaiting_feedback" ? "design_direction" : null);
  const currentRound = activeRound ? roundFor(review, activeRound) : null;
  const latestVersion = review?.rounds.flatMap((round) => round.versions).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
  const reviewComplete = Boolean(review && review.rounds.length === 2 && review.rounds.every((round) => round.status === "approved" || round.status === "complete"));
  const currentVersion = review?.currentVersion ?? currentRound?.currentVersion ?? (reviewComplete ? latestVersion : null);
  const previewUrl = safePreviewUrl(review?.previewUrl ?? currentVersion?.previewUrl);
  const attachmentProblems = validateAttachments(files);
  const busy = pending || progress.total > 0;

  const chooseDecision = (next: ReviewDecision) => {
    setDecision(next);
    setError(null);
    setSuccess(null);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!review || !activeRound || !decision) {
      setError("This review is not ready for a decision yet.");
      return;
    }
    if (decision === "request_revisions" && feedback.trim().length < 3) {
      setError("Add one consolidated list of changes so the team knows what to refine.");
      return;
    }
    if (!actions?.submitDecision) {
      setError("Review actions are being connected. Please try again shortly.");
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result: ReviewActionResult = await actions.submitDecision!({
        reviewId: review.id,
        round: activeRound,
        decision,
        feedback: feedback.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      let attached = 0;
      const failed: string[] = [];
      if (decision === "request_revisions" && files.length > 0) {
        // The response row is the attachment's owner. Upload only after the
        // decision action returns its id so storage paths match the RLS and
        // row-level checks: <organization>/<response>/<uuid>.<ext>.
        const responseId = result.data?.id;
        if (!responseId) {
          failed.push(...files.map((file) => file.name));
        } else {
          const supabase = createClient();
          const uploaded: ReviewUploadedFile[] = [];
          setProgress({ done: 0, total: files.length });
          for (const file of files) {
            const path = attachmentPath(organizationId, responseId, file);
            const { error: uploadError } = await supabase.storage.from(REVIEW_ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
            if (uploadError) failed.push(file.name);
            else uploaded.push({ path, name: file.name, type: file.type, size: file.size });
            setProgress((current) => ({ ...current, done: current.done + 1 }));
          }
          if (uploaded.length > 0 && actions.attachFiles) {
            const attachedResult = await actions.attachFiles(responseId, uploaded);
            if (attachedResult.ok) {
              attached = attachedResult.data?.attached ?? uploaded.length;
              failed.push(...(attachedResult.data?.failed ?? []));
            } else {
              failed.push(...uploaded.map((file) => file.name));
            }
          }
        }
      }

      setProgress({ done: 0, total: 0 });
      setDecision(null);
      setFeedback("");
      setFiles([]);
      formRef.current?.reset();
      setSuccess(
        decision === "approve"
          ? "Round approved. Vigil will move your project forward."
          : failed.length > 0
            ? `Changes sent. ${attached} attachment${attached === 1 ? "" : "s"} added; these did not upload: ${failed.join(", ")}.`
            : attached > 0
              ? `Changes sent with ${attached} attachment${attached === 1 ? "" : "s"}.`
              : "Changes sent. Vigil will review your consolidated notes."
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Professional website</p>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Design review</h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[color:var(--text-secondary)]">
            {review ? `Review ${review.projectName} in two focused rounds. Your notes stay together so the team can act on the full picture.` : "Your Professional website includes two focused review rounds."}
          </p>
        </div>
        {review ? <StatusPill tone={reviewStatus(review.status).tone}>{reviewStatus(review.status).label}</StatusPill> : null}
      </header>

      <RoundProgress review={review} />

      {review && currentRound && (currentRound.status === "awaiting_customer" || currentRound.status === "awaiting_feedback") ? (
        <section className="rounded-xl border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_8%,var(--bg-surface))] p-4 sm:p-5" aria-labelledby="review-ready-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--bg-primary)]"><CheckCircle2 className="h-4 w-4" aria-hidden /></span>
              <div>
                <h2 id="review-ready-heading" className="text-sm font-semibold">Your review is ready</h2>
                <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{statusHint(currentRound.status)}</p>
              </div>
            </div>
            {currentVersion ? <p className="shrink-0 text-xs font-medium text-[color:var(--text-secondary)]">Version {currentVersion.versionNumber}</p> : null}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <PreviewPanel review={review} previewUrl={previewUrl} currentRound={currentRound} currentVersion={currentVersion} />
        <RoundSummary review={review} currentRound={currentRound} complete={reviewComplete} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <DecisionPanel
          formRef={formRef}
          review={review}
          currentRound={currentRound}
          decision={decision}
          feedback={feedback}
          files={files}
          attachmentProblems={attachmentProblems}
          busy={busy}
          progress={progress}
          error={error}
          success={success}
          onSubmit={submit}
          onDecision={chooseDecision}
          onFeedback={setFeedback}
          onFiles={(next) => setFiles((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS_PER_REQUEST + 1))}
          onRemoveFile={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
        />
        <HistoryPanel review={review} />
      </div>
    </div>
  );
}

function RoundProgress({ review }: { review: CustomerReview | null }) {
  return (
    <Panel title="Your two review rounds">
      <ol className="grid gap-3 sm:grid-cols-2" aria-label="Review rounds">
        {REVIEW_ROUNDS.map((definition, index) => {
          const round = roundFor(review, definition.key);
          const state = review?.currentRound === definition.key ? "current" : round.status === "approved" || round.status === "complete" ? "done" : "todo";
          return (
            <li key={definition.key} className={`relative rounded-lg border p-3 ${state === "current" ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]" : "border-[color:var(--border)]"}`}>
              {index === 0 ? <span className="sr-only">Round 1 of 2. </span> : null}
              <div className="flex items-start gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${state === "done" ? "bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : state === "current" ? "border border-[color:var(--accent)] text-[color:var(--accent)]" : "border border-[color:var(--border)] text-[color:var(--text-secondary)]"}`}>
                  {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[13px] font-semibold">{definition.shortTitle}: {definition.title}</h2>
                    <StatusPill tone={reviewStatus(round.status).tone}>{reviewStatus(round.status).label}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{round.summary}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function PreviewPanel({ review, previewUrl, currentRound, currentVersion }: { review: CustomerReview | null; previewUrl: string | null; currentRound: ReviewRound | null; currentVersion: CustomerReview["currentVersion"] }) {
  return (
    <Panel title="Current preview" action={currentRound ? <StatusPill tone={reviewStatus(currentRound.status).tone}>{currentRound.title}</StatusPill> : undefined}>
      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-white">
          <iframe src={previewUrl} title={`${review?.projectName ?? "Website"} preview`} className="h-[min(62vh,42rem)] min-h-[24rem] w-full" />
        </div>
      ) : (
        <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-[color:var(--border)] px-6 text-center">
          <div>
            <UploadCloud className="mx-auto h-6 w-6 text-[color:var(--text-secondary)]" aria-hidden />
            <p className="mt-2 text-sm font-medium">Your preview will appear here</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-[color:var(--text-secondary)]">When Vigil posts a version for review, you will be able to view it here and compare the version history.</p>
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--text-secondary)]">
        <span>{currentVersion ? `${currentVersion.label} · posted ${formatRelative(currentVersion.createdAt)}` : "No version posted yet"}</span>
        {currentVersion?.note ? <span className="max-w-full truncate sm:max-w-[50%]" title={currentVersion.note}>{currentVersion.note}</span> : null}
      </div>
    </Panel>
  );
}

function RoundSummary({ review, currentRound, complete }: { review: CustomerReview | null; currentRound: ReviewRound | null; complete: boolean }) {
  return (
    <Panel title="Round details">
      {currentRound ? (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold">{currentRound.title}</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{currentRound.summary}</p>
          </div>
          <StatusLine tone={reviewStatus(currentRound.status).tone} label={reviewStatus(currentRound.status).label} hint={statusHint(currentRound.status)} />
          <dl className="divide-y divide-[color:var(--border)] border-y border-[color:var(--border)] text-xs">
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-[color:var(--text-secondary)]">Current version</dt><dd className="font-medium">{currentRound.currentVersion ? `Version ${currentRound.currentVersion.versionNumber}` : "Not posted"}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-[color:var(--text-secondary)]">Versions in this round</dt><dd className="font-medium">{currentRound.versions.length || "—"}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-[color:var(--text-secondary)]">Review allowance</dt><dd className="font-medium">Two rounds included</dd></div>
          </dl>
          {currentRound.versions.length > 1 ? (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-[color:var(--accent)]">View version history</summary>
              <ul className="mt-2 space-y-2 text-xs">
                {currentRound.versions.map((version) => <li key={version.id} className="flex items-center justify-between gap-3"><span>{version.label}</span><span className="text-[color:var(--text-secondary)]">{formatDate(version.createdAt)}</span></li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ) : complete ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Both rounds approved</p>
          <StatusLine tone="good" label="Review complete" hint="Your Professional build has clear approval for both the design direction and full site." />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Your review is being prepared</p>
          <p className="text-xs leading-5 text-[color:var(--text-secondary)]">The two rounds are included with your Professional build. We will post the first design direction here when it is ready.</p>
          {review ? <StatusLine tone={reviewStatus(review.status).tone} label={reviewStatus(review.status).label} hint={statusHint(review.status)} /> : null}
        </div>
      )}
    </Panel>
  );
}

function DecisionPanel({ formRef, review, currentRound, decision, feedback, files, attachmentProblems, busy, progress, error, success, onSubmit, onDecision, onFeedback, onFiles, onRemoveFile }: {
  formRef: React.RefObject<HTMLFormElement | null>;
  review: CustomerReview | null;
  currentRound: ReviewRound | null;
  decision: ReviewDecision | null;
  feedback: string;
  files: File[];
  attachmentProblems: { name: string; reason: string }[];
  busy: boolean;
  progress: { done: number; total: number };
  error: string | null;
  success: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDecision: (decision: ReviewDecision) => void;
  onFeedback: (feedback: string) => void;
  onFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}) {
  const canDecide = Boolean(review && (currentRound?.status === "awaiting_customer" || currentRound?.status === "awaiting_feedback"));
  return (
    <Panel title="Your decision">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <p className="text-sm font-semibold">Does this direction feel right?</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">Choose one clear outcome. If you request changes, keep every note in one list so nothing gets lost between messages.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={!canDecide || busy} onClick={() => onDecision("approve")} className={`flex min-h-16 items-start gap-2 rounded-lg border p-3 text-left transition-colors ${decision === "approve" ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-[color:var(--border)] hover:border-[color:var(--accent)]"}`}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden />
            <span><span className="block text-[13px] font-semibold">Approve</span><span className="mt-0.5 block text-[11px] text-[color:var(--text-secondary)]">This round is ready to move forward.</span></span>
          </button>
          <button type="button" disabled={!canDecide || busy} onClick={() => onDecision("request_revisions")} className={`flex min-h-16 items-start gap-2 rounded-lg border p-3 text-left transition-colors ${decision === "request_revisions" ? "border-[color:var(--status-info)] bg-[color-mix(in_srgb,var(--status-info)_10%,transparent)]" : "border-[color:var(--border)] hover:border-[color:var(--status-info)]"}`}>
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--status-info)]" aria-hidden />
            <span><span className="block text-[13px] font-semibold">Request revisions</span><span className="mt-0.5 block text-[11px] text-[color:var(--text-secondary)]">Send one consolidated list of changes.</span></span>
          </button>
        </div>
        {decision === "request_revisions" ? (
          <div>
            <label htmlFor="review-feedback" className={labelClass}>Your consolidated list of changes</label>
            <textarea id="review-feedback" value={feedback} onChange={(event) => onFeedback(event.target.value)} disabled={busy || !canDecide} rows={7} className={inputClass} placeholder={"1.\n2.\n3."} maxLength={10000} />
            <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">Include page, section or device context where useful. One list per round helps us make the next version cohesive.</p>
          </div>
        ) : null}
        {decision === "request_revisions" ? <ReviewAttachments files={files} problems={attachmentProblems} busy={busy} onFiles={onFiles} onRemove={onRemoveFile} /> : null}
        {!canDecide && !success ? <p className="rounded-lg bg-[color:var(--bg-surface-soft)] px-3 py-2.5 text-xs text-[color:var(--text-secondary)]">The decision buttons will become available when this round is ready for your review.</p> : null}
        <FormError message={error} />
        <FormSuccess message={success} />
        {decision ? <button type="submit" disabled={!canDecide || busy || attachmentProblems.length > 0} className="btn-primary w-full text-sm">{progress.total > 0 ? `Uploading ${progress.done + 1} of ${progress.total}…` : decision === "approve" ? "Approve this round" : "Send revision list"}</button> : null}
      </form>
    </Panel>
  );
}

function ReviewAttachments({ files, problems, busy, onFiles, onRemove }: { files: File[]; problems: { name: string; reason: string }[]; busy: boolean; onFiles: (files: File[]) => void; onRemove: (index: number) => void }) {
  return (
    <div>
      <span className={labelClass}>Optional references</span>
      <label htmlFor="review-attachments" className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[color:var(--border)] px-3 py-2.5 text-xs text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--text-primary)]">
        <Paperclip className="h-4 w-4" aria-hidden />
        <span>Add images or PDFs <span className="opacity-70">· up to {MAX_ATTACHMENTS_PER_REQUEST}, 10 MB each</span></span>
      </label>
      <input id="review-attachments" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="sr-only" disabled={busy} onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      {files.length > 0 ? <ul className="mt-2 divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)]">{files.map((file, index) => {
        const issue = problems.find((problem) => problem.name === file.name);
        return <li key={`${file.name}-${index}`} className="flex items-center gap-3 px-3 py-1.5 text-xs">
          {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 shrink-0 text-[color:var(--text-secondary)]" aria-hidden /> : <FileText className="h-4 w-4 shrink-0 text-[color:var(--text-secondary)]" aria-hidden />}
          <span className="min-w-0 flex-1 truncate">{file.name}</span><span className="shrink-0 text-[color:var(--text-secondary)]">{formatBytes(file.size)}</span>
          {issue ? <span className="shrink-0 text-[#ef4444]">{issue.reason}</span> : null}
          <button type="button" aria-label={`Remove ${file.name}`} disabled={busy} onClick={() => onRemove(index)} className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"><X className="h-3.5 w-3.5" aria-hidden /></button>
        </li>;
      })}</ul> : null}
      {problems.find((problem) => problem.name === "*") ? <p className="mt-1 text-xs text-[#ef4444]">{problems.find((problem) => problem.name === "*")!.reason}</p> : null}
      <p className="mt-1 text-[10px] text-[color:var(--text-secondary)]">Images and PDFs upload directly to Vigil after you send your notes. Maximum file size is {formatBytes(MAX_ATTACHMENT_BYTES)}.</p>
    </div>
  );
}

function HistoryPanel({ review }: { review: CustomerReview | null }) {
  const items = review?.history ?? [];
  return (
    <Panel title="Review history">
      {items.length ? <Timeline empty="" items={items.map((item) => ({ key: item.id, title: item.label, meta: item.detail ?? undefined, when: formatRelative(item.createdAt), tone: item.tone ?? "neutral" }))} /> : <div className="space-y-2"><p className="text-sm font-medium">Nothing here yet</p><p className="text-xs leading-5 text-[color:var(--text-secondary)]">Versions, approvals and revision notes will appear here as your review progresses.</p></div>}
    </Panel>
  );
}
