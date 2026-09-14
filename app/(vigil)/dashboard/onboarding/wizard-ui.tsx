"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { VirtueOrb, type VirtueOrbState } from "@/components/vigil/VirtueOrb";
import { inputClass, labelClass } from "@/components/vigil/ui";
import { ONBOARDING_LATER_HREF } from "@/lib/vigil/onboarding/constants";
import type { VirtueLine } from "@/lib/vigil/onboarding/virtue-copy";

/** Virtue's line at the top of a step: orb + title + body. */
export function VirtueSays({ line, state = "idle", size = "md" }: { line: VirtueLine; state?: VirtueOrbState; size?: "md" | "lg" }) {
  return (
    <div className={clsx("flex gap-3", size === "lg" ? "flex-col items-center text-center sm:flex-row sm:items-start sm:text-left" : "items-start")}>
      <VirtueOrb size={size} state={state} className="mt-0.5" />
      <div className="min-w-0">
        <h1 className={clsx("font-semibold tracking-tight", size === "lg" ? "text-xl sm:text-2xl" : "text-base sm:text-lg")}>{line.title}</h1>
        <p className="mt-1 text-[13px] leading-6 text-[color:var(--text-secondary)] sm:text-sm">{line.body}</p>
      </div>
    </div>
  );
}

/** A follow-up remark from Virtue inside a step (small orb, one line). */
export function VirtueAside({ children, state = "idle" }: { children: ReactNode; state?: VirtueOrbState }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-2.5 text-[13px] leading-5">
      <VirtueOrb size="sm" state={state} label="" className="mt-0.5" />
      <div className="min-w-0 text-[color:var(--text-primary)]">{children}</div>
    </div>
  );
}

export function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-[color:var(--text-secondary)]">
        <span>
          Step {current} of {total}
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--track)]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-label="Onboarding progress">
        <div className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <span className="text-[11px] text-[color:var(--text-secondary)]" aria-live="polite">
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Could not save — check your connection" : ""}
    </span>
  );
}

export function StepFooter({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  busy,
  laterHref = ONBOARDING_LATER_HREF,
  secondary,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  laterHref?: string | null;
  secondary?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
        {onBack ? (
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 hover:text-[color:var(--text-primary)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : null}
        {laterHref ? (
          <Link href={laterHref} className="inline-flex min-h-11 items-center rounded-md px-2 hover:text-[color:var(--text-primary)]">
            Do this later
          </Link>
        ) : null}
        {secondary}
      </div>
      {onNext ? (
        <button type="button" onClick={onNext} disabled={nextDisabled || busy} className="btn-primary min-h-11 !px-5 !py-2.5 text-sm disabled:opacity-60">
          {busy ? "Saving…" : nextLabel}
          {!busy ? <ArrowRight className="ml-1.5 h-4 w-4" /> : null}
        </button>
      ) : null}
    </div>
  );
}

export function Field({ id, label, hint, optional, children, error }: { id: string; label: string; hint?: string; optional?: boolean; children: ReactNode; error?: string | null }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? <span className="ml-1 font-normal opacity-70">(optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-[color:var(--text-secondary)]">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-[color:var(--status-bad)]">{error}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, "min-h-11", props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(inputClass, props.className)} />;
}

/** Big, tappable choice cards for one-of questions. */
export function ChoiceCards<T extends string>({ value, onChange, options, name }: { value: T | null; onChange: (v: T) => void; options: { value: T; label: string; hint?: string }[]; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className={clsx("grid gap-2", options.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              "min-h-14 rounded-xl border px-4 py-3 text-left transition-colors",
              active ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-[color:var(--border)] hover:border-[color:var(--text-secondary)]"
            )}
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <span className={clsx("inline-flex h-4 w-4 items-center justify-center rounded-full border", active ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--bg-primary)]" : "border-[color:var(--border)]")}>{active ? <Check className="h-3 w-3" /> : null}</span>
              {o.label}
            </span>
            {o.hint ? <span className="mt-1 block text-xs text-[color:var(--text-secondary)]">{o.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px]">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/** One-tap copy for DNS values. Falls back to selecting the text. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt(`Copy this ${label}:`, value);
        }
      }}
      className={clsx("inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] font-medium", copied ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-[color:var(--border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]")}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Debounced autosave: calls `save` 700ms after the last change. */
export function useAutosave<T>(value: T, save: (v: T) => Promise<boolean>, enabled = true): { state: SaveState; flush: () => Promise<boolean> } {
  const [state, setState] = useState<SaveState>("idle");
  const latest = useRef(value);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  const saveRef = useRef(save);
  const lastSeen = useRef(value);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Leaving the step (Back, "Do this later") must not lose the last edit.
  useEffect(() => () => { if (dirty.current) void saveRef.current(latest.current); }, []);

  useEffect(() => {
    latest.current = value;
    // Same object as last time (initial mount, StrictMode re-run): nothing changed.
    if (value === lastSeen.current) return;
    lastSeen.current = value;
    if (!enabled) return;
    dirty.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setState("saving");
      const ok = await saveRef.current(latest.current);
      dirty.current = !ok;
      setState(ok ? "saved" : "error");
    }, 700);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [value, enabled]);

  const flush = async () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!enabled) return true;
    if (!dirty.current && state !== "error") return true;
    setState("saving");
    const ok = await saveRef.current(latest.current);
    dirty.current = !ok;
    setState(ok ? "saved" : "error");
    return ok;
  };
  return { state, flush };
}
