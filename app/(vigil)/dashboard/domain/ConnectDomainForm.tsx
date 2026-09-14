"use client";

import { useActionState } from "react";
import { startDomainConnection, type DomainState } from "@/lib/vigil/actions/domain";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function ConnectDomainForm({ websites }: { websites: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<DomainState, FormData>(startDomainConnection, null);

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end" noValidate>
      <div>
        <label htmlFor="hostname" className={labelClass}>
          Domain
        </label>
        <input id="hostname" name="hostname" type="text" inputMode="url" placeholder="yourbusiness.com" className={inputClass} required disabled={pending} />
        {websites.length > 1 ? (
          <div className="mt-3">
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
      </div>
      <button type="submit" className="btn-primary text-sm" disabled={pending}>
        {pending ? "Starting…" : "Start connection"}
      </button>
      <div className="sm:col-span-2">
        <FormError message={state && !state.ok ? state.error : null} />
        <FormSuccess message={state?.ok ? "Domain added. Follow the DNS steps above; we will check it automatically." : null} />
      </div>
    </form>
  );
}
