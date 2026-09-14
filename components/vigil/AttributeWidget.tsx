import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ToneIcon } from "./widgets";
import type { Tone } from "./ui";

/**
 * One fact about the site, as its own card: an icon, a label, the value,
 * an optional hint and an optional action. Standalone on purpose — the
 * Website page lays several of these side by side without grouping them.
 */
export function AttributeWidget({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
  action,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("flex min-w-0 flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4", className)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
          <span className="text-[color:var(--text-secondary)]">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        {tone !== "neutral" ? <ToneIcon tone={tone} /> : null}
      </header>
      <div className="mt-3 min-w-0 flex-1">
        <div className="truncate text-base font-semibold" title={typeof value === "string" ? value : undefined}>{value}</div>
        {hint ? <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{hint}</p> : null}
      </div>
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  );
}

export function WidgetLink({ href, children, external = false, primary = false }: { href: string; children: ReactNode; external?: boolean; primary?: boolean }) {
  const cls = clsx(primary ? "btn-primary" : "btn-secondary", "!px-2.5 !py-1.5 text-xs");
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
