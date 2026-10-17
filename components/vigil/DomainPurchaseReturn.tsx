"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { vercelDomainUrl } from "@/lib/vigil/domain-commerce";

/** Returning from checkout is a navigation step, never payment or ownership proof. */
export function DomainPurchaseReturn({ hostname, websiteId, canManage, previewOnly = false, pending, onChoose, onCancel }: {
  hostname: string; websiteId: string; canManage: boolean; previewOnly?: boolean;
  pending: boolean; onChoose: () => void; onCancel?: () => void;
}) {
  const setupUrl = `/dashboard/domain?flow=own&website=${encodeURIComponent(websiteId)}&hostname=${encodeURIComponent(hostname)}&registrar=vercel`;
  return <div className="space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4 sm:p-5">
    <p className="break-all text-xl font-semibold sm:text-2xl">{hostname}</p>
    <p className="text-sm leading-relaxed">Once your purchase is complete on Vercel, return to this page and continue below.</p>
    <a href={setupUrl} aria-label={`Set up ${hostname}`} className="btn-primary flex min-h-12 w-full items-center gap-2 whitespace-normal !px-4 text-center text-base">{canManage ? "I’ve bought it — continue setup" : "Preview the next step"}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" /></a>
    <p className="text-sm text-[color:var(--text-secondary)]">Your domain will be filled in. We’ll guide you through proving you own it, one instruction at a time.</p>
    {previewOnly ? <p className="text-xs text-[color:var(--text-secondary)]">This preview has not saved a customer choice. The customer continues from their own Vigil account.</p> : null}
    <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
      <p className="text-sm">Still need to finish buying?</p>
      <a href={vercelDomainUrl(hostname)} target="_blank" rel="noopener noreferrer" className="btn-secondary flex min-h-11 w-full items-center gap-2 whitespace-normal !px-4 text-center text-sm">Return to Vercel<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
    </div>
    <p className="text-xs text-[color:var(--text-secondary)]">Vigil checks ownership during setup. Opening Vercel or selecting Continue does not confirm payment.</p>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <button type="button" className="min-h-11 underline" disabled={pending} onClick={onChoose}>{canManage ? "Choose another domain" : "Search another domain"}</button>
      {onCancel ? <button type="button" className="min-h-11 underline" disabled={pending} onClick={onCancel}>Decide later</button> : null}
      <a className="inline-flex min-h-11 items-center underline" href={`mailto:hello@vigilstudios.co?subject=${encodeURIComponent(`Connect ${hostname}`)}`}>Contact Vigil</a>
    </div>
  </div>;
}
