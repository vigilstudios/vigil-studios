"use client";

import { useActionState } from "react";
import { createChangeRequest, type RequestState } from "@/lib/vigil/actions/requests";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function NewRequestForm({ websites }: { websites: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(createChangeRequest, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};

  return (
    <form action={action} className="mt-4 space-y-4" noValidate>
      <div>
        <label htmlFor="title" className={labelClass}>
          What should change?
        </label>
        <input id="title" name="title" className={inputClass} placeholder="Update our opening hours" maxLength={200} required disabled={pending} />
        {issues.title ? <p className="mt-1 text-xs text-[#ef4444]">{issues.title[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Details
        </label>
        <textarea id="description" name="description" rows={4} className={inputClass} placeholder="New hours are Mon–Fri 8–6, Sat 9–2. Closed Sunday." disabled={pending} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {websites.length > 1 ? (
          <div>
            <label htmlFor="website_id" className={labelClass}>
              Website
            </label>
            <select id="website_id" name="website_id" className={inputClass} disabled={pending}>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        ) : websites[0] ? (
          <input type="hidden" name="website_id" value={websites[0].id} />
        ) : null}
        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select id="priority" name="priority" className={inputClass} defaultValue="normal" disabled={pending}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <FormError message={state && !state.ok ? state.error : null} />
      <FormSuccess message={state?.ok ? "Request submitted. Vigil will follow up by email." : null} />
      <button type="submit" className="btn-primary text-sm" disabled={pending}>
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
