"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { REGISTRAR_GUIDES, REGISTRAR_OPTIONS, VERCEL_DOMAINS_URL } from "@/lib/vigil/domain-guides";
import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";
import { domainGuideScreens, guideEncouragement, guideOutcome, guideStorageKey, restoreGuideScreen, visibleGuideRecords, type GuideDomain } from "@/lib/vigil/domain-guide-flow";
import { inputClass } from "./ui";
import { VercelDomainIllustration } from "./VercelDomainIllustration";
import { DomainCelebration } from "./DomainCelebration";

export type { GuideDomain } from "@/lib/vigil/domain-guide-flow";

/** Shared manual DNS guide. Navigation never claims a successful connection. */
export function DomainGuide({ domain, registrar, afterPurchase = false, onRegistrarChange, onConfirm, onRefresh, confirming, checking }: {
  domain: GuideDomain; registrar: RegistrarKey; onRegistrarChange?: (r: RegistrarKey) => void;
  afterPurchase?: boolean; onConfirm?: () => void; onRefresh?: () => void; confirming?: boolean; checking?: boolean; compact?: boolean;
}) {
  const screens = domainGuideScreens(domain, registrar, Boolean(onRegistrarChange), afterPurchase);
  const key = guideStorageKey(domain, registrar, afterPurchase);
  const [cursor, setCursor] = useState(screens[0].id);
  const [reviewing, setReviewing] = useState(false);
  const [help, setHelp] = useState(false);
  const hydrated = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const guide = REGISTRAR_GUIDES[registrar];
  const index = Math.max(0, screens.findIndex(screen => screen.id === cursor));
  const screen = screens[index];
  const outcome = guideOutcome(domain);
  const final = !reviewing ? outcome : null;
  const navigate = (id: string) => {
    setCursor(id);
    try { window.localStorage.setItem(key, id); } catch { /* Navigation still works without browser storage. */ }
    requestAnimationFrame(() => heading.current?.focus());
  };
  useEffect(() => {
    let active = true;
    // Defer restoration until hydration; the server always renders one screen.
    void Promise.resolve().then(() => {
      if (!active) return;
      let stored: string | null = null;
      try { stored = hydrated.current ? null : window.localStorage.getItem(key); } catch { /* Optional local progress. */ }
      hydrated.current = true;
      setCursor(restoreGuideScreen(domainGuideScreens(domain, registrar, Boolean(onRegistrarChange), afterPurchase), stored));
      setReviewing(false);
    });
    return () => { active = false; };
    // Only the record/provider fingerprint changes the navigation sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const title = help ? "Need a hand?" : final === "connected" ? "Your domain is connected" : final === "waiting_launch" ? "Ownership verified — more steps to come" : final === "waiting_connection" ? "Finishing your secure connection" : final === "preparing" ? "We’re preparing your guide" : screen.title;
  const success = final === "connected";
  const progress = success ? 100 : final === "waiting_launch" ? 45 : final === "waiting_connection" ? 95 : final === "preparing" ? 0 : domain.cutoverReady ? 50 + Math.round((index + 1) / (screens.length + 1) * 40) : Math.round((index + 1) / (screens.length + 1) * 40);
  return <section aria-label="Guided domain setup" className="relative min-w-0 space-y-5">
    <p className="break-all text-sm text-[color:var(--text-secondary)]">{domain.hostname}</p>
    {!help ? <div className="space-y-2">
      <p className="text-sm font-semibold text-[color:var(--accent)]">{final === "connected" ? "You did it — your website is live!" : final === "waiting_launch" ? "Great progress. Stay here for your next records." : final === "waiting_connection" ? "You’re so close! We’re finishing the secure connection." : final === "preparing" ? "We’re getting everything ready for you." : guideEncouragement(screen)}</p>
      <div role="progressbar" aria-label="Domain setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={success ? "Domain connected" : final === "waiting_launch" ? "Ownership verified; waiting for additional connection records. Setup is not complete." : final === "waiting_connection" ? "DNS verified; waiting for the secure connection" : final === "preparing" ? "Preparing your guide" : screen.kind === "check" ? domain.cutoverReady ? "Checking the final connection" : "Checking domain ownership; additional records follow" : `${domain.cutoverReady ? "Connection" : "Ownership"} guide step ${index + 1} of ${screens.length}`} className="h-1.5 overflow-hidden rounded-full bg-[color:var(--border)]"><div className="h-full rounded-full bg-[color:var(--accent-fill,var(--accent))]" style={{ width: `${progress}%` }} /></div>
    </div> : null}
    {!final && !help ? <p className="text-xs text-[color:var(--text-secondary)]">Step {index + 1}{screen.record !== undefined ? ` · Record ${screen.record + 1} of ${visibleGuideRecords(domain).length}` : ""}</p> : null}
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">{title}</h2>
    {help ? <>
      <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Vigil can walk you through this setup. Keep this page open so you can return to the same step.</p>
      <a href={`mailto:hello@vigilstudios.co?subject=${encodeURIComponent(`Domain setup help: ${domain.hostname}`)}`} className="btn-primary inline-flex min-h-11 items-center text-sm">Contact Vigil</a>
      <div><button type="button" className="min-h-11 text-sm underline" onClick={() => setHelp(false)}>Back to my step</button></div>
    </> : final ? <>
      {success ? <>
        <DomainCelebration key={domain.domainId} domainId={domain.domainId} />
        <div role="status" className="flex items-center gap-3 rounded-xl border border-[color:var(--accent)] bg-[color:var(--bg-surface-soft)] p-4 text-[color:var(--accent)]"><CheckCircle2 className="h-8 w-8 shrink-0" aria-hidden="true" /><span className="font-semibold">Domain connected · secure connection ready</span></div>
      </> : final === "waiting_connection" || final === "waiting_launch" ? <Loader2 className="h-7 w-7 animate-spin text-[color:var(--accent)] motion-reduce:animate-none" aria-hidden="true" /> : null}
      <p role={final === "waiting_launch" ? "status" : undefined} className="text-sm leading-6 text-[color:var(--text-secondary)]">{final === "connected" ? "Your domain is connected to your website and the secure connection is ready. It’s time to share your new address!" : final === "waiting_launch" ? "You’ve verified that you own this domain. Keep your TXT record in place. Domain setup is still in progress: you’ll need to add the remaining connection records once Vigil prepares the approved website for launch. This page checks automatically and will continue with one record at a time when they’re ready. Your website is not live yet." : final === "waiting_connection" ? "Your DNS records are visible. We’re waiting for the secure certificate and website checks to finish. Keep this page open; it will update automatically when your domain is fully connected." : "Your domain is saved. There is nothing to change in your domain account yet. This page checks automatically and will continue when the guide is ready."}</p>
      {final === "connected" ? <a href={`https://${domain.hostname}`} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex min-h-11 items-center gap-2 text-sm">Visit my website<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : null}
      {final !== "connected" && (onRefresh || onConfirm) ? <button type="button" className="btn-secondary min-h-11 text-sm" disabled={confirming || checking} onClick={onRefresh ?? onConfirm}>{confirming || checking ? "Checking…" : "Refresh status"}</button> : null}
      {(final === "waiting_launch" || final === "waiting_connection") ? <div><button type="button" className="min-h-11 text-sm underline" onClick={() => { setReviewing(true); navigate(screens[0].id); }}>Review my records</button></div> : null}
    </> : <>
      <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{screen.instruction}</p>
      {domain.cutoverReady && (screen.kind === "record" || screen.kind === "add") ? <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Continue in {guide.name} → {guide.dnsPath.join(" → ")}. Keep your ownership TXT record.{registrar === "vercel" ? <> <a href={VERCEL_DOMAINS_URL} target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] underline">Open my Vercel domains<span className="sr-only"> (opens in a new tab)</span></a></> : null}</p> : null}
      {screen.kind === "provider" && onRegistrarChange ? <label className="block space-y-2 text-sm"><span>Domain provider</span><select className={inputClass} value={registrar} disabled={confirming || checking} onChange={event => onRegistrarChange(event.target.value as RegistrarKey)}>{REGISTRAR_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.name}</option>)}</select></label> : null}
      {screen.kind === "login" && guide.loginUrl ? <a href={guide.loginUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--accent)] underline">Open {guide.name}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : null}
      {registrar === "vercel" && screen.kind === "menu" ? <>
        {screen.id === "menu-0" ? <a href={VERCEL_DOMAINS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--accent)] underline">Open my Vercel domains<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : null}
        <VercelDomainIllustration hostname={domain.hostname} stage={screen.id === "menu-0" ? "domains" : screen.id === "menu-1" ? "domain" : "dns"} />
      </> : null}
      {screen.kind === "record" ? <div key={screen.id} className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
          <p className="border-b border-[color:var(--border)] px-4 py-3 text-sm font-medium">In {guide.name} · DNS record form</p>
          <div className="space-y-4 p-4">{screen.fields?.map(field => <SingleValue key={field.label} label={field.label} value={field.value} />)}
          <p className="text-sm text-[color:var(--text-secondary)]">Leave {guide.fields.ttl ?? "the other settings"} at its default.{registrar === "vercel" ? " Leave Comment empty." : ""}</p>
          {screen.dnsOnly ? <p className="text-sm font-medium">Set Proxy status to DNS only.</p> : null}
          <p className="text-sm font-semibold">Then select {registrar === "vercel" ? "Add (or Save if you edited a record)" : "Save"} in {guide.name}.</p></div>
        </div>
        <p className="text-xs leading-5 text-[color:var(--text-secondary)]">Keep existing email records, unrelated records and nameservers unchanged. After saving, return to this Vigil tab.</p>
      </div> : null}
      {screen.kind === "check" ? <>
        {onConfirm ? <button type="button" className="btn-primary min-h-11 text-sm" disabled={confirming || checking} onClick={() => { setReviewing(false); onConfirm(); }}>{confirming || checking ? "Checking…" : domain.status === "verifying" ? "Check again" : "Check my setup"}</button> : <p className="text-sm text-[color:var(--text-secondary)]">A customer owner or manager can check this setup.</p>}
        <p role="status" className="text-sm text-[color:var(--text-secondary)]">{confirming || checking ? "Checking your saved records…" : domain.dnsOk ? domain.sslOk ? "Waiting for your website to answer securely." : "The DNS records are visible. The secure connection is still being prepared." : "If the records were just saved, they may take a while to appear. You can leave and return to this step."}</p>
      </> : <button type="button" className="btn-primary min-h-11 text-sm" disabled={confirming || checking} onClick={() => navigate(screens[index + 1].id)}>{screen.kind === "login" ? "I’m signed in" : screen.kind === "record" ? "I saved this record" : screen.id === "menu-0" && registrar === "vercel" ? "I’m on the Domains page" : screen.id === "menu-1" && registrar === "vercel" ? "I’ve opened my domain" : screen.id === "menu-2" && registrar === "vercel" ? "I can see DNS Records" : "Continue"}</button>}
      {index > 0 ? <div><button type="button" className="inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--text-secondary)]" disabled={confirming || checking} onClick={() => navigate(screens[index - 1].id)}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button></div> : null}
    </>}
    {!help && final !== "connected" ? <div className="border-t border-[color:var(--border)] pt-3"><button type="button" className="min-h-11 text-sm text-[color:var(--text-secondary)] underline" onClick={() => setHelp(true)}>Need help?</button></div> : null}
  </section>;
}

function SingleValue({ label, value }: { label: string; value: string }) {
  const [message, setMessage] = useState("");
  return <div className="min-w-0">
    <p className="mb-1.5 text-xs font-medium text-[color:var(--text-secondary)]">{label}</p>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-1.5">
      <p className="min-w-0 flex-1 break-all font-mono text-sm">{value || "Leave blank"}</p>
      {value ? <button type="button" className="min-h-11 shrink-0 px-2 text-sm font-medium text-[color:var(--accent)] underline" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage(`${label} copied`); } catch { setMessage("Select the value above and copy it manually."); } }}>Copy {label}</button> : null}
    </div>
    <p role="status" className="mt-1 text-xs text-[color:var(--text-secondary)]">{message}</p>
  </div>;
}
