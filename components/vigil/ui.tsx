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
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 sm:p-6",
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
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-secondary)]",
  good: "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)]",
  warn: "bg-[color-mix(in_srgb,#f59e0b_18%,transparent)] text-[#d97706]",
  bad: "bg-[color-mix(in_srgb,#ef4444_16%,transparent)] text-[#ef4444]",
  info: "bg-[color-mix(in_srgb,#3b82f6_16%,transparent)] text-[#3b82f6]",
};

export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
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
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-secondary)]">{label}</p>
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
  "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3.5 py-2.5 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]";

export const labelClass = "mb-1.5 block text-sm font-medium";

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
      <table className="w-full min-w-[40rem] text-sm">{children}</table>
    </div>
  );
}

export const thClass =
  "bg-[color:var(--bg-surface-soft)] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]";
export const tdClass = "border-t border-[color:var(--border)] px-4 py-3 align-top";
