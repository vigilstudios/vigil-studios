"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { saveBriefSection, markStep, submitIntake, type DomainSetup } from "@/lib/vigil/actions/onboarding";
import { STEP_KEYS, stepIndex, type Brief, type SectionKey, type StepKey } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { AFTER_SEND, STEP_TITLES, VIRTUE_NOTE, virtueLine } from "@/lib/vigil/onboarding/virtue-copy";
import { ProgressBar, SaveIndicator, VirtueSays, type SaveState } from "./wizard-ui";
import { WelcomeStep } from "./steps/WelcomeStep";
import { BasicsStep } from "./steps/BasicsStep";
import { OfferingsStep } from "./steps/OfferingsStep";
import { AboutStep } from "./steps/AboutStep";
import { BrandStep } from "./steps/BrandStep";
import { DomainStep } from "./steps/DomainStep";
import { ReviewStep } from "./steps/ReviewStep";

export type WizardProps = {
  projectId: string;
  organizationId: string;
  businessName: string;
  firstName: string | null;
  initialBrief: Brief;
  initialStep: StepKey;
  initialAssets: SignedAsset[];
  initialDomain: DomainSetup | null;
  completedAt: string | null;
  canManageDomain: boolean;
};

/** Steps that count toward the progress bar (welcome is step 0). */
const COUNTED: StepKey[] = STEP_KEYS.filter((k) => k !== "welcome");

export function OnboardingWizard(props: WizardProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(props.initialBrief);
  const [step, setStep] = useState<StepKey>(props.completedAt ? "review" : props.initialStep);
  const [assets, setAssets] = useState<SignedAsset[]>(props.initialAssets);
  const [domain, setDomain] = useState<DomainSetup | null>(props.initialDomain);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [sentAt, setSentAt] = useState<string | null>(props.completedAt);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const locked = Boolean(sentAt);

  const businessName = brief.basics?.businessName || props.businessName;

  const go = useCallback(
    (next: StepKey) => {
      setStep(next);
      window.history.replaceState(null, "", `/dashboard/onboarding?step=${next}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      if (!locked && (next === "welcome" || next === "review")) void markStep(props.projectId, next);
    },
    [props.projectId, locked]
  );

  /** Persist one section; returns whether it saved. Used by every step's autosave. */
  const saveSection = useCallback(
    async (section: SectionKey, data: unknown, completed = false): Promise<boolean> => {
      if (locked) return true;
      const res = await saveBriefSection(props.projectId, section, data, completed);
      if (res.ok) {
        setBrief(res.data.brief);
        return true;
      }
      console.warn("autosave failed:", res.error);
      return false;
    },
    [props.projectId, locked]
  );

  const next = (from: StepKey) => STEP_KEYS[Math.min(STEP_KEYS.length - 1, stepIndex(from) + 1)];
  const prev = (from: StepKey) => STEP_KEYS[Math.max(0, stepIndex(from) - 1)];

  const send = () =>
    startSending(async () => {
      setSendError(null);
      const res = await submitIntake(props.projectId);
      if (res.ok) {
        setSentAt(res.data.completedAt);
        router.refresh();
      } else setSendError(res.error);
    });

  const line = virtueLine(step, { firstName: props.firstName, businessName, noun: brief.offerings?.noun === "menu" ? "menu items" : brief.offerings?.noun === "products" ? "products" : "services" });
  const counted = COUNTED.indexOf(step) + 1;

  if (sentAt) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 sm:p-8">
          <VirtueSays line={AFTER_SEND} state="done" size="lg" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary min-h-11 !px-5 !py-2.5 text-sm">Go to my dashboard</Link>
            {brief.domain?.answer === "own" && domain && domain.status !== "connected" ? (
              <Link href="/dashboard/domain" className="btn-secondary min-h-11 !px-5 !py-2.5 text-sm">Finish connecting my domain</Link>
            ) : null}
          </div>
          <p className="mt-6 text-[11px] text-[color:var(--text-secondary)]">{VIRTUE_NOTE}</p>
        </div>
        <details className="mt-4 rounded-xl border border-[color:var(--border)] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold">What you sent</summary>
          <div className="mt-3">
            <ReviewStep brief={brief} assets={assets} domain={domain} onEdit={() => undefined} onSend={() => undefined} sending={false} error={null} readOnly />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {step !== "welcome" ? (
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ProgressBar current={counted} total={COUNTED.length} label={STEP_TITLES[step]} />
          </div>
          <SaveIndicator state={saveState} />
        </div>
      ) : null}

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
        {step === "welcome" ? (
          <WelcomeStep line={line} businessName={businessName} onStart={() => go("basics")} />
        ) : (
          <>
            <VirtueSays line={line} state={saveState === "saving" ? "working" : "idle"} />
            <div className="mt-5">
              {step === "basics" ? (
                <BasicsStep key="basics" initial={brief.basics} businessName={businessName} save={(d, c) => saveSection("basics", d, c)} onSaveState={setSaveState} onBack={() => go("welcome")} onNext={() => go(next("basics"))} />
              ) : step === "offerings" ? (
                <OfferingsStep key="offerings" initial={brief.offerings} save={(d, c) => saveSection("offerings", d, c)} onSaveState={setSaveState} onBack={() => go(prev("offerings"))} onNext={() => go(next("offerings"))} />
              ) : step === "about" ? (
                <AboutStep key="about" initial={brief.about} businessName={businessName} save={(d, c) => saveSection("about", d, c)} onSaveState={setSaveState} onBack={() => go(prev("about"))} onNext={() => go(next("about"))} />
              ) : step === "brand" ? (
                <BrandStep key="brand" initial={brief.brand} projectId={props.projectId} organizationId={props.organizationId} assets={assets} onAssets={setAssets} save={(d, c) => saveSection("brand", d, c)} onSaveState={setSaveState} onBack={() => go(prev("brand"))} onNext={() => go(next("brand"))} />
              ) : step === "domain" ? (
                <DomainStep key="domain" initial={brief.domain} projectId={props.projectId} businessName={businessName} domain={domain} onDomain={setDomain} canManage={props.canManageDomain} save={(d, c) => saveSection("domain", d, c)} onSaveState={setSaveState} onBack={() => go(prev("domain"))} onNext={() => go(next("domain"))} />
              ) : (
                <ReviewStep key="review" brief={brief} assets={assets} domain={domain} onEdit={(s) => go(s)} onSend={send} sending={sending} error={sendError} onBack={() => go(prev("review"))} />
              )}
            </div>
          </>
        )}
      </div>

      {step === "welcome" ? null : (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[color:var(--text-secondary)]">
          <VirtueOrb size="sm" label="" className="!h-3.5 !w-3.5" /> {VIRTUE_NOTE}
        </p>
      )}
    </div>
  );
}
