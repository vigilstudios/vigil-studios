"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { BriefSummary } from "@/components/vigil/BriefSummary";
import { saveBriefSection, markStep, submitIntake, type DomainSetup } from "@/lib/vigil/actions/onboarding";
import { briefCompletion, stepsForProjectKind, type Brief, type ProjectKind, type SectionKey, type StepKey } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { afterSendLine, STEP_TITLES, VIRTUE_NOTE, virtueLine } from "@/lib/vigil/onboarding/virtue-copy";
import { SaveIndicator, VirtueSays, type SaveState } from "./wizard-ui";
import { VirtueSpeech, useSpeaking } from "@/components/vigil/VirtueSpeech";
import { BasicsStep } from "./steps/BasicsStep";
import { KickoffStep } from "./steps/KickoffStep";
import { StrategyStep } from "./steps/StrategyStep";
import { OfferingsStep } from "./steps/OfferingsStep";
import { AboutStep } from "./steps/AboutStep";
import { BrandStep } from "./steps/BrandStep";
import { DomainStep } from "./steps/DomainStep";
import { ReviewStep } from "./steps/ReviewStep";

export type WizardProps = {
  projectId: string;
  projectKind: ProjectKind;
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

export function OnboardingWizard(props: WizardProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(props.initialBrief);
  const [step, setStep] = useState<StepKey>(props.completedAt ? "review" : props.initialStep === "welcome" ? "basics" : props.initialStep);
  const [assets, setAssets] = useState<SignedAsset[]>(props.initialAssets);
  const [domain, setDomain] = useState<DomainSetup | null>(props.initialDomain);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [sentAt, setSentAt] = useState<string | null>(props.completedAt);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const locked = Boolean(sentAt);
  const businessName = brief.basics?.businessName || props.businessName;
  const steps: StepKey[] = stepsForProjectKind(props.projectKind).filter((key) => key !== "welcome") as StepKey[];

  const go = useCallback(
    (next: StepKey) => {
      setStep(next);
      window.history.replaceState(null, "", `/dashboard/onboarding?step=${next}`);
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      if (!locked && next === "review") void markStep(props.projectId, next);
    },
    [props.projectId, locked]
  );

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

  const next = (from: StepKey) => steps[Math.min(steps.length - 1, steps.indexOf(from) + 1)];
  const prev = (from: StepKey) => steps[Math.max(0, steps.indexOf(from) - 1)];

  const send = () =>
    startSending(async () => {
      setSendError(null);
      const res = await submitIntake(props.projectId);
      if (res.ok) {
        setSentAt(res.data.completedAt);
        router.refresh();
      } else setSendError(res.error);
    });

  if (sentAt) return <SentView brief={brief} assets={assets} domain={domain} projectKind={props.projectKind} />;

  const line = virtueLine(step, { firstName: props.firstName, businessName, noun: brief.offerings?.noun === "menu" ? "menu items" : brief.offerings?.noun === "products" ? "products" : "services" });
  const completion = briefCompletion(brief, props.projectKind);
  const doneKeys = new Set(completion.filter((c) => c.done).map((c) => c.key as StepKey));
  const currentIdx = steps.indexOf(step);

  const stepNav = (orientation: "row" | "column") => (
    <ol className={clsx("flex", orientation === "row" ? "gap-1 overflow-x-auto" : "flex-col gap-0.5")}>
      {steps.map((k, i) => {
        const done = doneKeys.has(k);
        const current = k === step;
        const reachable = done || i <= currentIdx || k === "review";
        return (
          <li key={k} className="shrink-0">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => go(k)}
              aria-current={current ? "step" : undefined}
              className={clsx(
                "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors",
                orientation === "column" && "w-full",
                current ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] font-semibold text-[color:var(--text-primary)]" : reachable ? "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)] opacity-50"
              )}
            >
              <span className={clsx("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold", current ? "border-[color:var(--accent)] text-[color:var(--accent)]" : done ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : "border-[color:var(--border)]")}>
                {done && !current ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{STEP_TITLES[k]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
      {/* Virtue and the journey: a fixed rail on the left on desktop; on phones the
          step strip sticks to the top of the scrolling form. */}
      <aside className="lg:sticky lg:top-0 lg:self-start">
        <div className="lg:pt-2">
          <VirtueSays key={step} line={line} state={saveState === "saving" ? "thinking" : "idle"} />
        </div>
        <nav aria-label="Steps" className="mt-6 hidden lg:block">
          {stepNav("column")}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-[color:var(--text-secondary)]">Step {currentIdx + 1} of {steps.length}</span>
            <SaveIndicator state={saveState} />
          </div>
        </nav>
        <div className="mt-6 hidden items-start gap-1.5 text-[11px] leading-4 text-[color:var(--text-secondary)] lg:flex">
          <VirtueOrb size="xs" label="" className="mt-0.5" /> <span>{VIRTUE_NOTE}</span>
        </div>
      </aside>

      <section className="min-w-0">
        <nav aria-label="Steps" className="sticky top-0 z-10 -mx-3 mt-4 border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]/90 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:hidden">
          {stepNav("row")}
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[11px] text-[color:var(--text-secondary)]">Step {currentIdx + 1} of {steps.length}</span>
            <SaveIndicator state={saveState} />
          </div>
        </nav>
        <h1 className="mt-5 text-lg font-semibold tracking-tight sm:text-xl lg:mt-0">{STEP_TITLES[step]}</h1>
        <div className="mt-5 max-w-3xl">
          {step === "basics" ? (
            <BasicsStep key="basics" initial={brief.basics} businessName={businessName} save={(d, c) => saveSection("basics", d, c)} onSaveState={setSaveState} onBack={() => router.push("/dashboard")} onNext={() => go(next("basics"))} />
          ) : step === "kickoff" ? (
            <KickoffStep key="kickoff" initial={brief.kickoff} save={(d, c) => saveSection("kickoff", d, c)} onSaveState={setSaveState} onBack={() => go(prev("kickoff"))} onNext={() => go(next("kickoff"))} onFinishWithCall={send} />
          ) : step === "strategy" ? (
            <StrategyStep key="strategy" initial={brief.strategy} save={(d, c) => saveSection("strategy", d, c)} onSaveState={setSaveState} onBack={() => go(prev("strategy"))} onNext={() => go(next("strategy"))} />
          ) : step === "offerings" ? (
            <OfferingsStep key="offerings" initial={brief.offerings} save={(d, c) => saveSection("offerings", d, c)} onSaveState={setSaveState} onBack={() => go(prev("offerings"))} onNext={() => go(next("offerings"))} />
          ) : step === "about" ? (
            <AboutStep key="about" initial={brief.about} businessName={businessName} save={(d, c) => saveSection("about", d, c)} onSaveState={setSaveState} onBack={() => go(prev("about"))} onNext={() => go(next("about"))} />
          ) : step === "brand" ? (
            <BrandStep key="brand" initial={brief.brand} projectKind={props.projectKind} projectId={props.projectId} organizationId={props.organizationId} assets={assets} onAssets={setAssets} save={(d, c) => saveSection("brand", d, c)} onSaveState={setSaveState} onBack={() => go(prev("brand"))} onNext={() => go(next("brand"))} />
          ) : step === "domain" ? (
            <DomainStep key="domain" initial={brief.domain} projectId={props.projectId} businessName={businessName} domain={domain} onDomain={setDomain} canManage={props.canManageDomain} save={(d, c) => saveSection("domain", d, c)} onSaveState={setSaveState} onBack={() => go(prev("domain"))} onNext={() => go(next("domain"))} />
          ) : (
            <ReviewStep key="review" brief={brief} projectKind={props.projectKind} assets={assets} domain={domain} onEdit={(s) => go(s)} onSend={send} sending={sending} error={sendError} onBack={() => go(prev("review"))} />
          )}
        </div>
      </section>
    </div>
  );
}

/** After sending: Virtue, centred, says what happens next. */
function SentView({ brief, assets, domain, projectKind }: { brief: Brief; assets: SignedAsset[]; domain: DomainSetup | null; projectKind: ProjectKind }) {
  const speech = useSpeaking();
  const [spoken, setSpoken] = useState(false);
  const sentLine = afterSendLine(projectKind, brief.kickoff?.mode);
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-6">
      <VirtueOrb size="xl" state={speech.speaking ? "talking" : "idle"} />
      <div className="mt-8 min-h-[6rem] w-full">
        <VirtueSpeech lines={[{ text: sentLine.title, emphasis: true }, { text: sentLine.body }]} onStart={speech.onStart} onDone={() => { speech.onDone(); setSpoken(true); }} />
      </div>
      <div className={clsx("mt-6 flex flex-wrap justify-center gap-3 transition-opacity duration-700", spoken ? "opacity-100" : "opacity-0")}>
        <Link href="/dashboard" className="btn-primary min-h-11 !px-5 !py-2.5 text-sm">Go to my dashboard</Link>
        {brief.domain?.answer === "own" && domain && domain.status !== "connected" ? (
          <Link href="/dashboard/domain" className="btn-secondary min-h-11 !px-5 !py-2.5 text-sm">View domain status</Link>
        ) : null}
      </div>
      <p className="mt-6 max-w-sm text-center text-[11px] text-[color:var(--text-secondary)]">{VIRTUE_NOTE}</p>
      <details className="mt-8 w-full rounded-xl border border-[color:var(--border)] p-4">
        <summary className="cursor-pointer text-[13px] font-semibold">What you sent</summary>
        <div className="mt-3">
          <BriefSummary brief={brief} projectKind={projectKind} assets={assets} domain={domain} />
        </div>
      </details>
    </div>
  );
}
