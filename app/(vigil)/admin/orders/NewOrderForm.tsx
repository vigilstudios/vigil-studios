"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutLink, type CreateOrderState } from "@/lib/vigil/actions/admin-orders";
import { FormError, FormSuccess, inputClass, labelClass } from "@/components/vigil/ui";

export function NewOrderForm({ plans, templates }: { plans: { code: string; name: string }[]; templates: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CreateOrderState, FormData>(async (prev, fd) => {
    const res = await createCheckoutLink(prev, fd);
    if (res?.ok) router.refresh();
    return res;
  }, null);
  const [kind, setKind] = useState<"express" | "professional" | "custom">("express");
  const issues = state && !state.ok ? state.issues ?? {} : {};

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" noValidate>
      <div className="lg:col-span-2">
        <label className={labelClass} htmlFor="o-business">Business name</label>
        <input id="o-business" name="business_name" className={inputClass} required disabled={pending} />
        {issues.business_name ? <p className="mt-1 text-xs text-[#ef4444]">{issues.business_name[0]}</p> : null}
      </div>
      <div>
        <label className={labelClass} htmlFor="o-contact">Contact name</label>
        <input id="o-contact" name="contact_name" className={inputClass} disabled={pending} />
      </div>
      <div>
        <label className={labelClass} htmlFor="o-email">Customer email</label>
        <input id="o-email" name="email" type="email" className={inputClass} required disabled={pending} />
        {issues.email ? <p className="mt-1 text-xs text-[#ef4444]">{issues.email[0]}</p> : null}
      </div>
      <div>
        <label className={labelClass} htmlFor="o-kind">Build</label>
        <select id="o-kind" name="project_kind" className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} disabled={pending}>
          <option value="express">Express ($ catalog)</option>
          <option value="professional">Professional ($ catalog)</option>
          <option value="custom">Custom (quoted)</option>
        </select>
      </div>
      <div>
        {kind === "express" ? (
          <>
            <label className={labelClass} htmlFor="o-template">Template</label>
            <select id="o-template" name="template_slug" className={inputClass} defaultValue="" disabled={pending}>
              <option value="">Choose a template</option>
              {templates.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </>
        ) : (
          <div className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
            {kind === "professional" ? "Up to 8 custom primary pages with standard booking and integrations. The build foundation is chosen after onboarding and scope review." : "The build foundation follows the agreed custom scope."}
          </div>
        )}
      </div>
      <div>
        <label className={labelClass} htmlFor="o-plan">Vigil plan</label>
        <select id="o-plan" name="plan_code" className={inputClass} defaultValue={plans[0]?.code ?? ""} disabled={pending}>
          {plans.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="o-amount">Build amount (USD){kind === "express" ? " · optional override" : " · agreed price"}</label>
        <input id="o-amount" name="build_amount" inputMode="decimal" className={inputClass} placeholder={kind === "custom" ? "e.g. 2500" : kind === "professional" ? "catalog price if blank" : "catalog price"} disabled={pending} />
        {issues.build_amount ? <p className="mt-1 text-xs text-[#ef4444]">{issues.build_amount[0]}</p> : null}
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className={labelClass} htmlFor="o-notes">Internal notes</label>
        <input id="o-notes" name="notes" className={inputClass} placeholder="Scoped on the 12 Sep call; wants a cigar lounge feel" disabled={pending} />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="send_email" defaultChecked /> Email the link to the customer
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <FormError message={state && !state.ok ? state.error : null} />
        {state?.ok ? (
          <FormSuccess message={`Checkout link created${state.data.emailed ? " and emailed" : ""}: ${state.data.url}`} />
        ) : null}
        <button type="submit" className="btn-primary mt-2 text-sm" disabled={pending}>
          {pending ? "Creating…" : "Create checkout link"}
        </button>
      </div>
    </form>
  );
}
