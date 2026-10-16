"use client";

import { useEffect, useId, useState } from "react";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { findVercelDomain, getDomainHandoff, updateDomainHandoff } from "@/lib/vigil/actions/domain-commerce";
import { quoteIsFresh, vercelDomainUrl, type DomainIntent, type DomainQuote } from "@/lib/vigil/domain-commerce";
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
    setNotice("Your choice is saved. If Vercel did not open, use Return to Vercel below.");
    window.open(vercelDomainUrl(res.data.hostname), "_blank", "noopener,noreferrer");
  });
  const cancel = () => run(async () => {
    if (!intent) return;
    const res = await updateDomainHandoff({ websiteId, version: intent.version, action: "cancel" });
    if (!res.ok) { setError(res.error); return; }
    setIntent(res.data); setQuote(null); setChoosing(false); setNotice("Choice removed. You can return whenever you are ready.");
  });
  const money = (value: number | null) => value === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-4">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base font-semibold"><Globe2 className="h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden="true" />Find your domain</h2>
      <ol aria-label="Domain steps" className="grid grid-cols-3 gap-2 text-xs text-[color:var(--text-secondary)]">
        {["Find a domain", "Buy on Vercel", "Connect"].map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined} className="border-t-2 border-[color:var(--border)] pt-2 aria-[current=step]:border-[color:var(--accent)] aria-[current=step]:text-[color:var(--text-primary)]">{i + 1}. {label}</li>)}
      </ol>
      <p className="text-sm text-[color:var(--text-secondary)]">Your domain and renewals stay in your own Vercel account.</p>
      {!canManage ? <p className="text-sm text-[color:var(--text-secondary)]">You can search availability and prices here. A customer owner or manager must save the choice and authorize the connection from their own account.</p> : null}
      <h3 className="text-sm font-medium">{["Search for a name", "Review and buy", "Connect your domain"][step]}</h3>
      {saved && !choosing ? (
        <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
          <p className="break-all font-semibold">{intent.hostname}</p>
          <p className="text-sm text-[color:var(--text-secondary)]">Finish your purchase on Vercel, then return here. A saved choice does not confirm a purchase.</p>
          <button type="button" className="btn-primary min-h-11 max-w-full whitespace-normal break-words !px-4 text-xs sm:text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled aria-describedby={`${id}-connection`}>Connect {intent.hostname}</button>
          <p id={`${id}-connection`} className="text-sm text-[color:var(--text-secondary)]">Action required: automatic connection is not available yet. Contact Vigil for help with your Vercel domain. No DNS changes have started.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-3 text-sm">
            <a className="inline-flex min-h-11 items-center gap-1 underline" href={vercelDomainUrl(intent.hostname)} target="_blank" rel="noopener noreferrer">Return to Vercel <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
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
          {quote ? <div className="space-y-3 rounded-xl border border-[color:var(--border)] p-4" aria-live="polite">
            <p className="break-all font-semibold">{quote.hostname}</p>
            {quote.available ? <>
              <p className="text-sm">Available{quote.premium ? " · Premium domain" : " · Standard domain"}</p>
              <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-[color:var(--text-secondary)]">Registration · {quote.years} {quote.years === 1 ? "year" : "years"}</dt><dd>{money(quote.registration)} USD</dd></div><div><dt className="text-[color:var(--text-secondary)]">Renewal estimate</dt><dd>{money(quote.renewal)} USD</dd></div></dl>
              <p className="text-xs text-[color:var(--text-secondary)]">Vercel confirms final availability, price and tax. Names are not reserved. We check the quote again before saving.</p>
              <p className="text-sm text-[color:var(--text-secondary)]">Continue to Vercel to sign in and buy this domain. Connection currently needs Vigil’s help.</p>
              {canManage ? <button type="button" onClick={() => void handoff()} disabled={pending || !loaded} className="btn-primary min-h-11 text-sm">{pending ? "Saving…" : "Continue on Vercel"}<span className="sr-only"> (opens in a new tab)</span></button> : null}
              <div><button type="button" className="min-h-11 text-sm underline" disabled={pending} onClick={() => setQuote(null)}>Back to search</button></div>
            </> : <p className="text-sm">Unavailable or unsupported by Vercel. Try another name.</p>}
          </div> : null}
          {choosing ? <button type="button" className="min-h-11 text-sm underline" onClick={() => { setChoosing(false); setQuote(null); }}>Keep saved choice</button> : null}
        </div>
      ) : null}
      <div role="status" aria-live="polite" className="text-sm text-[color:var(--text-secondary)]">{!loaded && !error ? "Loading saved choice…" : notice}</div>
      <FormError message={error} />
    </section>
  );
}
