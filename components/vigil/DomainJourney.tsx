"use client";

import { useEffect, useId, useState } from "react";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { findVercelDomain, getDomainHandoff, updateDomainHandoff } from "@/lib/vigil/actions/domain-commerce";
import { quoteIsFresh, vercelDomainUrl, type DomainIntent, type DomainQuote } from "@/lib/vigil/domain-commerce";
import { DomainPurchaseOffer } from "@/components/vigil/DomainPurchaseOffer";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";

/** Shared Domain/onboarding journey. Purchase intent is never domain ownership. */
export function DomainJourney({ websiteId, initial = null, canManage }: { websiteId: string; initial?: DomainIntent | null; canManage: boolean }) {
  const id = useId();
  const [intent, setIntent] = useState(initial);
  const [name, setName] = useState("");
  const [quote, setQuote] = useState<DomainQuote | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [choosing, setChoosing] = useState(false);
  useEffect(() => {
    let active = true;
    void getDomainHandoff(websiteId).then(res => {
      if (!active) return;
      if (res.ok) { setIntent(res.data); setLoaded(true); } else setError(res.error);
    }).catch(() => { if (active) setError("Your saved choice could not be loaded. Refresh and try again."); });
    return () => { active = false; };
  }, [websiteId]);
  const saved = intent && intent.phase !== "cancelled";
  const searching = !saved || choosing;
  const step = saved && !choosing ? 2 : quote?.available ? 1 : 0;
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
    setIntent(res.data); setChoosing(false); setQuote(null);
    setNotice("Your choice is saved. If a new tab did not open, select Open domain on Vercel.");
    window.open(vercelDomainUrl(res.data.hostname), "_blank", "noopener,noreferrer");
  });
  const cancel = () => run(async () => {
    if (!intent) return;
    const res = await updateDomainHandoff({ websiteId, version: intent.version, action: "cancel" });
    if (!res.ok) { setError(res.error); return; }
    setIntent(res.data); setQuote(null); setChoosing(false); setNotice("Choice removed. You can return whenever you are ready.");
  });
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-4">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base font-semibold"><Globe2 className="h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden="true" />Find your domain</h2>
      <p className="text-sm text-[color:var(--text-secondary)]">Your domain and renewals stay in your own Vercel account.</p>
      {!canManage ? <p className="text-sm text-[color:var(--text-secondary)]">You’re viewing this customer’s dashboard as staff. You can open the domain on Vercel to view it. The customer must buy it using their own Vercel account.</p> : null}
      <h3 className="text-lg font-semibold">{["Search for a name", "Buy your domain", "Continue your purchase"][step]}</h3>
      {saved && !choosing ? (
        <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
          <p className="break-all text-xl font-semibold sm:text-2xl">{intent.hostname}</p>
          <p className="text-sm leading-relaxed">Complete your purchase on Vercel using your own account. Your choice is saved here so you can return without searching again.</p>
          <a className="btn-primary flex min-h-12 w-full items-center gap-2 whitespace-normal !px-4 text-center text-base" href={vercelDomainUrl(intent.hostname)} target="_blank" rel="noopener noreferrer">Open domain on Vercel <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          <p className="text-xs text-[color:var(--text-secondary)]">Opens the Vercel page for <span className="break-all">{intent.hostname}</span>. Vercel confirms availability and the final price before you pay.</p>
          {canManage ? <div className="space-y-2 border-t border-[color:var(--border)] pt-4"><p className="text-sm">Already bought it? Continue with your setup.</p><a href={`/dashboard/domain?flow=own&website=${encodeURIComponent(websiteId)}&hostname=${encodeURIComponent(intent.hostname)}&registrar=vercel`} className="btn-secondary flex min-h-11 w-full items-center whitespace-normal !px-4 text-center text-sm" aria-label={`Set up ${intent.hostname}`}>I’ve bought it — set up my domain</a><p className="text-xs text-[color:var(--text-secondary)]">We’ll verify ownership during setup. Your saved choice does not confirm a purchase.</p></div> : null}
          <div className="flex flex-wrap gap-x-4 gap-y-3 text-sm">
            <a className="inline-flex min-h-11 items-center underline" href={`mailto:hello@vigilstudios.co?subject=${encodeURIComponent(`Connect ${intent.hostname}`)}`}>Contact Vigil</a>
            <button type="button" className="min-h-11 underline" disabled={pending} onClick={() => { setChoosing(true); setQuote(null); }}>{canManage ? "Choose another domain" : "Search another domain"}</button>
            {canManage ? <button type="button" className="min-h-11 underline" disabled={pending || !loaded} onClick={() => void cancel()}>Decide later</button> : null}
          </div>
        </div>
      ) : null}
      {searching ? (
        <div className="space-y-3">
          {!quote?.available ? <form onSubmit={event => { event.preventDefault(); void search(); }} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 basis-48"><label htmlFor={`${id}-name`} className={labelClass}>Exact domain name</label><input id={`${id}-name`} className={inputClass} placeholder="yourbusiness.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={name} onChange={event => { setName(event.target.value); setQuote(null); }} disabled={pending} required /></div>
            <button type="submit" className="btn-secondary min-h-11 text-sm" disabled={pending}>{pending ? "Working…" : "Search"}</button>
          </form> : null}
          {quote?.available ? <>
            <DomainPurchaseOffer quote={quote} canManage={canManage} pending={pending} disabled={pending || !loaded} onBuy={() => void handoff()} />
            <div><button type="button" className="min-h-11 text-sm underline" disabled={pending} onClick={() => setQuote(null)}>Back to search</button></div>
          </> : quote ? <div className="space-y-2 rounded-xl border border-[color:var(--border)] p-4" aria-live="polite"><p className="break-all font-semibold">{quote.hostname}</p><p className="text-sm">This name isn’t available to buy on Vercel. Try a different web address.</p></div> : null}
          {choosing ? <button type="button" className="min-h-11 text-sm underline" onClick={() => { setChoosing(false); setQuote(null); }}>Keep saved choice</button> : null}
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="text-sm text-[color:var(--text-secondary)]">{!loaded && !error ? "Loading saved choice…" : notice}</div>
      <FormError message={error} />
    </section>
  );
}
