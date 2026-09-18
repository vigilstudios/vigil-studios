"use client";

import { useEffect, useRef, useState } from "react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { DomainGuide } from "@/components/vigil/DomainGuide";
import { confirmDnsAdded, getDomainSetup, guessRegistrar, startOnboardingDomain, type DomainSetup } from "@/lib/vigil/actions/onboarding";
import { REGISTRAR_GUIDES } from "@/lib/vigil/domain-guides";
import { domainSchema, type DomainAnswers, type RegistrarKey } from "@/lib/vigil/onboarding/brief";
import { ChoiceCards, Field, StepFooter, TextInput, Toggle, useAutosave, VirtueAside, type SaveState } from "../wizard-ui";

type Props = {
  initial: DomainAnswers | undefined;
  projectId: string;
  businessName: string;
  domain: DomainSetup | null;
  onDomain: (d: DomainSetup | null) => void;
  canManage: boolean;
  save: (data: DomainAnswers, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};

type Phase = "ask" | "hostname" | "guide";

/**
 * The domain step. Three answers, each ending somewhere useful:
 *   own    → hostname → registrar (guessed from nameservers) → walkthrough → "I've added the records"
 *   need   → buy-it-yourself guide; "I bought it" hands straight into the own path above
 *   unsure → one paragraph, then the same two paths
 * Nothing here is a dead end; "Do this later" keeps the same guide on the Domain page.
 */
export function DomainStep({ initial, projectId, businessName, domain, onDomain, canManage, save, onSaveState, onBack, onNext }: Props) {
  const [data, setData] = useState<DomainAnswers>(() => initial ?? domainSchema.parse({}));
  const [phase, setPhase] = useState<Phase>(() => (initial?.answer === "own" && domain ? "guide" : initial?.answer === "own" ? "hostname" : "ask"));
  const [hostname, setHostname] = useState(initial?.hostname ?? "");
  const [registrar, setRegistrar] = useState<RegistrarKey | null>(initial?.registrar ?? null);
  const [guessed, setGuessed] = useState<RegistrarKey | null>(null);
  const [working, setWorking] = useState<null | "guess" | "start" | "confirm">(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { state, flush } = useAutosave(data, (v) => save(v));
  useEffect(() => onSaveState(state), [state, onSaveState]);
  const set = <K extends keyof DomainAnswers>(k: K, v: DomainAnswers[K]) => setData((d) => ({ ...d, [k]: v }));

  // While the domain is verifying, refresh its state every 20 s.
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!domain || domain.status !== "verifying") return;
    pollRef.current = window.setInterval(async () => {
      const res = await getDomainSetup(domain.domainId, registrar ?? "other");
      if (res.ok) onDomain(res.data);
    }, 20_000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [domain, registrar, onDomain]);

  const lookUp = async () => {
    setError(null);
    if (!hostname.trim()) { setError("Enter your domain, like yourbusiness.com."); return; }
    setWorking("guess");
    const res = await guessRegistrar(hostname);
    setWorking(null);
    if (!res.ok) { setError(res.error); return; }
    setGuessed(res.data.registrar);
    setRegistrar(res.data.registrar ?? "other");
  };

  const showSteps = async () => {
    setError(null);
    setWorking("start");
    const res = await startOnboardingDomain(projectId, { hostname, registrar });
    setWorking(null);
    if (!res.ok) { setError(res.error); return; }
    onDomain(res.data);
    setData((d) => ({ ...d, answer: "own", hostname: res.data.hostname, registrar: res.data.registrar, domainId: res.data.domainId, later: false }));
    setPhase("guide");
  };

  const confirm = async () => {
    if (!domain) return;
    setError(null);
    setWorking("confirm");
    const res = await confirmDnsAdded(domain.domainId, registrar ?? domain.registrar);
    setWorking(null);
    if (!res.ok) { setError(res.error); return; }
    onDomain(res.data);
  };

  const continueNext = async (patch: Partial<DomainAnswers> = {}) => {
    setBusy(true);
    const merged = { ...data, ...patch };
    setData(merged);
    const ok = await flush();
    const done = ok && (await save(merged, true));
    setBusy(false);
    if (done) onNext();
  };

  const answered = data.answer;

  return (
    <div className="space-y-5">
      {/* 1. The question */}
      {phase === "ask" || !answered ? (
        <div>
          <p className="mb-2 text-[13px] font-medium">Do you already have a domain, like {businessName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "yourbusiness"}.com?</p>
          <ChoiceCards
            name="Domain"
            value={answered}
            onChange={(v) => {
              set("answer", v);
              if (v === "own") setPhase("hostname");
              else setPhase("ask");
            }}
            options={[
              { value: "own", label: "Yes, I own one", hint: "Save it now. DNS setup starts after your preview is ready." },
              { value: "need", label: "No, I need one", hint: "Takes a few minutes; we'll show you how." },
              { value: "unsure", label: "Not sure", hint: "Takes ten seconds to work out." },
            ]}
          />
        </div>
      ) : null}

      {/* unsure */}
      {answered === "unsure" && phase === "ask" ? (
        <div className="space-y-3">
          <VirtueAside>
            A domain is your web address, the thing people type in, like <b>{businessName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "yourbusiness"}.com</b>. If you have ever paid a yearly fee for one, often to GoDaddy, Namecheap, Wix, Squarespace or whoever built your old site, you own one. Search your email for &ldquo;domain&rdquo; or &ldquo;renewal&rdquo; and you will find it.
          </VirtueAside>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { set("answer", "own"); setPhase("hostname"); }} className="btn-secondary min-h-11 !px-4 !py-2 text-sm">Found it, I own one</button>
            <button type="button" onClick={() => set("answer", "need")} className="btn-secondary min-h-11 !px-4 !py-2 text-sm">I don&apos;t have one</button>
          </div>
          <StepFooter onBack={onBack} onNext={() => continueNext()} nextLabel="Decide later" busy={busy} />
        </div>
      ) : null}

      {/* need */}
      {answered === "need" && phase === "ask" ? (
        <div className="space-y-4">
          <VirtueAside>
            No problem, buying one yourself is quick, and it means the domain is registered in <b>your</b> name from day one.
          </VirtueAside>
          <div className="rounded-lg border border-[color:var(--border)] p-4 text-[13px] leading-6">
            <p className="font-semibold">How to buy a domain</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[color:var(--text-secondary)]">
              <li>Pick a registrar, Namecheap or GoDaddy both work well.</li>
              <li>Search for the name you want, like {businessName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "yourbusiness"}.com, and buy it. Expect roughly $12&ndash;20 a year; skip the extra add-ons they try to sell you.</li>
              <li>Come back here and enter it, we&apos;ll walk you through connecting it to your site.</li>
            </ol>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-[12px] leading-5 text-[color:var(--text-secondary)]">
            <span>Confused, or would rather we just handle it?</span>
            <CalendlyPopup className="btn-secondary min-h-9 !px-3 !py-1.5 text-xs">Book a call</CalendlyPopup>
            <a href="mailto:hello@vigilstudios.co" className="underline">Email hello@vigilstudios.co</a>
          </div>
          <button type="button" onClick={() => { set("answer", "own"); setPhase("hostname"); }} className="btn-primary min-h-11 !px-4 !py-2 text-sm">
            I bought it, connect it now
          </button>
          <StepFooter onBack={() => { set("answer", null); setPhase("ask"); }} onNext={() => continueNext()} nextLabel="I'll buy it later" busy={busy} />
        </div>
      ) : null}

      {/* own: hostname + registrar */}
      {answered === "own" && phase === "hostname" ? (
        <div className="space-y-4">
          <Field id="hostname" label="Your domain" hint="Just the name, without www or https://" error={error}>
            <div className="flex gap-2">
              <TextInput id="hostname" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="yourbusiness.com" value={hostname} onChange={(e) => { setHostname(e.target.value); setGuessed(null); }} onKeyDown={(e) => { if (e.key === "Enter") void lookUp(); }} />
              <button type="button" onClick={lookUp} disabled={working === "guess" || !hostname.trim()} className="btn-secondary min-h-11 shrink-0 !px-4 !py-2 text-sm disabled:opacity-60">
                {working === "guess" ? "Looking…" : "Look it up"}
              </button>
            </div>
          </Field>
          {working === "guess" ? <VirtueAside state="working">Checking where {hostname.trim()} is managed…</VirtueAside> : null}
          {registrar && working !== "guess" ? (
            <div className="space-y-3">
              <VirtueAside state="done">
                {guessed ? (
                  <>Looks like it is managed at <b>{REGISTRAR_GUIDES[guessed].name}</b>. If that is wrong, change it below.</>
                ) : (
                  <>I could not tell where it is managed from here. Pick the company you pay for the domain, or &ldquo;Somewhere else&rdquo; and I will give general steps.</>
                )}
              </VirtueAside>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-[color:var(--text-secondary)]">Managed at</span>
                <select value={registrar} onChange={(e) => setRegistrar(e.target.value as RegistrarKey)} className="min-h-11 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 text-[13px]">
                  {Object.values(REGISTRAR_GUIDES).map((g) => (
                    <option key={g.key} value={g.key}>{g.name}</option>
                  ))}
                </select>
              </label>
              {canManage ? (
                <button type="button" onClick={showSteps} disabled={working === "start"} className="btn-primary min-h-11 !px-5 !py-2.5 text-sm disabled:opacity-60">
                  {working === "start" ? "Saving…" : "Save my domain"}
                </button>
              ) : (
                <p className="text-xs text-[color:var(--text-secondary)]">Only the account owner or a manager can connect a domain. Ask them to sign in, or choose &ldquo;Do this later&rdquo;.</p>
              )}
            </div>
          ) : null}
          <StepFooter onBack={() => { set("answer", null); setPhase("ask"); }} laterHref={null} />
        </div>
      ) : null}

      {/* own: the guide */}
      {answered === "own" && phase === "guide" && domain ? (
        <div className="space-y-4">
          <DomainGuide
            domain={domain}
            registrar={registrar ?? domain.registrar}
            onRegistrarChange={(r) => { setRegistrar(r); set("registrar", r); }}
            onConfirm={canManage ? confirm : undefined}
            confirming={working === "confirm"}
          />
          {error ? <p role="alert" className="text-xs text-[color:var(--status-bad)]">{error}</p> : null}
          <div className="rounded-lg border border-[color:var(--border)] p-3">
            <Toggle id="delegate" checked={data.delegate} onChange={(v) => set("delegate", v)} label="Prefer we do it? Ask Vigil to make these changes for you" />
            {data.delegate ? (
              <p className="mt-1 text-[11px] leading-5 text-[color:var(--text-secondary)]">
                Noted. After you send the brief, the team will reply with instructions for temporary delegated access at {REGISTRAR_GUIDES[registrar ?? "other"].name}. Never send us your password or a domain transfer code. We will preserve your email records, make the website cutover only when the new site is ready, then remove our access.
              </p>
            ) : null}
          </div>
          <StepFooter
            onBack={() => setPhase("hostname")}
            onNext={() => continueNext({ later: domain.status === "pending" && !data.delegate })}
            nextLabel="Continue onboarding"
            busy={busy}
            laterHref={null}
          />
        </div>
      ) : null}

      {phase === "ask" && !answered ? <StepFooter onBack={onBack} /> : null}
    </div>
  );
}
