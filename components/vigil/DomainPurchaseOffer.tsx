"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { vercelDomainUrl, type DomainQuote } from "@/lib/vigil/domain-commerce";

/** Public purchase link never grants authority to save customer choices or DNS. */
export function DomainPurchaseOffer({ quote, canManage, pending, disabled, onBuy, onView }: {
  quote: DomainQuote; canManage: boolean; pending: boolean; disabled: boolean; onBuy: () => void; onView?: () => void;
}) {
  const money = (value: number | null) => value === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const actionClass = "btn-primary flex min-h-12 w-full gap-2 whitespace-normal !px-4 text-center text-base";
  return <div className="space-y-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-5 sm:p-6" aria-live="polite">
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--accent)]"><Check className="h-4 w-4" aria-hidden="true" />Available to buy</p>
      <p className="break-all text-2xl font-semibold tracking-tight sm:text-3xl">{quote.hostname}</p>
      {quote.premium ? <p className="text-sm font-medium text-[color:var(--accent-3)]">Premium domain</p> : null}
    </div>
    <dl className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4">
        <dt className="text-sm font-medium">{quote.years === 1 ? "First year" : `First ${quote.years} years`}</dt>
        <dd className="mt-2 text-4xl font-semibold tracking-tight text-[color:var(--accent)]">{money(quote.registration)} <span className="text-sm font-medium">USD</span><span className="mt-2 block text-xs font-normal tracking-normal text-[color:var(--text-secondary)]">Paid to Vercel to register this web address.</span></dd>
      </div>
      <div className="rounded-lg border border-[color:var(--border)] p-4">
        <dt className="text-sm text-[color:var(--text-secondary)]">Renewal estimate</dt>
        <dd className="mt-2 text-2xl font-semibold">{money(quote.renewal)} <span className="text-sm font-normal text-[color:var(--text-secondary)]">USD</span><span className="mt-2 block text-xs font-normal text-[color:var(--text-secondary)]">Vercel confirms the renewal price and term.</span></dd>
      </div>
    </dl>
    <div className="space-y-3">
      {canManage ? <button type="button" onClick={onBuy} disabled={disabled} className={actionClass}>{pending ? "Saving your choice…" : "Buy this domain on Vercel"}<ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" /></button>
        : <a href={vercelDomainUrl(quote.hostname)} onClick={onView} target="_blank" rel="noopener noreferrer" className={actionClass}>View this domain on Vercel<ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" /></a>}
      <p className="text-center text-xs text-[color:var(--text-secondary)]">Opens Vercel’s page for <span className="break-all font-medium">{quote.hostname}</span> in a new tab. Sign in or create your own Vercel account to buy it.</p>
      <p className="text-sm text-[color:var(--text-secondary)]">After buying, return here. We’ll guide you through connecting your domain, one step at a time.</p>
    </div>
    <p className="text-xs leading-relaxed text-[color:var(--text-secondary)]">Vercel confirms the final price, tax and availability before you pay. Searching does not reserve this name or charge you.</p>
  </div>;
}
