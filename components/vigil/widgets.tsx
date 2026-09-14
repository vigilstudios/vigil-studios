import type { ReactNode } from "react";
import { clsx } from "clsx";
import { AlertTriangle, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { Tone } from "./ui";

/**
 * Visual widgets for the dashboards. Every one of them is driven by real
 * rows; none invents a trend. Status is always icon + label + colour.
 */

export const toneVar: Record<Tone, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  bad: "var(--status-bad)",
  info: "var(--status-info)",
  neutral: "var(--status-neutral)",
};

export function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  const cls = clsx("h-4 w-4 shrink-0", className);
  const style = { color: toneVar[tone] };
  switch (tone) {
    case "good":
      return <CheckCircle2 className={cls} style={style} aria-hidden />;
    case "warn":
      return <AlertTriangle className={cls} style={style} aria-hidden />;
    case "bad":
      return <XCircle className={cls} style={style} aria-hidden />;
    case "info":
      return <Clock className={cls} style={style} aria-hidden />;
    default:
      return <Circle className={cls} style={style} aria-hidden />;
  }
}

/** Panel: the widget container, with an optional header row. */
export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={clsx("flex min-w-0 flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-2.5">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={clsx("min-w-0 flex-1", padded && "p-4")}>{children}</div>
    </section>
  );
}

/** Status line: icon + label (+ hint). The canonical way to show a state. */
export function StatusLine({ tone, label, hint, size = "md" }: { tone: Tone; label: string; hint?: string | null; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="min-w-0">
      <div className={clsx("flex items-center gap-1.5 font-semibold", size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-[13px]")} style={{ color: toneVar[tone] }}>
        <ToneIcon tone={tone} className={size === "lg" ? "h-5 w-5" : undefined} />
        <span className="truncate">{label}</span>
      </div>
      {hint ? <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">{hint}</p> : null}
    </div>
  );
}

/** KPI tile: label, value, optional hint and tone. */
export function KpiTile({
  label,
  value,
  hint,
  tone,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-secondary)]">{label}</p>
        {tone ? <ToneIcon tone={tone} /> : null}
      </div>
      <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[color:var(--text-secondary)]">{hint}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

/** Meter: a thin bar; the track is a lighter step of the same colour. */
export function Meter({ value, max, tone = "good", label, srLabel }: { value: number; max: number; tone?: Tone; label?: ReactNode; srLabel?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={srLabel}
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: `color-mix(in srgb, ${toneVar[tone]} 22%, transparent)` }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: toneVar[tone] }} />
      </div>
      {label ? <div className="mt-1.5 flex items-center justify-between text-xs text-[color:var(--text-secondary)]">{label}</div> : null}
    </div>
  );
}

/** Distribution bar: stacked segments with 2px gaps and a legend. */
export function DistributionBar({ segments, total }: { segments: { label: string; value: number; tone: Tone }[]; total?: number }) {
  const sum = total ?? segments.reduce((a, s) => a + s.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-[color:var(--track)]">
        {shown.map((s) => (
          <div key={s.label} title={`${s.label}: ${s.value}`} className="h-full" style={{ width: `${(s.value / Math.max(sum, 1)) * 100}%`, background: toneVar[s.tone] }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
            <span className="h-2 w-2 rounded-sm" style={{ background: toneVar[s.tone] }} aria-hidden />
            <span>{s.label}</span>
            <span className="font-medium tabular-nums text-[color:var(--text-primary)]">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stepper: a lifecycle track. `current` is the index of the active step; -1 means nothing started. */
export function Stepper({
  steps,
  current,
  tone = "info",
  done = false,
}: {
  steps: { key: string; label: string }[];
  current: number;
  tone?: Tone;
  done?: boolean;
}) {
  return (
    <ol className="flex items-start gap-0" aria-label="Progress">
      {steps.map((step, i) => {
        const state: "done" | "current" | "todo" = done || i < current ? "done" : i === current ? "current" : "todo";
        const color = state === "todo" ? "var(--track)" : state === "current" ? toneVar[tone] : toneVar.good;
        return (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center">
            {i > 0 ? (
              <span className="absolute left-0 right-1/2 top-[7px] h-[2px]" style={{ background: state === "todo" ? "var(--track)" : toneVar.good }} aria-hidden />
            ) : null}
            {i < steps.length - 1 ? (
              <span className="absolute left-1/2 right-0 top-[7px] h-[2px]" style={{ background: state === "done" ? toneVar.good : "var(--track)" }} aria-hidden />
            ) : null}
            <span
              className={clsx("relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-[color:var(--bg-primary)]", state === "current" && "ring-4")}
              style={{ borderColor: color, ...(state === "current" ? { boxShadow: `0 0 0 4px color-mix(in srgb, ${color} 25%, transparent)` } : {}) }}
              aria-current={state === "current" ? "step" : undefined}
            >
              {state === "done" ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
            </span>
            <span
              className={clsx(
                "mt-2 hidden max-w-full truncate px-1 text-center text-[11px] sm:block",
                state === "current" ? "font-semibold text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Checklist: each item carries its own state icon. */
export function Checklist({ items }: { items: { label: ReactNode; detail?: ReactNode; tone: Tone }[] }) {
  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
          <ToneIcon tone={item.tone} className="mt-0.5" />
          <div className="min-w-0">
            <div className="text-[13px]">{item.label}</div>
            {item.detail ? <div className="mt-0.5 break-all font-mono text-[11px] text-[color:var(--text-secondary)]">{item.detail}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Timeline: activity rows with an icon rail. */
export function Timeline({ items, empty }: { items: { key: string; tone: Tone; title: string; meta?: string; when: string }[]; empty: string }) {
  if (items.length === 0) return <p className="text-xs text-[color:var(--text-secondary)]">{empty}</p>;
  return (
    <ol className="relative">
      <span className="absolute bottom-2 left-[7px] top-2 w-px bg-[color:var(--border)]" aria-hidden />
      {items.map((item) => (
        <li key={item.key} className="relative flex items-start gap-3 py-1.5">
          <span className="relative z-10 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--bg-primary)]">
            <ToneIcon tone={item.tone} className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px]">{item.title}</span>
              <span className="shrink-0 text-[11px] text-[color:var(--text-secondary)]">{item.when}</span>
            </div>
            {item.meta ? <div className="text-[11px] text-[color:var(--text-secondary)]">{item.meta}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
