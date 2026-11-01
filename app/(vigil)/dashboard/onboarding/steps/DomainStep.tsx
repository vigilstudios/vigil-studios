"use client";

import { useEffect, useState } from "react";
import { AuthorizedExistingDomain } from "@/components/vigil/domain-engine/CloudflareDomainConnection";
import { DomainWorkspace } from "@/components/vigil/domain-engine/DomainWorkspace";
import { DomainJourney } from "@/components/vigil/DomainJourney";
import type { DomainIntent } from "@/lib/vigil/domain-commerce";
import { DomainGuide } from "@/components/vigil/DomainGuide";
import { guideOutcome } from "@/lib/vigil/domain-guide-flow";
import {
  confirmDnsAdded,
  getDomainSetup,
  guessRegistrar,
  startOnboardingDomain,
  type DomainSetup,
} from "@/lib/vigil/actions/onboarding";
import { REGISTRAR_OPTIONS } from "@/lib/vigil/domain-guides";
import {
  domainSchema,
  type DomainAnswers,
  type RegistrarKey,
} from "@/lib/vigil/onboarding/brief";
import { Field, TextInput, useAutosave, type SaveState } from "../wizard-ui";
import { ArrowRight, Search, Link2, CircleHelp, Globe2 } from "lucide-react";
import {
  DomainIntro,
  DomainSectionHeading,
} from "@/components/vigil/domain-engine/DomainSetupUI";
import styles from "@/components/vigil/domain-engine/domain-workspace.module.css";
import { inputClass } from "@/components/vigil/ui";

type Props = {
  managedDomain?: boolean;
  cloudflareConnectionEnabled?: boolean;
  discoveryOnly?: boolean;
  liveDomainEnabled?: boolean;
  domainLiveKey?: string;
  canPurchase?: boolean;
  initial: DomainAnswers | undefined;
  projectId: string;
  websiteId: string | null;
  initialIntent: DomainIntent | null;
  businessName: string;
  domain: DomainSetup | null;
  onDomain: (d: DomainSetup | null) => void;
  canManage: boolean;
  save: (data: DomainAnswers, completed?: boolean) => Promise<boolean>;
  onSaveState: (s: SaveState) => void;
  onBack: () => void;
  onNext: () => void;
};
type Phase = "ask" | "unsure" | "search" | "hostname" | "provider" | "guide";

