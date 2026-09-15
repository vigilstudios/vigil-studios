"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { markStep } from "@/lib/vigil/actions/onboarding";
import { ONBOARDING_LATER_HREF } from "@/lib/vigil/onboarding/constants";
import type { SpeechLine } from "./VirtueSpeech";
import { PasswordForm } from "./PasswordForm";
import { VirtueOrb } from "./VirtueOrb";
import { VirtueSpeech, useSpeaking } from "./VirtueSpeech";

/**
 * First arrival on the dashboard: everything behind is dimmed and blurred,
 * Virtue is centred and speaks, then offers to begin. "Look around first"
 * lifts the overlay for a week (the same cookie as "Do this later").
 */
export function VirtueWelcome({ projectId, lines, linesAfterPassword, passwordLines, needsPassword }: { projectId: string; lines: SpeechLine[]; /** The welcome when it follows the password step. */ linesAfterPassword: SpeechLine[]; /** Spoken before the password form when the account has none yet. */ passwordLines: SpeechLine[]; needsPassword: boolean }) {
  const router = useRouter();
  const speech = useSpeaking();
  const [spoken, setSpoken] = useState(false);
  // Stage 1 (when needed): choose a password. Stage 2: the welcome and "Let's begin".
  // Decided once on mount so a refresh after saving the password does not restart the words.
  const [askedPassword] = useState(needsPassword);
  const [stage, setStage] = useState<"password" | "welcome">(needsPassword ? "password" : "welcome");
  const welcomeLines = askedPassword ? linesAfterPassword : lines;
  const [passwordDone, setPasswordDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pending, start] = useTransition();

  const begin = () =>
    start(async () => {
      setLeaving(true);
      await markStep(projectId, "basics");
      router.push("/dashboard/onboarding?step=basics");
    });

  const later = () =>
    start(async () => {
      setLeaving(true);
      await fetch(ONBOARDING_LATER_HREF, { method: "GET", redirect: "manual" }).catch(() => undefined);
      window.setTimeout(() => setHidden(true), 350);
      router.refresh();
    });

  if (hidden) return null;

  return (
    <div
      className={clsx("fixed inset-0 z-40 flex items-center justify-center bg-[color:var(--bg-primary)]/70 px-4 backdrop-blur-md transition-opacity duration-500", leaving ? "opacity-0" : "opacity-100")}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome from Virtue"
    >
      <div className="flex w-full max-w-xl flex-col items-center">
        <VirtueOrb size="xl" state={speech.speaking ? "talking" : "idle"} />
        <div className="mt-8 min-h-[7rem] w-full">
          <VirtueSpeech key={stage} lines={stage === "password" ? passwordLines : welcomeLines} onStart={speech.onStart} onDone={() => { speech.onDone(); setSpoken(true); }} />
        </div>
        {stage === "password" ? (
          <div className={clsx("mt-6 w-full max-w-md transition-opacity duration-700", spoken ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!spoken}>
            {passwordDone ? (
              <p className="text-center text-sm text-[color:var(--text-secondary)]">Saved.</p>
            ) : (
              <PasswordForm hasPassword={false} compact onSaved={() => { setPasswordDone(true); window.setTimeout(() => { setSpoken(false); setStage("welcome"); }, 600); }} />
            )}
          </div>
        ) : null}
        <div className={clsx("mt-8 flex w-full flex-col items-center gap-3 transition-opacity duration-700 sm:flex-row sm:justify-center", spoken && stage === "welcome" ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!(spoken && stage === "welcome")}>
          <button type="button" onClick={begin} disabled={pending} className="btn-primary min-h-12 w-full !px-6 text-sm sm:w-auto">
            Let&apos;s begin <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <button type="button" onClick={later} disabled={pending} className="min-h-12 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
            Look around the dashboard first
          </button>
        </div>
      </div>
    </div>
  );
}
