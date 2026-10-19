"use client";

import { useEffect, useId, useState } from "react";
import { Globe2 } from "lucide-react";
import { findVercelDomain, getDomainHandoff, updateDomainHandoff } from "@/lib/vigil/actions/domain-commerce";
import { quoteIsFresh, vercelDomainUrl, type DomainIntent, type DomainQuote } from "@/lib/vigil/domain-commerce";
import { DomainPurchaseOffer } from "@/components/vigil/DomainPurchaseOffer";
import { DomainPurchaseReturn } from "@/components/vigil/DomainPurchaseReturn";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";

/** Shared Domain/onboarding journey. Purchase intent is never domain ownership. */
export function DomainJourney({ websiteId, initial = null, initialHostname = "", canManage }: { websiteId: string; initial?: DomainIntent | null; initialHostname?: string; canManage: boolean }) {
  const id = useId();
  const [intent, setIntent] = useState(initial);
  const [name, setName] = useState(initialHostname);
  const [quote, setQuote] = useState<DomainQuote | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [choosing, setChoosing] = useState(false);
  const [viewedHostname, setViewedHostname] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getDomainHandoff(websiteId).then(res => {
      if (!active) return;
      if (res.ok) { setIntent(res.data); setLoaded(true); } else setError(res.error);
    }).catch(() => { if (active) setError("Your saved choice could not be loaded. Refresh and try again."); });
    return () => { active = false; };
  }, [websiteId]);
  const saved = intent && intent.phase !== "cancelled";
  // A public-link preview changes only this browser view, never customer intent.
  const handoffHostname = choosing ? null : viewedHostname ?? (saved ? intent.hostname : null);
  const searching = !handoffHostname;
  const step = handoffHostname ? 2 : quote?.available ? 1 : 0;
  const run = async (work: () => Promise<void>) => {
    setPending(true); setError(null); setNotice("");
    try { await work(); } catch { setError("Something went wrong. Refresh and try again."); } finally { setPending(false); }
  };
  const search = () => run(async () => {
    const res = await findVercelDomain(websiteId, name);
    if (!res.ok) { setError(res.error); return; }
    setQuote(res.data);
  });
  const handoff = () => run(async () => {
    if (!quote || !quoteIsFresh(quote)) { setQuote(null); setError("This quote has expired. Search again for current availability and prices."); return; }
    const res = await updateDomainHandoff({ websiteId, version: intent?.version ?? 0, action: "handoff", hostname: quote.hostname });
    if (!res.ok) { setError(res.error); return; }
    setIntent(res.data); setViewedHostname(null); setChoosing(false); setQuote(null);
    setNotice("Your choice is saved. After buying, return here and select I’ve bought it — continue setup. If Vercel did not open, use Return to Vercel.");
    window.open(vercelDomainUrl(res.data.hostname), "_blank", "noopener,noreferrer");
  });
  const cancel = () => run(async () => {
    if (!intent) return;
    const res = await updateDomainHandoff({ websiteId, version: intent.version, action: "cancel" });
    if (!res.ok) { setError(res.error); return; }
    setIntent(res.data); setViewedHostname(null); setQuote(null); setChoosing(false); setNotice("Choice removed. You can return whenever you are ready.");
  });
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-4">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold"><Globe2 className="h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden="true" />{["Find your domain", "Buy your domain", "After your purchase"][step]}</h2>
      {step === 0 ? <p className="text-sm text-[color:var(--text-secondary)]">Your domain and renewals stay in your own Vercel account.</p> : null}
      {!canManage ? <p className="text-sm text-[color:var(--text-secondary)]">You can view this domain on Vercel. The customer’s account owner or manager needs to sign in to save the choice and continue setup.</p> : null}
      {handoffHostname ? <DomainPurchaseReturn hostname={handoffHostname} websiteId={websiteId} intentVersion={intent?.version} canManage={canManage} previewOnly={viewedHostname !== null} pending={pending || !loaded} onChoose={() => { setChoosing(true); setViewedHostname(null); setQuote(null); }} onCancel={canManage && loaded && saved ? () => void cancel() : undefined} /> : null}
      {searching ? (
        <div className="space-y-3">
          {!quote?.available ? <form onSubmit={event => { event.preventDefault(); void search(); }} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 basis-48"><label htmlFor={`${id}-name`} className={labelClass}>Exact domain name</label><input id={`${id}-name`} className={inputClass} placeholder="yourbusiness.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={name} onChange={event => { setName(event.target.value); setQuote(null); }} disabled={pending} required /></div>
            <button type="submit" className="btn-secondary min-h-11 text-sm" disabled={pending}>{pending ? "Working…" : "Search"}</button>
          </form> : null}
          {quote?.available ? <>
            <DomainPurchaseOffer quote={quote} canManage={canManage} pending={pending} disabled={pending || !loaded} onBuy={() => void handoff()} onView={() => { setViewedHostname(quote.hostname); setQuote(null); setChoosing(false); setNotice(""); }} />
            <div><button type="button" className="min-h-11 text-sm underline" disabled={pending} onClick={() => setQuote(null)}>Back to search</button></div>
          </> : quote ? <div className="space-y-2 rounded-xl border border-[color:var(--border)] p-4" aria-live="polite"><p className="break-all font-semibold">{quote.hostname}</p><p className="text-sm">This name isn’t available to buy on Vercel. Try a different web address.</p></div> : null}
          {choosing && saved ? <button type="button" className="min-h-11 text-sm underline" onClick={() => { setChoosing(false); setQuote(null); }}>Keep saved choice</button> : null}
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="text-sm text-[color:var(--text-secondary)]">{!loaded && !error ? "Loading saved choice…" : notice}</div>
      <FormError message={error} />
    </section>
  );
}