/** Each branch occupies one screen; the shared DNS guide handles its own individual tasks. */
export function DomainStep({
  managedDomain = false,
  cloudflareConnectionEnabled = false,
  discoveryOnly = false,
  liveDomainEnabled = false,
  domainLiveKey = "",
  canPurchase = false,
  initial,
  projectId,
  websiteId,
  initialIntent,
  businessName,
  domain,
  onDomain,
  canManage,
  save,
  onSaveState,
  onBack,
  onNext,
}: Props) {
  const [data, setData] = useState<DomainAnswers>(() =>
    domain && canManage
      ? {
          ...(initial ?? domainSchema.parse({})),
          answer: "own",
          hostname: domain.hostname,
          domainId: domain.domainId,
          registrar: domain.registrar,
        }
      : (initial ?? domainSchema.parse({})),
  );
  const [phase, setPhase] = useState<Phase>(() =>
    managedDomain && liveDomainEnabled
      ? "search"
      : domain
        ? "guide"
        : initial?.answer === "own"
          ? "hostname"
          : initial?.answer === "need" ||
              (initialIntent && initialIntent.phase !== "cancelled")
            ? "search"
            : "ask",
  );
  const [hostname, setHostname] = useState(initial?.hostname ?? "");
  const [registrar, setRegistrar] = useState<RegistrarKey>(
    domain?.registrar ?? initial?.registrar ?? "other",
  );
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, flush } = useAutosave(data, (value) => save(value));
  useEffect(() => onSaveState(state), [state, onSaveState]);
  const pollingDomainId = domain?.domainId;
  const pollingStatus = domain?.status;
  useEffect(() => {
    if (!pollingDomainId || pollingStatus === "connected") return;
    let active = true;
    let inFlight = false;
    const timer = window.setInterval(async () => {
      if (
        inFlight ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
      )
        return;
      inFlight = true;
      try {
        const result = await getDomainSetup(pollingDomainId, registrar);
        if (active && result.ok) onDomain(result.data);
      } catch {
        /* Retry on the next visible poll. */
      } finally {
        inFlight = false;
      }
    }, 20_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pollingDomainId, pollingStatus, registrar, onDomain]);
  const run = async (work: () => Promise<void>) => {
    setWorking(true);
    setError(null);
    try {
      await work();
    } catch {
      setError("This step could not finish. Please try again.");
    } finally {
      setWorking(false);
    }
  };
  const finish = (later: boolean) =>
    run(async () => {
      const next = { ...data, later };
      setData(next);
      if ((await flush()) && (await save(next, true))) onNext();
    });
  const choose = (answer: "own" | "need" | "unsure") => {
    setData((current) => ({ ...current, answer }));
    setPhase(
      answer === "own" ? "hostname" : answer === "need" ? "search" : "unsure",
    );
  };
  return (
    <div className={`${styles.workspace} space-y-5`}>
      {phase === "ask" ? (
        <>
          <DomainIntro heading="Give your website an address" />
          <div className={styles.choices}>
            <button
              type="button"
              className={styles.choice}
              onClick={() => choose("need")}
            >
              <span className={styles.icon}>
                <Search size={22} aria-hidden="true" />
              </span>
              <h3>Find a new address</h3>
              <p>
                {liveDomainEnabled
                  ? "Choose your name. Register and pay right here in Vigil."
                  : "Find your name. We’ll guide you through buying it with Vercel."}
              </p>
              <span className={styles.link}>
                Find my address
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
            <button
              type="button"
              className={styles.choice}
              onClick={() => choose("own")}
            >
              <span className={styles.icon}>
                <Link2 size={22} aria-hidden="true" />
              </span>
              <h3>Use an address I own</h3>
              <p>
                Keep your domain with your provider. We’ll help connect it to
                your website.
              </p>
              <span className={styles.link}>
                Use my address
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
          </div>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => choose("unsure")}
          >
            <CircleHelp size={15} aria-hidden="true" />
            I’m not sure if I have one
          </button>
        </>
      ) : phase === "unsure" ? (
        <>
          <DomainSectionHeading
            icon={CircleHelp}
            title="Have you bought a web address before?"
          />
          <p className="text-sm text-[color:var(--text-secondary)]">
            A domain is an address like yourbusiness.com. Search your email for
            a domain purchase or renewal receipt.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={styles.secondary}
              onClick={() => choose("own")}
            >
              Yes, I found mine
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => choose("need")}
            >
              I need a new one
            </button>
          </div>
        </>
      ) : phase === "search" ? (
        websiteId ? (
          liveDomainEnabled ? (
            <DomainWorkspace
              live
              discoveryOnly={managedDomain ? false : discoveryOnly}
              websiteId={websiteId}
              initialScreen="search"
              publishableTestKey={domainLiveKey}
              testWebsites={[{ id: websiteId, label: businessName }]}
              canManage={canPurchase}
            />
          ) : (
            <DomainJourney
              websiteId={websiteId}
              initial={initialIntent}
              canManage={canManage}
            />
          )
        ) : (
          <p>
            Domain search is being prepared. You can continue onboarding and
            return later.
          </p>
        )
      ) : phase === "hostname" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const result = await guessRegistrar(hostname);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setRegistrar(result.data.registrar ?? "other");
              setPhase("provider");
            });
          }}
        >
          <DomainSectionHeading
            icon={Link2}
            title="What’s your website address?"
          >
            Enter the address you own. We’ll help with the connection.
          </DomainSectionHeading>
          <Field
            id="onboarding-domain"
            label="Your domain"
            hint="For example, yourbusiness.com. A social media username is different."
          >
            <TextInput
              id="onboarding-domain"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourbusiness.com"
              value={hostname}
              onChange={(event) => setHostname(event.target.value)}
              disabled={working}
            />
          </Field>
          <button
            type="submit"
            className={styles.primary}
            disabled={working || !hostname.trim()}
          >
            {working ? "Checking…" : "Continue"}
          </button>
        </form>
      ) : phase === "provider" ? (
        <div className="space-y-4">
          <DomainSectionHeading
            icon={Globe2}
            title={`Where do you manage ${hostname}?`}
          >
            Choose the company you bought your address from. If you’re unsure,
            check a purchase or renewal email.
          </DomainSectionHeading>
          <label className="block space-y-2 text-sm">
            <span>Domain provider</span>
            <select
              className={inputClass}
              value={registrar}
              onChange={(event) =>
                setRegistrar(event.target.value as RegistrarKey)
              }
            >
              {REGISTRAR_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          {canManage ? (
            <button
              type="button"
              className={styles.primary}
              disabled={working}
              onClick={() =>
                void run(async () => {
                  const result = await startOnboardingDomain(projectId, {
                    hostname,
                    registrar,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  onDomain(result.data);
                  setData((current) => ({
                    ...current,
                    answer: "own",
                    hostname: result.data.hostname,
                    registrar,
                    domainId: result.data.domainId,
                    later: false,
                  }));
                  setPhase("guide");
                })
              }
            >
              {working ? "Saving…" : "Continue to guide"}
            </button>
          ) : (
            <p className="text-sm">
              A customer owner or manager can save the domain.
            </p>
          )}
        </div>
      ) : domain ? (
        <>
          <ExistingConnection
            enabled={cloudflareConnectionEnabled && canPurchase}
            domainId={domain.domainId}
          >
            <DomainGuide
              domain={domain}
              registrar={registrar}
              afterPurchase={Boolean(
                initialIntent &&
                  initialIntent.phase !== "cancelled" &&
                  initialIntent.websiteId === websiteId &&
                  initialIntent.hostname === domain.hostname &&
                  registrar === "vercel",
              )}
              onConfirm={
                canManage
                  ? () =>
                      void run(async () => {
                        const result = await confirmDnsAdded(
                          domain.domainId,
                          registrar,
                        );
                        if (result.ok) onDomain(result.data);
                        else setError(result.error);
                      })
                  : undefined
              }
              onRefresh={() =>
                void run(async () => {
                  const result = await getDomainSetup(
                    domain.domainId,
                    registrar,
                  );
                  if (result.ok) onDomain(result.data);
                  else setError(result.error);
                })
              }
              confirming={working}
            />
          </ExistingConnection>
          {guideOutcome(domain) ? (
            <button
              type="button"
              className={styles.primary}
              disabled={working}
              onClick={() => void finish(guideOutcome(domain) !== "connected")}
            >
              {guideOutcome(domain) === "connected"
                ? "Continue onboarding"
                : "Continue onboarding · finish domain setup later"}
            </button>
          ) : null}
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[color:var(--status-bad)]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-5 border-t border-[color:var(--border)] pt-3 text-sm text-[color:var(--text-secondary)]">
        <button
          type="button"
          className="min-h-11"
          disabled={working}
          onClick={() =>
            phase === "ask"
              ? onBack()
              : setPhase(phase === "provider" ? "hostname" : "ask")
          }
        >
          {phase === "guide" ? "All domain options" : "Back"}
        </button>
        {phase !== "guide" || !domain || !guideOutcome(domain) ? (
          <button
            type="button"
            className="min-h-11 underline"
            disabled={working}
            onClick={() => void finish(true)}
          >
            Do this later
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ExistingConnection({
  enabled,
  domainId,
  children,
}: {
  enabled: boolean;
  domainId: string;
  children: import("react").ReactNode;
}) {
  return enabled ? (
    <AuthorizedExistingDomain domainId={domainId}>
      {children}
    </AuthorizedExistingDomain>
  ) : (
    children
  );
}
