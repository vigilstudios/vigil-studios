"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { approveExpressPreview, requestExpressPreviewChanges } from "@/lib/vigil/actions/express-preview";
import type { ExpressPreviewReview } from "@/lib/vigil/express-preview-review";

export function ExpressPreviewDecision({ websiteId, review }: { websiteId: string; review: ExpressPreviewReview }) {
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => ReturnType<typeof approveExpressPreview>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  if (review.status === "approved") {
    return (
      <section className="rounded-xl border border-[color:var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent)_7%,var(--bg-surface))] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--accent)]" />
          <div>
            <p className="font-semibold">Preview approved</p>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">The team can now deploy this version live.</p>
          </div>
        </div>
      </section>
    );
  }

  if (review.status === "changes_requested" || review.status === "revision_in_progress") {
    return (
      <section className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-4">
        <p className="font-semibold">Your changes are with the team</p>
        <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
          Your included Express revision has been submitted. A new preview will appear here when it is ready.
        </p>
      </section>
    );
  }

  if (review.status !== "awaiting_feedback") return null;
  return (
    <section className="rounded-xl border border-[color:var(--accent)]/45 bg-[color-mix(in_srgb,var(--accent)_6%,var(--bg-surface))] p-4">
      <div className="flex items-start gap-3">
        <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Your preview is ready for a decision</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
            Review the desktop and mobile preview above. Approve it to unlock launch, or send one consolidated request for changes. Express includes one revision round.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => run(() => approveExpressPreview(websiteId))} className="btn-primary min-h-10 text-sm">
              Approve preview
            </button>
            {review.changesRemaining > 0 ? (
              <button type="button" disabled={pending} onClick={() => setShowFeedback((value) => !value)} className="btn-secondary min-h-10 text-sm">
                Request changes
              </button>
            ) : null}
          </div>
          {showFeedback ? (
            <div className="mt-3">
              <label htmlFor={`express-feedback-${websiteId}`} className="text-xs font-medium">Your consolidated changes</label>
              <textarea
                id={`express-feedback-${websiteId}`}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={5}
                maxLength={10_000}
                className="mt-1 block w-full resize-y rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3 text-sm outline-none focus:border-[color:var(--accent)]"
                placeholder="List every change you would like included in this revision."
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" disabled={pending || !feedback.trim()} onClick={() => run(() => requestExpressPreviewChanges(websiteId, feedback))} className="btn-primary min-h-10 text-sm">
                  Send changes
                </button>
                <button type="button" disabled={pending} onClick={() => setShowFeedback(false)} className="btn-secondary min-h-10 text-sm">Cancel</button>
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-2 text-xs text-[#ef4444]">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
