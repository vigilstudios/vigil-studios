"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createOrganization, type CreateOrgState } from "@/lib/vigil/actions/admin";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";

export function NewOrganizationForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<CreateOrgState, FormData>(async (prev, data) => {
    const res = await createOrganization(prev, data);
    if (res?.ok) router.push(`/admin/organizations/${res.data.id}`);
    return res;
  }, null);
  const issues = state && !state.ok ? state.issues ?? {} : {};

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" noValidate>
      <div>
        <label htmlFor="org-name" className={labelClass}>Business name</label>
        <input id="org-name" name="name" className={inputClass} required disabled={pending} />
        {issues.name ? <p className="mt-1 text-xs text-[#ef4444]">{issues.name[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="org-slug" className={labelClass}>Slug (optional)</label>
        <input id="org-slug" name="slug" className={inputClass} placeholder="derived from name" disabled={pending} />
        {issues.slug ? <p className="mt-1 text-xs text-[#ef4444]">{issues.slug[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="org-owner" className={labelClass}>Owner email (optional)</label>
        <input id="org-owner" name="owner_email" type="email" className={inputClass} disabled={pending} />
        {issues.owner_email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.owner_email[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="org-billing" className={labelClass}>Billing email (optional)</label>
        <input id="org-billing" name="billing_email" type="email" className={inputClass} disabled={pending} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <FormError message={state && !state.ok ? state.error : null} />
        <button type="submit" className="btn-primary mt-2 text-sm" disabled={pending}>
          {pending ? "Creating…" : "Create customer"}
        </button>
      </div>
    </form>
  );
}
