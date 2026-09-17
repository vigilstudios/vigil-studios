"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
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
 * lifts the overlay for this project (the same cookie as "Do this later").
 */
export function VirtueWelcome({ projectId, lines, linesAfterPassword, passwordLines, needsPassword }: { projectId: string; lines: SpeechLine[]; /** The welcome when it follows the password step. */ linesAfterPassword: SpeechLine[]; /** Spoken before the password form when the account has none yet. */ passwordLines: SpeechLine[]; needsPassword: boolean }) {
  const router = useRouter();
  const portalHost = useSyncExternalStore(noop, getBody, getServerBody);
  const orbControls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const orbHost = useRef<HTMLDivElement | null>(null);
  const entered = useRef(false);
  const speech = useSpeaking();
  const [spoken, setSpoken] = useState(false);
  // Stage 1 (when needed): choose a password. Stage 2: the welcome and "Let's begin".
  // Decided once on mount so a refresh after saving the password does not restart the words.
  const [askedPassword] = useState(needsPassword);
  const [stage, setStage] = useState<"password" | "welcome">(needsPassword ? "password" : "welcome");
  const welcomeLines = askedPassword ? linesAfterPassword : lines;
  const [passwordDone, setPasswordDone] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [departure, setDeparture] = useState<"onboarding" | "dock" | null>(null);
  const [hidden, setHidden] = useState(false);
  const [pending, start] = useTransition();

  useLayoutEffect(() => {
    if (!portalHost || !orbHost.current || entered.current) return;
    entered.current = true;
    if (reduceMotion) {
      orbControls.set({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
      const frame = window.requestAnimationFrame(() => setArrived(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const offset = dockOffset(orbHost.current);
    orbControls.set({ x: offset.x, y: offset.y, scale: 0.28, rotate: -10, opacity: 1 });
    void orbControls.start({
      x: [offset.x, offset.x * 0.46, 0],
      y: [offset.y, offset.y * 0.72, 0],
      scale: [0.28, 0.58, 1],
      rotate: [-10, 3, 0],
      opacity: 1,
      transition: { duration: 1.05, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] },
    }).then(() => setArrived(true));
  }, [orbControls, portalHost, reduceMotion]);

  const begin = () =>
    start(async () => {
      setDeparture("onboarding");
      await Promise.all([
        markStep(projectId, "basics"),
        reduceMotion
          ? Promise.resolve()
          : orbControls.start({ opacity: 0, scale: 0.9, transition: { duration: 0.28, ease: "easeOut" } }),
      ]);
      router.push("/dashboard/onboarding?step=basics");
    });

  const later = () =>
    start(async () => {
      setDeparture("dock");
      const save = fetch(`${ONBOARDING_LATER_HREF}?project=${encodeURIComponent(projectId)}`, { method: "GET", redirect: "manual" }).catch(() => undefined);
      if (reduceMotion || !orbHost.current) {
        await save;
      } else {
        const offset = dockOffset(orbHost.current);
        await Promise.all([
          save,
          orbControls.start({
            x: [0, offset.x * 0.34, offset.x],
            y: [0, offset.y * 0.58, offset.y],
            scale: [1, 0.64, 0.28],
            rotate: [0, 3, -8],
            opacity: 1,
            transition: { duration: 0.9, times: [0, 0.48, 1], ease: [0.65, 0, 0.35, 1] },
          }),
        ]);
      }
      setHidden(true);
      router.refresh();
    });

  if (hidden || !portalHost) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] h-dvh min-h-[100svh] w-screen overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome from Virtue"
    >
      <motion.div
        className="pointer-events-none fixed inset-0 bg-[color:var(--bg-primary)]/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: departure ? 0 : 1 }}
        transition={{ duration: departure === "dock" ? 0.85 : 0.45, delay: departure === "dock" ? 0.12 : 0 }}
      />
      <div className="flex min-h-full w-full items-center justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex w-full max-w-xl flex-col items-center">
          <motion.div ref={orbHost} animate={orbControls} initial={{ opacity: 0 }} className="relative z-10">
            <VirtueOrb size="xl" state={speech.speaking ? "talking" : "idle"} />
          </motion.div>
          <motion.div
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: arrived && !departure ? 1 : 0, y: arrived && !departure ? 0 : 12 }}
            transition={{ duration: departure ? 0.25 : 0.55, ease: "easeOut" }}
          >
            <div className="mt-8 min-h-[7rem] w-full">
              {arrived ? <VirtueSpeech key={stage} lines={stage === "password" ? passwordLines : welcomeLines} onStart={speech.onStart} onDone={() => { speech.onDone(); setSpoken(true); }} /> : null}
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
          </motion.div>
        </div>
      </div>
    </div>,
    portalHost
  );
}

const noop = () => () => {};
const getBody = () => document.body;
const getServerBody = () => null;

function dockOffset(orb: HTMLDivElement): { x: number; y: number } {
  const orbRect = orb.getBoundingClientRect();
  const dock = document.querySelector<HTMLElement>('[data-virtue-dock="customer"]');
  const dockRect = dock?.getBoundingClientRect();
  const dockX = dockRect && dockRect.width > 0 ? dockRect.left + dockRect.width / 2 : window.innerWidth - (window.innerWidth >= 640 ? 56 : 48);
  const dockY = dockRect && dockRect.height > 0 ? dockRect.top + dockRect.height / 2 : window.innerHeight - (window.innerWidth >= 640 ? 56 : 48);
  return {
    x: dockX - (orbRect.left + orbRect.width / 2),
    y: dockY - (orbRect.top + orbRect.height / 2),
  };
}
