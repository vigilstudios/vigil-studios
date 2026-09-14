import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Small, dependency-free building blocks for the product surfaces. They use
 * the same CSS tokens as the marketing site so the two never drift.
 */

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={clsx(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[color:var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info";

const toneVars: Record<Tone, string> = {
  neutral: "var(--status-neutral, #71717a)",
  good: "var(--status-good, #10d45a)",
  warn: "var(--status-warn, #fab219)",
  bad: "var(--status-bad, #ef4444)",
  info: "var(--status-info, #60a5fa)",
};

/** Status is icon + label + colour, never colour alone. */
export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const color = toneVars[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <StatusGlyph tone={tone} />
      {children}
    </span>
  );
}

function StatusGlyph({ tone }: { tone: Tone }) {
  // Tiny inline glyphs so the pill never depends on colour alone.
  const common = { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": true } as const;
  switch (tone) {
    case "good":
      return <svg {...common}><path d="M2 5.2l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "warn":
      return <svg {...common}><path d="M5 1.5l4 7H1z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M5 4v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case "bad":
      return <svg {...common}><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    case "info":
      return <svg {...common}><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M5 5v2M5 3.2v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    default:
      return <svg {...common}><circle cx="5" cy="5" r="2.5" fill="currentColor" /></svg>;
  }
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--border)] p-6 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{hint}</p> : null}
    </div>
  );
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-[color:var(--border)]">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <dt className="text-sm text-[color:var(--text-secondary)]">{item.label}</dt>
          <dd className="text-sm font-medium sm:text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(variant === "primary" ? "btn-primary" : "btn-secondary", "text-sm", className)}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 py-2 text-[13px] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]";

export const labelClass = "mb-1 block text-xs font-medium text-[color:var(--text-secondary)]";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="mt-3 rounded-lg border border-[color:var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-2 text-sm text-[color:var(--accent)]">
      {message}
    </p>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-[color:var(--border)]", className)}>
      <table className="w-full min-w-[40rem] text-[13px]">{children}</table>
    </div>
  );
}

export const thClass =
  "bg-[color:var(--bg-surface-soft)] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]";
export const tdClass = "border-t border-[color:var(--border)] px-3 py-2.5 align-top";
