"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishReviewSubmission } from "@/lib/vigil/actions/reviews";

/** Staff-only version publisher for a Professional review round. */
export function AdminReviewPublishForm({ projectId, roundNumber, submitLabel }: { projectId: string; roundNumber: 1 | 2; submitLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setError(null);
        start(async () => {
          const result = await publishReviewSubmission(projectId, roundNumber, {
            previewUrl: String(data.get("preview_url") ?? ""),
            notes: String(data.get("notes") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Preview URL</span>
        <input name="preview_url" type="url" required placeholder="https://preview.example.com" className="rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm" disabled={pending} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Notes for the customer</span>
        <textarea name="notes" required rows={3} placeholder="What changed, what to focus on, and any decisions needed." className="rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm" disabled={pending} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary text-sm" disabled={pending}>{pending ? "Publishing…" : submitLabel}</button>
        {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
      </div>
    </form>
  );
}
