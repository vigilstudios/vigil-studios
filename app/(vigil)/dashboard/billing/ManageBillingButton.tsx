"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { openBillingPortal } from "@/lib/vigil/actions/billing";

export function ManageBillingButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await openBillingPortal();
            if (res && !res.ok) setError(res.error);
          })
        }
        className="btn-secondary min-h-11 !px-4 !py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Opening…" : "Manage billing"} {!pending ? <ExternalLink className="ml-1.5 h-3.5 w-3.5" /> : null}
      </button>
      {error ? <p role="alert" className="mt-2 text-xs text-[color:var(--status-bad)]">{error}</p> : null}
    </div>
  );
}
