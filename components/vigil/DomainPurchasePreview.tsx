"use client";

import { useRef, useState } from "react";
import { VERCEL_DOMAINS_URL } from "@/lib/vigil/domain-guides";
import { VercelDomainIllustration } from "./VercelDomainIllustration";

/** Read-only presentation preview, with no domain row, proof token or checker. */
export function DomainPurchasePreview({ hostname }: { hostname: string }) {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const move = (next: number) => { setStep(next); requestAnimationFrame(() => heading.current?.focus()); };
  return <section aria-label="Post-purchase setup preview" className="space-y-5">
    <p className="text-xs font-medium text-[color:var(--accent)]">Read-only preview · Step {step + 1} of 4</p>
    <h2 ref={heading} tabIndex={-1} className="break-all text-lg font-semibold outline-none">{step === 0 ? "Open Domains" : step === 1 ? `Select ${hostname}` : step === 2 ? "Open DNS Records" : "Add your verification record"}</h2>
    <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{step === 0 ? `After buying ${hostname} on Vercel, the customer goes straight to Domains in that same account.` : step === 1 ? `Select ${hostname} in the domain list. If it is missing, check the account or team used for the purchase.` : step === 2 ? "On the domain’s settings page, find DNS Records." : "Type, Name and Value appear together in one step. The customer copies their personal values, leaves TTL at its default, then selects Add in Vercel and returns to Vigil to check the record."}</p>
    {step === 0 ? <a href={VERCEL_DOMAINS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-[color:var(--accent)] underline">Open my Vercel domains<span className="sr-only"> (opens in a new tab)</span></a> : null}
    {step < 3 ? <VercelDomainIllustration hostname={hostname} stage={step === 0 ? "domains" : step === 1 ? "domain" : "dns"} /> : <figure className="space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
      <figcaption className="text-sm font-medium">Example only · DNS record form</figcaption>
      {[ ["Type", "TXT"], ["Name", "Your record name appears here"], ["Value", "Your personal verification code appears here"] ].map(([label, value]) => <div key={label}><p className="mb-1 text-xs text-[color:var(--text-secondary)]">{label}</p><p className="break-all rounded-md border border-[color:var(--border)] p-3 text-sm">{value}</p></div>)}
      <p className="text-sm">TTL: leave default · Comment: leave empty</p><p className="text-sm font-semibold">Then select Add in Vercel.</p>
    </figure>}
    <p className="text-xs leading-5 text-[color:var(--text-secondary)]">This preview has not saved a customer choice or started setup. The customer receives their actual record and ownership check when they continue from their own Vigil account.</p>
    {step < 3 ? <button type="button" className="btn-primary min-h-11 text-sm" onClick={() => move(step + 1)}>Preview next step</button> : null}
    {step > 0 ? <div><button type="button" className="min-h-11 text-sm underline" onClick={() => move(step - 1)}>Back</button></div> : null}
  </section>;
}
