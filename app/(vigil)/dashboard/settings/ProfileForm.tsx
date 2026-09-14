"use client";

import { useActionState } from "react";
import { updateOrganizationProfile, type ProfileState } from "@/lib/vigil/actions/organization";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";
import type { Organization } from "@/lib/vigil/types";

const fields: { name: keyof Organization; label: string; type?: string; placeholder?: string }[] = [
  { name: "name", label: "Business name" },
  { name: "legal_name", label: "Legal name (optional)" },
  { name: "billing_email", label: "Billing email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "website_url", label: "Current website (optional)", type: "url", placeholder: "https://" },
  { name: "timezone", label: "Time zone", placeholder: "America/New_York" },
];

export function ProfileForm({ organization, readOnly }: { organization: Organization; readOnly: boolean }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateOrganizationProfile, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className={labelClass}>
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            defaultValue={(organization[f.name] as string | null) ?? ""}
            placeholder={f.placeholder}
            className={inputClass}
            disabled={pending || readOnly}
          />
          {issues[f.name] ? <p className="mt-1 text-xs text-[#ef4444]">{issues[f.name][0]}</p> : null}
        </div>
      ))}
      <div className="sm:col-span-2">
        <FormError message={state && !state.ok ? state.error : null} />
        <FormSuccess message={state?.ok ? "Saved." : null} />
        {!readOnly ? (
          <button type="submit" className="btn-primary mt-2 text-sm" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        ) : (
          <p className="text-xs text-[color:var(--text-secondary)]">Only owners and managers can edit the business profile.</p>
        )}
      </div>
    </form>
  );
}
