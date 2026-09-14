"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlanFeature } from "@/lib/vigil/actions/admin";

export function PlanFeatureCell({ planId, featureCode, value }: { planId: string; featureCode: string; value: unknown }) {
  const router = useRouter();
  const initial = value === undefined ? "" : JSON.stringify(value);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = text !== initial;

  return (
    <div className="flex items-center gap-1">
      <input
        aria-label={`${featureCode} for plan`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="default"
        className="w-24 rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 font-mono text-xs"
        disabled={pending}
      />
      {dirty ? (
        <button
          type="button"
          className="text-xs underline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await setPlanFeature(planId, featureCode, text);
              if (!res.ok) setError(res.error);
              else router.refresh();
            })
          }
        >
          {pending ? "…" : "Save"}
        </button>
      ) : null}
      {error ? <span className="text-xs text-[#ef4444]" title={error}>!</span> : null}
    </div>
  );
}
