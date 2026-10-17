"use client";

import { useEffect, useState } from "react";
import { DomainJourney } from "@/components/vigil/DomainJourney";
import type { DomainIntent } from "@/lib/vigil/domain-commerce";
import { DomainGuide } from "@/components/vigil/DomainGuide";
import { guideOutcome } from "@/lib/vigil/domain-guide-flow";
import { confirmDnsAdded, getDomainSetup, guessRegistrar, startOnboardingDomain, type DomainSetup } from "@/lib/vigil/actions/onboarding";
import { REGISTRAR_OPTIONS } from "@/lib/vigil/domain-guides";
import { domainSchema, type DomainAnswers, type RegistrarKey } from "@/lib/vigil/onboarding/brief";
import { ChoiceCards, Field, TextInput, useAutosave, type SaveState } from "../wizard-ui";
import { inputClass } from "@/components/vigil/ui";

type Props = {
  initial: DomainAnswers | undefined; projectId: string; websiteId: string | null;
  initialIntent: DomainIntent | null; businessName: string; domain: DomainSetup | null;
  onDomain: (d: DomainSetup | null) => void; canManage: boolean;
  save: (data: DomainAnswers, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void; onBack: () => void; onNext: () => void;
};
type Phase = "ask" | "unsure" | "search" | "hostname" | "provider" | "guide";

/** Each branch occupies one screen; the shared DNS guide handles its own individual tasks. */
export function DomainStep({ initial, projectId, websiteId, initialIntent, businessName, domain, onDomain, canManage, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<DomainAnswers>(() => domain && canManage ? { ...(initial ?? domainSchema.parse({})), answer: "own", hostname: domain.hostname, domainId: domain.domainId, registrar: domain.registrar } : initial ?? domainSchema.parse({}));
  const [phase, setPhase] = useState<Phase>(() => domain ? "guide" : initial?.answer === "own" ? "hostname" : initial?.answer === "need" || (initialIntent && initialIntent.phase !== "cancelled") ? "search" : "ask");
  const [hostname, setHostname] = useState(initial?.hostname ?? "");
  const [registrar, setRegistrar] = useState<RegistrarKey>(domain?.registrar ?? initial?.registrar ?? "other");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, flush } = useAutosave(data, value => save(value));
  useEffect(() => onSaveState(state), [state, onSaveState]);
  const pollingDomainId = domain?.domainId;
  const pollingStatus = domain?.status;
  useEffect(() => {
    if (!pollingDomainId || pollingStatus === "connected") return;
    let active = true;
    let inFlight = false;
    const timer = window.setInterval(async () => {
      if (inFlight || document.visibilityState !== "visible" || !navigator.onLine) return;
      inFlight = true;
      try { const result = await getDomainSetup(pollingDomainId, registrar); if (active && result.ok) onDomain(result.data); } catch { /* Retry on the next visible poll. */ } finally { inFlight = false; }
    }, 20_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [pollingDomainId, pollingStatus, registrar, onDomain]);
  const run = async (work: () => Promise<void>) => {
    setWorking(true); setError(null);
    try { await work(); } catch { setError("This step could not finish. Please try again."); } finally { setWorking(false); }
  };
  const finish = (later: boolean) => run(async () => {
    const next = { ...data, later };
    setData(next);
    if (await flush() && await save(next, true)) onNext();
  });
  const choose = (answer: "own" | "need" | "unsure") => {
    setData(current => ({ ...current, answer }));
    setPhase(answer === "own" ? "hostname" : answer === "need" ? "search" : "unsure");
  };
  return <div className="space-y-5">
    {phase === "ask" ? <>
      <p className="text-sm font-medium">Do you already own a web address for {businessName}?</p>
      <ChoiceCards name="Domain" value={data.answer} onChange={choose} options={[
        { value: "own", label: "I already own one", hint: "Use your existing domain." },
        { value: "need", label: "Find a domain", hint: "Search and buy through your own Vercel account." },
        { value: "unsure", label: "I’m not sure", hint: "Help me work it out." },
      ]} />
    </> : phase === "unsure" ? <>
      <h2 className="text-base font-semibold">Have you bought a web address before?</h2>
      <p className="text-sm text-[color:var(--text-secondary)]">A domain is an address like yourbusiness.com. Search your email for a domain purchase or renewal receipt.</p>
      <div className="flex flex-wrap gap-3"><button type="button" className="btn-secondary min-h-11 text-sm" onClick={() => choose("own")}>Yes, I found mine</button><button type="button" className="btn-secondary min-h-11 text-sm" onClick={() => choose("need")}>I need a new one</button></div>
    </> : phase === "search" ? websiteId ? <DomainJourney websiteId={websiteId} initial={initialIntent} canManage={canManage} /> : <p>Domain search is being prepared. You can continue onboarding and return later.</p> : phase === "hostname" ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); void run(async () => {
      const result = await guessRegistrar(hostname);
      if (!result.ok) { setError(result.error); return; }
      setRegistrar(result.data.registrar ?? "other"); setPhase("provider");
    }); }}>
      <Field id="onboarding-domain" label="Your domain" hint="Enter the web address you control."><TextInput id="onboarding-domain" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="yourbusiness.com" value={hostname} onChange={event => setHostname(event.target.value)} disabled={working} /></Field>
      <button type="submit" className="btn-primary min-h-11 text-sm" disabled={working || !hostname.trim()}>{working ? "Checking…" : "Continue"}</button>
    </form> : phase === "provider" ? <div className="space-y-4">
      <h2 className="text-base font-semibold">Where do you manage {hostname}?</h2>
      <label className="block space-y-2 text-sm"><span>Domain provider</span><select className={inputClass} value={registrar} onChange={event => setRegistrar(event.target.value as RegistrarKey)}>{REGISTRAR_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.name}</option>)}</select></label>
      {canManage ? <button type="button" className="btn-primary min-h-11 text-sm" disabled={working} onClick={() => void run(async () => {
        const result = await startOnboardingDomain(projectId, { hostname, registrar });
        if (!result.ok) { setError(result.error); return; }
        onDomain(result.data); setData(current => ({ ...current, answer: "own", hostname: result.data.hostname, registrar, domainId: result.data.domainId, later: false })); setPhase("guide");
      })}>{working ? "Saving…" : "Continue to guide"}</button> : <p className="text-sm">A customer owner or manager can save the domain.</p>}
    </div> : domain ? <>
      <DomainGuide domain={domain} registrar={registrar} afterPurchase={Boolean(initialIntent && initialIntent.phase !== "cancelled" && initialIntent.websiteId === websiteId && initialIntent.hostname === domain.hostname && registrar === "vercel")} onConfirm={canManage ? () => void run(async () => { const result = await confirmDnsAdded(domain.domainId, registrar); if (result.ok) onDomain(result.data); else setError(result.error); }) : undefined} onRefresh={() => void run(async () => { const result = await getDomainSetup(domain.domainId, registrar); if (result.ok) onDomain(result.data); else setError(result.error); })} confirming={working} />
      {guideOutcome(domain) ? <button type="button" className="btn-primary min-h-11 text-sm" disabled={working} onClick={() => void finish(domain.status !== "connected")}>Continue onboarding</button> : null}
    </> : null}
    {error ? <p role="alert" className="text-sm text-[color:var(--status-bad)]">{error}</p> : null}
    <div className="flex flex-wrap gap-5 border-t border-[color:var(--border)] pt-3 text-sm text-[color:var(--text-secondary)]">
      <button type="button" className="min-h-11" disabled={working} onClick={() => phase === "ask" ? onBack() : setPhase(phase === "provider" ? "hostname" : "ask")}>{phase === "guide" ? "All domain options" : "Back"}</button>
      {phase !== "guide" || !domain || !guideOutcome(domain) ? <button type="button" className="min-h-11 underline" disabled={working} onClick={() => void finish(true)}>Do this later</button> : null}
    </div>
  </div>;
}
